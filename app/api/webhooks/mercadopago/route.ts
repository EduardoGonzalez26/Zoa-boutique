// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/webhooks/mercadopago
//
//  Flujo (Checkout Pro):
//  1. Verifica la firma `x-signature` con MERCADOPAGO_WEBHOOK_SECRET
//     (falla cerrado en production; en development permite sin env + warning).
//  2. Idempotencia por `paymentId`/`orderId`: si el pedido ya tiene una fila
//     final en la pestaña "Ventas", responde 200 sin repetir stock/envío/correo.
//  3. Consulta el pago en MercadoPago; ignora los no aprobados.
//  4. Descuenta stock (idempotente por orderId en Apps Script) y registra venta.
//  5. Crea el envío Skydropx y dispara el correo interno.
//  6. Devuelve 5xx si falla el procesamiento para que MercadoPago reintente.
//
//  Los pagos creados por el Payment Brick (`metadata.source === "brick"`) ya
//  fueron procesados por /api/process-payment: este webhook los ignora para no
//  duplicar stock, envío ni correo.
// ─────────────────────────────────────────────────────────────────────────────

import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { Payment } from "mercadopago";
import { mpClient } from "@/lib/mercadopago";
import {
  deductStock,
  findSaleStatusByOrderId,
  getProducts,
  logSale,
} from "@/lib/googleSheets";
import { createSkydropxShipment } from "@/lib/skydropx";
import type {
  Brand,
  CartItem,
  Product,
  SaleConsent,
  Size,
  WebhookPayload,
} from "@/lib/types";
import type { ShippingAddress } from "@/store/checkoutStore";

const BRAND: Brand = "ZOA";
const VALID_SIZES: readonly Size[] = ["XS", "S", "M", "L", "LOV", "XL"];

// Idempotencia en memoria por instancia (la persistente vive en "Ventas").
const processedPaymentIds = new Map<string, number>();
const inFlight = new Map<string, Promise<void>>();
const PROCESSED_TTL_MS = 24 * 60 * 60 * 1000;
const PROCESSED_MAX = 1_000;

function markProcessed(paymentId: string): void {
  const now = Date.now();
  if (processedPaymentIds.size >= PROCESSED_MAX) {
    for (const [id, at] of processedPaymentIds) {
      if (now - at > PROCESSED_TTL_MS) processedPaymentIds.delete(id);
    }
    // Si sigue lleno, elimina la entrada más antigua.
    if (processedPaymentIds.size >= PROCESSED_MAX) {
      const oldest = processedPaymentIds.keys().next().value;
      if (oldest !== undefined) processedPaymentIds.delete(oldest);
    }
  }
  processedPaymentIds.set(paymentId, now);
}

// ── Firma MercadoPago ────────────────────────────────────────────────────────

interface SignatureCheck {
  ok: boolean;
  status?: number;
  reason?: string;
}

/**
 * Manifiesto oficial de MP:
 *   id:<data.id>;request-id:<x-request-id>;ts:<ts>;
 * El header x-request-id se omite del manifiesto si no viene.
 */
function verifySignature(req: NextRequest, dataId: string): SignatureCheck {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[webhook/mp] MERCADOPAGO_WEBHOOK_SECRET no configurado — se rechaza el webhook.",
      );
      return { ok: false, status: 503, reason: "not_configured" };
    }
    console.warn(
      "[webhook/mp] MERCADOPAGO_WEBHOOK_SECRET no configurado; se omite la firma en development.",
    );
    return { ok: true };
  }

  const signature = req.headers.get("x-signature") ?? "";
  const requestId = req.headers.get("x-request-id") ?? "";

  if (!signature) {
    return { ok: false, status: 401, reason: "missing_signature" };
  }

  const parts = new Map<string, string>();
  for (const chunk of signature.split(",")) {
    const index = chunk.indexOf("=");
    if (index === -1) continue;
    parts.set(
      chunk.slice(0, index).trim().toLowerCase(),
      chunk.slice(index + 1).trim(),
    );
  }

  const ts = parts.get("ts");
  const v1 = parts.get("v1");
  if (!ts || !v1) {
    return { ok: false, status: 401, reason: "invalid_signature" };
  }

  let manifest = `id:${dataId};`;
  if (requestId) manifest += `request-id:${requestId};`;
  manifest += `ts:${ts};`;

  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(v1, "utf8");

  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, status: 401, reason: "invalid_signature" };
  }

  return { ok: true };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

