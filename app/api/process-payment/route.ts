// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/process-payment
//  1. Validates token + env
//  2. Creates MercadoPago payment
//  3. On approval:
//     a. Deducts stock from Google Sheets
//     b. Logs sale to "Ventas" sheet
//     c. Creates the Skydropx shipment + pickup synchronously
//     d. Returns 200 to the user immediately
//     e. after(): sends the transactional email with tracking number once the
//        response has been sent (works on self-hosted deploys, e.g. Railway)
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse, after } from "next/server";
import MercadoPagoConfig, { Payment } from "mercadopago";
import type { CartItem } from "@/lib/types";
import type { ShippingAddress } from "@/store/checkoutStore";
import { deductStock, logSale } from "@/lib/googleSheets";
import { createSkydropxShipment } from "@/lib/skydropx";

// Vercel-only: extends the function timeout to 60 s on Vercel Pro.
// Railway (self-hosted) ignores this export; its own server timeout applies.
export const maxDuration = 60;

let _client: MercadoPagoConfig | null = null;
let _payment: Payment | null = null;

function getPayment(): Payment {
  if (!_payment) {
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN!;
    _client = new MercadoPagoConfig({ accessToken: token, options: { timeout: 5000 } });
    _payment = new Payment(_client);
  }
  return _payment;
}

// ── Rejection reason helper ───────────────────────────────────────────────────
function getRejectMessage(statusDetail: string): string {
  const map: Record<string, string> = {
    cc_rejected_bad_filled_card_number: "Número de tarjeta incorrecto. Verifica los datos e intenta de nuevo.",
    cc_rejected_bad_filled_date:        "Fecha de vencimiento incorrecta. Verifica e intenta de nuevo.",
    cc_rejected_bad_filled_other:       "Dato de tarjeta incorrecto. Verifica e intenta de nuevo.",
    cc_rejected_bad_filled_security_code: "CVV/CVC incorrecto. Verifica el código de seguridad.",
    cc_rejected_blacklist:              "No pudimos procesar tu pago. Intenta con otra tarjeta.",
    cc_rejected_call_for_authorize:     "Tu banco necesita que autorices este pago. Llámales o intenta con otra tarjeta.",
    cc_rejected_card_disabled:          "Tu tarjeta está desactivada. Contáctate con tu banco.",
    cc_rejected_card_error:             "No pudimos procesar tu tarjeta. Intenta de nuevo o usa otra.",
    cc_rejected_duplicated_payment:     "Pago duplicado. Ya realizaste este pago recientemente.",
    cc_rejected_high_risk:              "Pago rechazado por seguridad. Intenta con otra tarjeta o método de pago.",
    cc_rejected_insufficient_amount:    "Fondos insuficientes en tu tarjeta.",
    cc_rejected_invalid_installments:   "No se permiten meses sin intereses con esta tarjeta.",
    cc_rejected_max_attempts:           "Alcanzaste el límite de intentos. Intenta más tarde o usa otra tarjeta.",
    cc_rejected_other_reason:           "Tu banco rechazó el pago. Contáctate con ellos o usa otra tarjeta.",
  };
  return map[statusDetail] ?? "Pago rechazado. Intenta con otra tarjeta o método de pago.";
}

