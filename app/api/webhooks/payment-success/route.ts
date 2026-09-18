// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/webhooks/payment-success
//  Sends TWO transactional emails via Resend:
//  1. Customer receipt — confirmation, items, shipping address + tracking
//  2. Admin alert     — full order details + Skydropx label URL
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import type { CartItem } from "@/lib/types";
import type { ShippingAddress } from "@/store/checkoutStore";
import { FREE_SHIPPING_CODE, FREE_SHIPPING_THRESHOLD, SHIPPING_FLAT } from "@/lib/shipping";

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not set");
    _resend = new Resend(key);
  }
  return _resend;
}

const ADMIN_EMAILS = ["carmen@zoa.mx", "zoa6521@gmail.com", "jgegmz@gmail.com"];
const FROM_EMAIL   = "Zoa <hola@zoa.mx>";

// ── HTML helpers ──────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(n);

function baseWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Zoa</title>
</head>
<body style="margin:0;padding:0;background:#FAF8F5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#1C1917;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FAF8F5">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border:1px solid #EDE8E2;">
        <!-- Header -->
        <tr>
          <td style="background:#1C1917;padding:28px 40px;text-align:center;">
            <span style="font-family:Georgia,serif;font-size:26px;letter-spacing:0.3em;color:#FAF8F5;text-transform:uppercase;">Zoa</span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#F2EDE7;padding:20px 40px;text-align:center;border-top:1px solid #EDE8E2;">
            <p style="margin:0;font-size:11px;color:#A89F95;letter-spacing:0.15em;">
              zoa.mx · Jesús del Monte, EdoMex · 5521068191
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function itemsTable(items: CartItem[]): string {
  const rows = items
    .map(
      (ci) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #EDE8E2;font-size:14px;">${ci.product.name}</td>
        <td style="padding:10px 0;border-bottom:1px solid #EDE8E2;font-size:13px;color:#6E655C;">Talla ${ci.size}</td>
        <td style="padding:10px 0;border-bottom:1px solid #EDE8E2;font-size:13px;text-align:center;color:#6E655C;">×${ci.quantity}</td>
        <td style="padding:10px 0;border-bottom:1px solid #EDE8E2;font-size:14px;text-align:right;">${fmt(ci.product.price * ci.quantity)}</td>
      </tr>`
    )
    .join("");

  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
    <thead>
      <tr style="border-bottom:2px solid #1C1917;">
        <th style="text-align:left;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;padding-bottom:10px;font-weight:400;color:#A89F95;">Producto</th>
        <th style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;padding-bottom:10px;font-weight:400;color:#A89F95;">Talla</th>
        <th style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;padding-bottom:10px;font-weight:400;color:#A89F95;">Cant.</th>
        <th style="text-align:right;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;padding-bottom:10px;font-weight:400;color:#A89F95;">Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}

// ── Skydropx tracking page for Zoa ────────────────────────────────────────
const TRACKING_URL = "https://tracking.skydropx.com/es-MX/page/zoa";

// ── Customer Receipt HTML ──────────────────────────────────────────────────────
function buildCustomerEmail(params: {
  address: ShippingAddress;
  items: CartItem[];
  total: number;
  paymentId: string | number;
  vipCode: string;
  orderId?: string;
  trackingNumber?: string | null;
  carrier?: string | null;
}): string {
  const { address, items, total, paymentId, vipCode, orderId, trackingNumber, carrier } = params;
  const subtotal = items.reduce((s, ci) => s + ci.product.price * ci.quantity, 0);
  const shipping = vipCode.trim().toUpperCase() === FREE_SHIPPING_CODE || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
  const isVip = vipCode === "PROBADOR";

  const trackingBlock = trackingNumber
    ? `<div style="background:#F0F7F0;padding:20px;margin-top:16px;border-left:3px solid #27ae60;">
      <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#A89F95;">Tu envío está en camino 🚚</p>
      <p style="margin:0 0 12px;font-size:13px;color:#1C1917;">
        ${carrier ?? "Paquetería"} · Número de rastreo: <strong>${trackingNumber}</strong>
      </p>
      <a href="${TRACKING_URL}" target="_blank"
        style="display:inline-block;background:#1C1917;color:#FAF8F5;padding:10px 22px;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;text-decoration:none;">
        Rastrear mi pedido →
      </a>
    </div>`
    : `<div style="background:#FAF8F5;padding:16px 20px;margin-top:16px;border-left:3px solid #C9A96E;">
      <p style="margin:0;font-size:13px;color:#6E655C;">📦 Tu pedido está siendo preparado con cariño. Te notificaremos cuando sea enviado.</p>
    </div>`;

  const content = `
    <h2 style="font-family:Georgia,serif;font-size:24px;font-weight:400;margin:0 0 8px;letter-spacing:0.05em;">
      ¡Gracias por tu compra, ${address.fullName.split(" ")[0]}! 🎀
    </h2>
    <p style="font-size:13px;color:#6E655C;margin:0 0 28px;line-height:1.6;">
      Recibimos tu pedido y lo estamos preparando con todo el cariño.
    </p>

    <div style="background:#FAF8F5;padding:16px 20px;border-left:3px solid #C9A96E;margin-bottom:28px;">
      <p style="margin:0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#A89F95;">Número de pedido</p>
      <p style="margin:4px 0 0;font-size:16px;font-family:Georgia,serif;color:#1C1917;">${orderId ?? `#${paymentId}`}</p>
    </div>

    ${itemsTable(items)}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      ${!isVip ? `
      <tr>
        <td style="font-size:13px;color:#6E655C;padding:4px 0;">Subtotal</td>
        <td style="text-align:right;font-size:13px;color:#6E655C;">${fmt(subtotal)}</td>
      </tr>
      <tr>
        <td style="font-size:13px;color:#6E655C;padding:4px 0;">Envío</td>
        <td style="text-align:right;font-size:13px;color:#6E655C;">${shipping === 0 ? "Gratis" : fmt(shipping)}</td>
      </tr>` : `
      <tr>
        <td style="font-size:13px;color:#C9A96E;padding:4px 0;" colspan="2">Depósito Probador a Domicilio VIP</td>
      </tr>`}
      <tr>
        <td style="font-size:18px;font-family:Georgia,serif;padding-top:12px;border-top:1px solid #EDE8E2;">Total pagado</td>
        <td style="text-align:right;font-size:18px;font-family:Georgia,serif;padding-top:12px;border-top:1px solid #EDE8E2;">${fmt(total)}</td>
      </tr>
    </table>

    <div style="background:#FAF8F5;padding:20px;margin-top:28px;">
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#A89F95;">Dirección de envío</p>
      <p style="margin:0;font-size:13px;line-height:1.7;">
        ${address.street}${address.numExterior ? ` #${address.numExterior}` : ""}${address.numInterior ? ` Int. ${address.numInterior}` : ""}<br/>
        ${address.colonia ? `Col. ${address.colonia}<br/>` : ""}${address.city}<br/>
        ${address.state} ${address.zip}<br/>
        📱 ${address.phone}
      </p>
    </div>

    ${trackingBlock}

    <p style="font-size:13px;color:#6E655C;margin:28px 0 0;line-height:1.6;">
      Si tienes alguna duda, responde a este correo o escríbenos al <a href="https://wa.me/525521068191" style="color:#C9A96E;">5521068191</a>.
    </p>`;

  return baseWrapper(content);
}

// ── Admin Alert HTML ─────────────────────────────────────────────────────────
function buildAdminEmail(params: {
  address: ShippingAddress;
  items: CartItem[];
  total: number;
  paymentId: string | number;
  vipCode: string;
  status: string;
  orderId?: string;
  trackingNumber?: string | null;
  labelUrl?: string | null;
  carrier?: string | null;
  skydropxError?: string | null;
}): string {
  const { address, items, total, paymentId, vipCode, status, orderId, trackingNumber, labelUrl, carrier, skydropxError } = params;

  const shipBlock = trackingNumber
    ? `<div style="background:#F0F7F0;padding:16px 20px;margin-top:20px;border-left:3px solid #27ae60;">
      <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#A89F95;">Envío generado ✅</p>
      <p style="margin:0 0 8px;font-size:14px;font-weight:bold;color:#1C1917;">${carrier ?? ""} — Tracking: ${trackingNumber}</p>
      <a href="${TRACKING_URL}" target="_blank"
        style="display:inline-block;background:#1C1917;color:#FAF8F5;padding:8px 18px;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;text-decoration:none;margin-right:10px;">
        Rastrear envío →
      </a>
      ${labelUrl ? `<a href="${labelUrl}" style="color:#C9A96E;font-size:12px;display:inline-block;margin-top:6px;">📋 Descargar guía de envío</a>` : ""}
    </div>`
    : `<p style="font-size:12px;color:#A89F95;margin:20px 0 0;">
      ⚠️ Guía Skydropx no generada automáticamente — verificar manualmente.
      ${skydropxError ? `<br/><span style="color:#e74c3c;font-size:11px;">Error: ${skydropxError}</span>` : ""}
    </p>`;

  const content = `
    <h2 style="font-family:Georgia,serif;font-size:22px;font-weight:400;margin:0 0 6px;">
      🛍️ Nuevo pedido recibido
    </h2>
    <p style="font-size:13px;color:#6E655C;margin:0 0 24px;">Pago: <strong style="color:#1C1917;">${status.toUpperCase()}</strong> · Pedido: <strong style="color:#1C1917;">${orderId ?? `#${paymentId}`}</strong>${vipCode ? ` · VIP: ${vipCode}` : ""}</p>

    <div style="background:#FAF8F5;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#A89F95;">Cliente</p>
      <p style="margin:0;font-size:14px;line-height:1.7;">
        <strong>${address.fullName}</strong><br/>
        📧 <a href="mailto:${address.email}" style="color:#C9A96E;">${address.email}</a><br/>
        📱 <a href="tel:${address.phone}" style="color:#C9A96E;">${address.phone}</a>
      </p>
    </div>

    <div style="background:#FAF8F5;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#A89F95;">Dirección</p>
      <p style="margin:0;font-size:14px;line-height:1.7;">
        ${address.street}${address.numExterior ? ` #${address.numExterior}` : ""}<br/>
        ${address.numInterior ? `Int. ${address.numInterior}<br/>` : ""}
        ${address.colonia ? `Col. ${address.colonia}<br/>` : ""}
        ${address.city}, ${address.state} ${address.zip}
      </p>
    </div>

    ${itemsTable(items)}

    <div style="background:#1C1917;color:#FAF8F5;padding:16px 20px;margin-top:20px;text-align:right;">
      <p style="margin:0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#A89F95;">Total</p>
      <p style="margin:4px 0 0;font-size:24px;font-family:Georgia,serif;">${fmt(total)}</p>
    </div>

    ${shipBlock}

    <p style="font-size:12px;color:#A89F95;margin:12px 0 0;">
      ✅ Stock descontado automáticamente en Google Sheets.
    </p>`;

  return baseWrapper(content);
}

// ── Route Handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      paymentId:       string | number;
      status:          string;
      items:           CartItem[];
      address:         ShippingAddress;
      total:           number;
      vipCode:         string;
      orderId?:        string;
      trackingNumber?: string | null;
      labelUrl?:       string | null;
      carrier?:        string | null;
      skydropxError?:  string | null;
    };

    const { paymentId, status, items, address, total, vipCode, orderId,
            trackingNumber, labelUrl, carrier, skydropxError } = body;

    if (!address?.email || !items?.length) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    // ── Send both emails concurrently ─────────────────────────────────────
    const [customerResult, adminResult] = await Promise.allSettled([
      getResend().emails.send({
        from: FROM_EMAIL,
        to: [address.email],
        subject: `🎀 Confirmación de compra Zoa · #${paymentId}`,
        html: buildCustomerEmail({ address, items, total, paymentId, vipCode, orderId, trackingNumber, carrier }),
      }),
      getResend().emails.send({
        from: FROM_EMAIL,
        to: ADMIN_EMAILS,
        subject: `🛍️ Nuevo pedido · ${address.fullName} · ${fmt(total)} · ${orderId ?? `#${paymentId}`}`,
        html: buildAdminEmail({ address, items, total, paymentId, vipCode, status, orderId, trackingNumber, labelUrl, carrier, skydropxError }),
      }),
    ]);

    const errors = [customerResult, adminResult]
      .filter((r) => r.status === "rejected")
      .map((r) => (r as PromiseRejectedResult).reason);

    if (errors.length) {
      console.error("[payment-success webhook] Email errors:", errors);
    }

    return NextResponse.json({
      ok: true,
      customer: customerResult.status,
      admin: adminResult.status,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    console.error("[payment-success webhook]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