interface RawConsent {
  privacy?: unknown;
  terms?: unknown;
  acceptedAt?: unknown;
}

function normalizeConsent(raw: RawConsent | undefined | null): SaleConsent | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const acceptedAt =
    typeof raw.acceptedAt === "string" && !Number.isNaN(Date.parse(raw.acceptedAt))
      ? raw.acceptedAt
      : new Date().toISOString();
  return {
    privacy: raw.privacy === true,
    terms: raw.terms === true,
    acceptedAt,
  };
}

interface PaymentMetadata {
  items?: { productId?: unknown; size?: unknown; quantity?: unknown }[];
  address?: {
    fullName?: string;
    email?: string;
    phone?: string;
    street?: string;
    numExterior?: string;
    numInterior?: string;
    colonia?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  total?: unknown;
  vipCode?: unknown;
  discountAmount?: unknown;
  couponCode?: unknown;
  source?: unknown;
  consent?: RawConsent;
}

function toStringOrEmpty(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

// ── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as WebhookPayload;

    // data.id puede venir en la query (`?data.id=123`) o en el body.
    const queryDataId =
      req.nextUrl.searchParams.get("data.id") ??
      req.nextUrl.searchParams.get("data_id") ??
      "";
    const bodyDataId = body.data?.id != null ? String(body.data.id) : "";
    const dataId = queryDataId || bodyDataId;

    const signature = verifySignature(req, dataId);
    if (!signature.ok) {
      console.warn("[webhook/mp] Firma rechazada:", signature.reason);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: signature.status ?? 401 },
      );
    }

    const eventType =
      body.type ?? (body as unknown as { topic?: string }).topic;
    if (eventType !== "payment") {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const paymentId = dataId || bodyDataId;
    if (!paymentId) {
      return NextResponse.json({ error: "Missing payment ID" }, { status: 400 });
    }

    const orderId = `ZOA-${paymentId}`;

    // Otra instancia/request está procesando el mismo pago: espera y responde.
    const pending = inFlight.get(paymentId);
    if (pending) {
      try {
        await pending;
        return NextResponse.json(
          { received: true, duplicate: true },
          { status: 200 },
        );
      } catch {
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
      }
    }

    if (processedPaymentIds.has(paymentId)) {
      return NextResponse.json(
        { received: true, duplicate: true },
        { status: 200 },
      );
    }

    // Marca persistente: fila de venta final en la pestaña "Ventas".
    let priorStatus;
    try {
      priorStatus = await findSaleStatusByOrderId(orderId);
    } catch (idempotencyError) {
      console.error(
        `[webhook/mp][ALERT] no se pudo verificar idempotencia de ${orderId}`,
        idempotencyError,
      );
      return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }

    if (
      priorStatus &&
      priorStatus !== "pending_fulfillment" &&
      priorStatus !== "processing"
    ) {
      markProcessed(paymentId);
      return NextResponse.json(
        { received: true, duplicate: true },
        { status: 200 },
      );
    }

    let release!: () => void;
    let fail!: (error: unknown) => void;
    const gate = new Promise<void>((resolve, reject) => {
      release = resolve;
      fail = reject;
    });
    // Evita unhandledRejection si no hay otro request esperando esta promesa.
    void gate.catch(() => undefined);
    inFlight.set(paymentId, gate);

    try {
      // ── Fetch Payment Details from MP API ────────────────────────────────
      const paymentClient = new Payment(mpClient);
      const payment = await paymentClient.get({ id: paymentId });

      console.log(
        "[webhook/mp] Payment status:",
        payment.status,
        "amount:",
        payment.transaction_amount,
      );

      if (payment.status !== "approved") {
        release();
        return NextResponse.json(
          { received: true, status: payment.status },
          { status: 200 },
        );
      }

      const metadata = payment.metadata as PaymentMetadata | null;

      // Los pagos del Brick ya se procesaron en /api/process-payment.
      if (metadata?.source === "brick") {
        markProcessed(paymentId);
        release();
        return NextResponse.json(
          { received: true, source: "brick", duplicate: true },
          { status: 200 },
        );
      }

      const rawItems = Array.isArray(metadata?.items) ? metadata.items : [];
      if (rawItems.length === 0) {
        console.warn("[webhook/mp] No cart items in metadata — skipping");
        markProcessed(paymentId);
        release();
        return NextResponse.json(
          { received: true, skipped: "no_items" },
          { status: 200 },
        );
      }

      const cartItems: CartItem[] = [];
      for (const item of rawItems) {
        const productId = toStringOrEmpty(item?.productId).trim();
        const size = item?.size as Size;
        const quantity = Number(item?.quantity);

        if (
          !productId ||
          !VALID_SIZES.includes(size) ||
          !Number.isInteger(quantity) ||
          quantity <= 0 ||
          quantity > 100
        ) {
          console.error("[webhook/mp] Invalid item metadata — skipping", {
            paymentId,
          });
          markProcessed(paymentId);
          release();
          return NextResponse.json(
            { received: true, skipped: "invalid_items" },
            { status: 200 },
          );
        }

        cartItems.push({
          product: { id: productId } as Product,
          size,
          quantity,
        });
      }

      // Enriquecer con el catálogo para el log/email (el stock sólo usa id/talla).
      let catalogById = new Map<string, Product>();
      try {
        const catalog = await getProducts({ fresh: true });
        catalogById = new Map(catalog.map((product) => [product.id, product]));
      } catch (catalogError) {
        console.warn(
          "[webhook/mp] Catalog enrichment failed; se registra con datos mínimos",
          catalogError,
        );
      }
      const saleItems = cartItems.map((item) => {
        const product = catalogById.get(item.product.id);
        return product ? { ...item, product } : item;
      });

      const metadataAddress = metadata?.address;
      const addressForEmail: ShippingAddress | null = metadataAddress?.email
        ? {
            fullName:    toStringOrEmpty(metadataAddress.fullName),
            email:       toStringOrEmpty(metadataAddress.email),
            phone:       toStringOrEmpty(metadataAddress.phone),
            street:      toStringOrEmpty(metadataAddress.street),
            numExterior: toStringOrEmpty(metadataAddress.numExterior),
            numInterior: toStringOrEmpty(metadataAddress.numInterior),
            colonia:     toStringOrEmpty(metadataAddress.colonia),
            city:        toStringOrEmpty(metadataAddress.city),
            state:       toStringOrEmpty(metadataAddress.state),
            zip:         toStringOrEmpty(metadataAddress.zip),
          }
        : null;

      const vipCode = toStringOrEmpty(metadata?.vipCode);
      const couponCode = toStringOrEmpty(metadata?.couponCode);
      const discountAmount =
        metadata?.discountAmount != null
          ? toFiniteNumber(metadata.discountAmount, 0)
          : undefined;
      const total = toFiniteNumber(
        metadata?.total,
        toFiniteNumber(payment.transaction_amount, 0),
      );
      const consent = normalizeConsent(metadata?.consent);
      const customerName = addressForEmail?.fullName || "Checkout Pro";
      const customerEmail =
        addressForEmail?.email || toStringOrEmpty(payment.payer?.email) || "-";
      const customerPhone = addressForEmail?.phone || "-";
      const saleAddress =
        addressForEmail &&
        [
          addressForEmail.street,
          addressForEmail.numExterior ? `#${addressForEmail.numExterior}` : "",
          addressForEmail.numInterior ? `Int. ${addressForEmail.numInterior}` : "",
          addressForEmail.city,
          addressForEmail.state,
          addressForEmail.zip,
        ]
          .filter(Boolean)
          .join(", ");

      // ── Stock (idempotente por orderId en Apps Script) ────────────────────
      try {
        await deductStock(cartItems, orderId, BRAND);
      } catch (stockError) {
        console.error(
          `[webhook/mp][ALERT] pending_fulfillment — orden ${orderId}: falló el descuento de stock`,
          stockError,
        );
        try {
          await logSale({
            orderId,
            date:          new Date().toISOString(),
            customerName,
            customerEmail,
            customerPhone,
            address:       saleAddress || "Checkout Pro — sin dirección",
            items: saleItems.map((ci) => ({
              name:  ci.product.name || `Producto ${ci.product.id}`,
              sku:   ci.product.id,
              size:  ci.size,
              qty:   ci.quantity,
              price: Number(ci.product.price) || 0,
            })),
            total,
            paymentMethod: "checkout_pro",
            status:        "pending_fulfillment",
            vipCode,
            brand:         BRAND,
            ...(consent ? { consent } : {}),
          });
        } catch (logError) {
          console.error(
            `[webhook/mp][ALERT] pending_fulfillment — orden ${orderId}: tampoco se pudo registrar la venta`,
            logError,
          );
        }

        fail(stockError);
        return NextResponse.json(
          { error: "Stock deduction failed", orderId },
          { status: 500 },
        );
      }

      // ── Log de venta (marca persistente de idempotencia) ──────────────────
      try {
        await logSale({
          orderId,
          date:          new Date().toISOString(),
          customerName,
          customerEmail,
          customerPhone,
          address:       saleAddress || "Checkout Pro — sin dirección",
          items: saleItems.map((ci) => ({
            name:  ci.product.name || `Producto ${ci.product.id}`,
            sku:   ci.product.id,
            size:  ci.size,
            qty:   ci.quantity,
            price: Number(ci.product.price) || 0,
          })),
          total,
          paymentMethod: "checkout_pro",
          status:        "approved",
          vipCode,
          brand:         BRAND,
          ...(consent ? { consent } : {}),
        });
      } catch (logError) {
        console.error(
          `[webhook/mp][ALERT] orden ${orderId}: stock descontado pero el log de venta falló`,
          logError,
        );
        fail(logError);
        return NextResponse.json(
          { error: "Sale log failed", orderId },
          { status: 500 },
        );
      }

      // ── Skydropx (no fatal: el pedido ya está pagado y registrado) ────────
      let trackingNumber: string | null = null;
      let labelUrl:       string | null = null;
      let carrier:        string | null = null;
      let skydropxError:  string | null = null;

      if (addressForEmail && process.env.SKYDROPX_API_KEY) {
        try {
          const shipment = await createSkydropxShipment(
            addressForEmail,
            orderId,
          );
          trackingNumber = shipment.trackingNumber;
          labelUrl       = shipment.labelUrl;
          carrier        = shipment.carrier;
          if (shipment.pickupError) {
            skydropxError = `Pickup failed: ${shipment.pickupError}`;
          }
          console.log(
            "[webhook/mp] Skydropx shipment created:",
            trackingNumber,
            carrier,
          );
        } catch (skydropxErr) {
          skydropxError =
            skydropxErr instanceof Error ? skydropxErr.message : String(skydropxErr);
          // No se relanza: reintentar duplicaría stock/log. Se alerta y sigue.
          console.error("[webhook/mp] Skydropx error (non-fatal):", skydropxError);
        }
      } else if (!process.env.SKYDROPX_API_KEY) {
        console.warn("[webhook/mp] SKYDROPX_API_KEY not set — skipping shipment");
      }

      // ── Correo (no fatal: reintentar duplicaría el envío ya creado) ───────
      if (addressForEmail) {
        try {
          const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zoa.mx";
          const internalSecret = process.env.INTERNAL_WEBHOOK_SECRET;
          const res = await fetch(`${baseUrl}/api/webhooks/payment-success`, {
            method:  "POST",
            headers: {
              "Content-Type": "application/json",
              ...(internalSecret ? { "x-internal-secret": internalSecret } : {}),
            },
            body: JSON.stringify({
              paymentId,
              status:        payment.status,
              items:         saleItems,
              address:       addressForEmail,
              total,
              vipCode,
              ...(couponCode && discountAmount != null
                ? { discountAmount, couponCode }
                : {}),
              orderId,
              brand:         BRAND,
              trackingNumber, labelUrl, carrier,
              skydropxError,
            }),
          });
          if (!res.ok) {
            const text = await res.text().catch(() => "");
            console.error(
              "[webhook/mp] Email webhook failed:",
              res.status,
              text.slice(0, 300),
            );
          }
        } catch (emailErr) {
          console.error("[webhook/mp] Email error:", emailErr);
        }
      } else {
        console.warn("[webhook/mp] Sin dirección/email — correo omitido");
      }

      markProcessed(paymentId);
      release();

      return NextResponse.json(
        {
          received: true,
          stockDeducted: true,
          trackingNumber,
          carrier,
        },
        { status: 200 },
      );
    } catch (processingError) {
      fail(processingError);
      throw processingError;
    } finally {
      inFlight.delete(paymentId);
    }
  } catch (err) {
    console.error("[webhook/mp] Unhandled error:", err);
    // 5xx explícito para que MercadoPago reintente.
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