// ── Main handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Environment check
  if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
    return NextResponse.json(
      { error: "El procesador de pagos no está configurado. Agrega MERCADOPAGO_ACCESS_TOKEN en las variables de entorno de Vercel." },
      { status: 503 }
    );
  }

  try {
    const body = await req.json() as {
      formData: {
        token?: string;
        payment_method_id?: string;
        installments?: number;
        issuer_id?: string;
        payer?: { email: string; identification?: { type: string; number: string } };
      };
      items: CartItem[];
      address: ShippingAddress;
      total: number;
      vipCode: string;
    };

    const { formData, items, address, total, vipCode } = body;

    if (!formData || !address?.email) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    // Build payment payload
    const paymentPayload = {
      transaction_amount: total,
      token:              formData.token,
      description:        `Zoa — ${items.map((i) => `${i.product.name} (${i.size})`).join(", ")}`,
      installments:       formData.installments ?? 1,
      payment_method_id:  formData.payment_method_id,
      issuer_id:          formData.issuer_id ? Number(formData.issuer_id) : undefined,
      payer: {
        email:          formData.payer?.email ?? address.email,
        identification: formData.payer?.identification,
      },
      metadata: {
        // Full address object so the MP webhook can create the shipment too
        address: {
          fullName:    address.fullName,
          email:       address.email,
          phone:       address.phone,
          street:      address.street,
          numExterior: address.numExterior ?? "",
          numInterior: address.numInterior ?? "",
          colonia:     address.colonia ?? "",
          city:        address.city,
          state:       address.state,
          zip:         address.zip,
        },
        items: items.map((i) => ({
          productId: i.product.id,
          size:      i.size,
          quantity:  i.quantity,
        })),
        total,
        vipCode,
      },
    };

    // Validate card token
    const isCash     = formData.payment_method_id === "oxxo" || formData.payment_method_id === "paycash";
    const isTransfer = formData.payment_method_id?.startsWith("pse") || formData.payment_method_id === "pix";
    if (!isCash && !isTransfer && !formData.token) {
      return NextResponse.json({ error: "Token de tarjeta inválido. Por favor vuelve a ingresar los datos de tu tarjeta." }, { status: 400 });
    }

    // Create payment
    let result;
    try {
      result = await getPayment().create({ body: paymentPayload });
    } catch (mpErr: unknown) {
      const mpMessage = mpErr instanceof Error ? mpErr.message : JSON.stringify(mpErr);
      console.error("[process-payment] MP SDK error:", mpMessage);
      return NextResponse.json({ error: `Error de MercadoPago: ${mpMessage}` }, { status: 502 });
    }

    const orderId = `ZOA-${result.id ?? Date.now()}`;
    // Always log so Vercel shows the exact rejection reason
    console.log(`[process-payment] Payment result — id:${result.id} status:${result.status} detail:${result.status_detail} method:${result.payment_method_id}`);

    if (result.status === "approved") {
      // 1. Deduct stock
      try { await deductStock(items); }
      catch (e) { console.error("Stock deduction failed:", e); }

      // 2. Log sale to Sheets
      try {
        await logSale({
          orderId,
          date:          new Date().toISOString(),
          customerName:  address.fullName,
          customerEmail: address.email,
          customerPhone: address.phone,
          address: [
          address.street,
          address.numExterior ? `#${address.numExterior}` : "",
          address.numInterior ? `Int. ${address.numInterior}` : "",
          address.city, address.state, address.zip,
        ].filter(Boolean).join(", "),
          items:         items.map((ci) => ({
            name:  ci.product.name,
            sku:   ci.product.id,
            size:  ci.size,
            qty:   ci.quantity,
            price: ci.product.price,
          })),
          total,
          paymentMethod: formData.payment_method_id ?? "tarjeta",
          status:        result.status ?? "approved",
          vipCode,
        });
      } catch (e) { console.error("Sale log failed:", e); }

      // 3. Create Skydropx shipment SYNCHRONOUSLY (before response)
      //    On Vercel Hobby, waitUntil has only ~5-10s which is NOT enough for
      //    the full Skydropx flow (token + quotation + polling + shipment + pickup).
      //    By doing it before the response, we ensure the pickup gets scheduled.
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zoa.mx";

      let trackingNumber: string | null = null;
      let labelUrl:       string | null = null;
      let carrier:        string | null = null;
      let skydropxError:  string | null = null;

      if (process.env.SKYDROPX_API_KEY) {
        try {
          const shipment = await createSkydropxShipment(
            {
              ...address,
              numExterior: address.numExterior ?? "",
              numInterior: address.numInterior ?? "",
            },
            orderId,
          );
          trackingNumber = shipment?.trackingNumber ?? null;
          labelUrl       = shipment?.labelUrl       ?? null;
          carrier        = shipment?.carrier        ?? null;
          // Surface pickup-specific error even if the overall shipment succeeded
          if (shipment?.pickupError) {
            skydropxError = `Pickup failed: ${shipment.pickupError}`;
          }
          console.log("[process-payment] Skydropx done — tracking:", trackingNumber, "carrier:", carrier, "pickup:", shipment?.pickupNumber, "pickupError:", shipment?.pickupError);
        } catch (e) {
          skydropxError = e instanceof Error ? e.message : String(e);
          console.error("[process-payment] Skydropx failed:", skydropxError);
        }
      }

      // 4. Send email after the response is sent. after() runs once the
      //    response has finished and works on self-hosted deploys (Railway),
      //    unlike the old Vercel-only waitUntil helper.
      after(async () => {
        try {
          const res = await fetch(`${baseUrl}/api/webhooks/payment-success`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paymentId: result.id,
              status:    result.status,
              items, address, total, vipCode,
              orderId,
              trackingNumber, labelUrl, carrier,
              skydropxError,
            }),
          });
          if (!res.ok) {
            const text = await res.text().catch(() => "");
            console.error("[process-payment] Email webhook failed:", res.status, text);
            return;
          }
          console.log("[process-payment] Email webhook triggered — trackingNumber:", trackingNumber, "error:", skydropxError);
        } catch (e) {
          console.error("[process-payment] Email trigger failed:", e);
        }
      });

      return NextResponse.json({
        status:       result.status,
        paymentId:    result.id,
        statusDetail: result.status_detail,
        orderId,
      });
    }

    // in_process / pending (e.g. OXXO cash, bank transfer) —
    // return 202 Accepted so the frontend's !res.ok check passes and the
    // status-based routing logic can redirect to /checkout/success?pendiente=1
    if (result.status === "in_process" || result.status === "pending") {
      return NextResponse.json(
        { status: result.status, statusDetail: result.status_detail, paymentId: result.id, orderId },
        { status: 202 }
      );
    }

    // Truly rejected — return 402 so the frontend shows an error and keeps
    // the brick open for the user to retry with another card.
    const statusDetail = result.status_detail ?? "";
    return NextResponse.json(
      { error: getRejectMessage(statusDetail), status: result.status, statusDetail, paymentId: result.id, orderId },
      { status: 402 }
    );

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[process-payment]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
