// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/process-payment
//
//  El servidor es la única fuente de verdad del pedido:
//  1. Valida catálogo, cantidades y stock actual (lectura fresca del Sheet).
//  2. Recalcula subtotal, campaña, cupón legacy, envío y VIP con lib/pricing.ts.
//  3. Rechaza con 409 si el `total` del cliente difiere > 1 MXN.
//  4. Crea el pago en MercadoPago.
//  5. Si se aprueba: descuenta stock, registra la venta (con consentimiento),
//     crea el envío Skydropx y responde. El correo sale en `after()`.
//
//  Si el stock falla después de un pago aprobado, el pedido NO se marca como
//  surtido: se registra `pending_fulfillment`, se alerta en logs y se responde
//  con `fulfillmentStatus: "pending_fulfillment"` para revisión manual.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse, after } from "next/server";
import MercadoPagoConfig, { Payment } from "mercadopago";
import type { Brand, CartItem, SaleConsent, Size } from "@/lib/types";
import type { ShippingAddress } from "@/store/checkoutStore";
import { deductStock, getProducts, logSale } from "@/lib/googleSheets";
import {
  getOrderBreakdown,
  VIP_CODE,
  type AppliedCoupon,
} from "@/lib/pricing";
import { FREE_SHIPPING_CODE } from "@/lib/shipping";
import { getPromoByCode, getZoaNow, isPromoActive } from "@/lib/promotions";
import { createSkydropxShipment } from "@/lib/skydropx";

// Vercel-only: extiende el timeout a 60 s. Railway (self-hosted) lo ignora.
export const maxDuration = 60;

const BRAND: Brand = "ZOA";
const VALID_SIZES: readonly Size[] = ["XS", "S", "M", "L", "LOV", "XL"];
const APPS_SCRIPT_TIMEOUT_MS = 15_000;

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
    cc_rejected_call_for_authorize:     "Tu banco necesita que autorices este pago. Llámanos o intenta con otra tarjeta.",
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

// ── Consentimiento ───────────────────────────────────────────────────────────
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

// ── Cupones legacy (Apps Script) ─────────────────────────────────────────────
type LegacyCouponResult =
  | { ok: true; coupon: AppliedCoupon }
  | { ok: false; status: number; error: string };

interface LegacyCouponApiResponse {
  ok?: boolean;
  type?: string;
  discount?: number;
  code?: string;
  scope?: string;
  error?: string;
}

/**
 * Valida un cupón legacy contra Apps Script. El cliente NUNCA decide el
 * descuento: sólo manda el código y aquí se resuelve tipo y valor.
 */
async function validateLegacyCoupon(code: string): Promise<LegacyCouponResult> {
  const appsScriptUrl = process.env.APPS_SCRIPT_URL;
  if (!appsScriptUrl) {
    return {
      ok: false,
      status: 503,
      error: "No pudimos validar el cupón. Intenta de nuevo.",
    };
  }

  let res: Response;
  try {
    res = await fetch(appsScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "validateCoupon", code }),
      redirect: "follow",
      signal: AbortSignal.timeout(APPS_SCRIPT_TIMEOUT_MS),
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error("[process-payment] Legacy coupon request failed:", reason);
    return {
      ok: false,
      status: 503,
      error: "No pudimos validar el cupón. Intenta de nuevo.",
    };
  }

  if (!res.ok) {
    console.error("[process-payment] Legacy coupon HTTP error:", res.status);
    return {
      ok: false,
      status: 502,
      error: "No pudimos validar el cupón. Intenta de nuevo.",
    };
  }

  let data: LegacyCouponApiResponse | null = null;
  try {
    data = (await res.json()) as LegacyCouponApiResponse;
  } catch {
    console.error("[process-payment] Legacy coupon returned invalid JSON");
    return {
      ok: false,
      status: 502,
      error: "No pudimos validar el cupón. Intenta de nuevo.",
    };
  }

  if (!data || data.ok !== true) {
    return {
      ok: false,
      status: 400,
      error: data?.error?.trim() || "Cupón no válido.",
    };
  }

  const type = data.type === "porcentaje" || data.type === "fijo" ? data.type : null;
  if (!type) {
    // Los cupones "interno" (p. ej. VENDIDO) no aplican a pagos en línea.
    return {
      ok: false,
      status: 400,
      error: "Este código no aplica a pagos en línea.",
    };
  }

  const value = Number(data.discount);
  if (!Number.isFinite(value) || value < 0 || (type === "porcentaje" && value > 100)) {
    console.error("[process-payment] Legacy coupon returned an invalid discount");
    return {
      ok: false,
      status: 502,
      error: "No pudimos validar el cupón. Intenta de nuevo.",
    };
  }

  return {
    ok: true,
    coupon: {
      code: (data.code?.trim() || code).toUpperCase(),
      type,
      value,
      scope: data.scope === "eligible" ? "eligible" : "all",
    },
  };
}

// ── Main handler ─────────────────────────────────────────────────────────────

interface ProcessPaymentBody {
  formData: {
    token?: string;
    payment_method_id?: string;
    installments?: number;
    issuer_id?: string;
    payer?: { email?: string; identification?: { type: string; number: string } };
  };
  items: CartItem[];
  address: ShippingAddress & { referencias?: string };
  total: number;
  vipCode?: string;
  consent?: RawConsent;
  /** Se ignora a propósito: el descuento se recalcula en servidor. */
  couponDiscount?: unknown;
}

export async function POST(req: NextRequest) {
  if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
    return NextResponse.json(
      {
        error:
          "El procesador de pagos no está configurado. Agrega MERCADOPAGO_ACCESS_TOKEN en las variables de entorno de Railway.",
      },
      { status: 503 },
    );
  }

  try {
    const body = (await req.json()) as ProcessPaymentBody;
    const { formData, items, address, total, vipCode, consent: rawConsent } = body;

    if (!formData || !address?.email) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "La bolsa está vacía." }, { status: 400 });
    }

    if (typeof total !== "number" || !Number.isFinite(total)) {
      return NextResponse.json({ error: "Total inválido." }, { status: 400 });
    }

    const consent = normalizeConsent(rawConsent);
    const normalizedVipCode = (vipCode ?? "").trim().toUpperCase();
    const isVip = normalizedVipCode === VIP_CODE;
    const isFreeShipping = normalizedVipCode === FREE_SHIPPING_CODE;
    const now = getZoaNow();

    const campaignPromo = getPromoByCode(normalizedVipCode);
    if (campaignPromo) {
      if (!campaignPromo.enabled || !isPromoActive(campaignPromo, now)) {
        return NextResponse.json(
          { error: "Este código solo está activo durante su campaña." },
          { status: 400 },
        );
      }
    }

    // ── Catálogo fresco: precio y stock autoritativos ─────────────────────────
    let catalog: Awaited<ReturnType<typeof getProducts>>;
    try {
      catalog = await getProducts({ fresh: true });
    } catch (catalogError) {
      console.error("[process-payment] Catalog validation failed:", catalogError);
      return NextResponse.json(
        { error: "No pudimos validar el catálogo. Intenta de nuevo." },
        { status: 503 },
      );
    }

    const catalogById = new Map(catalog.map((product) => [product.id, product]));

    // ── Validación de items, cantidades y stock ───────────────────────────────
    const validatedByKey = new Map<string, CartItem>();

    for (const rawItem of items) {
      const productId =
        typeof rawItem?.product?.id === "string" ? rawItem.product.id.trim() : "";

      if (!productId) {
        return NextResponse.json(
          { error: "Hay un producto inválido en tu bolsa." },
          { status: 400 },
        );
      }

      const product = catalogById.get(productId);
      if (!product) {
        return NextResponse.json(
          {
            error:
              "Uno de los productos de tu bolsa ya no está disponible. Actualiza e intenta de nuevo.",
            code: "PRODUCT_UNAVAILABLE",
          },
          { status: 409 },
        );
      }

      const quantity = Number(rawItem.quantity);
      if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 100) {
        return NextResponse.json(
          { error: "Cantidad inválida en tu bolsa." },
          { status: 400 },
        );
      }

      const size = rawItem.size;
      if (!VALID_SIZES.includes(size)) {
        return NextResponse.json(
          { error: "Talla inválida en tu bolsa." },
          { status: 400 },
        );
      }

      // Fusiona líneas repetidas del mismo producto+talla antes de validar stock.
      const key = `${productId}:${size}`;
      const existing = validatedByKey.get(key);
      if (existing) {
        existing.quantity += quantity;
      } else {
        validatedByKey.set(key, { product, size, quantity });
      }
    }

    const payableItems = [...validatedByKey.values()];

    for (const item of payableItems) {
      const available = item.product.stock?.[item.size] ?? 0;
      if (!Number.isInteger(item.quantity) || available < item.quantity) {
        return NextResponse.json(
          {
            error: `No hay stock suficiente de ${item.product.name} en talla ${item.size}. Actualiza tu bolsa e intenta de nuevo.`,
            code: "OUT_OF_STOCK",
          },
          { status: 409 },
        );
      }
    }

    // ── Cupón legacy verificado en servidor ──────────────────────────────────
    let legacyCoupon: AppliedCoupon | undefined;
    if (normalizedVipCode && !campaignPromo && !isVip && !isFreeShipping) {
      const result = await validateLegacyCoupon(normalizedVipCode);
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }
      legacyCoupon = result.coupon;
    }

    // ── Cálculo autoritativo (fuente única: lib/pricing.ts) ──────────────────
    const breakdown = getOrderBreakdown(payableItems, {
      promoCode: campaignPromo?.code,
      now,
      vip: isVip,
      freeShipping: isFreeShipping,
      legacyCoupon,
    });

    if (Math.abs(total - breakdown.total) > 1) {
      console.warn(
        "[process-payment] Total mismatch — client:",
        total,
        "server:",
        breakdown.total,
      );
      return NextResponse.json(
        {
          error: "El precio de tu bolsa cambió. Actualiza e intenta de nuevo.",
          code: "TOTAL_MISMATCH",
        },
        { status: 409 },
      );
    }

    const payableTotal = breakdown.total;
    const discountAmount = breakdown.discount;
    const appliedCouponCode = breakdown.promo?.code ?? breakdown.coupon?.code;

    // ── Build payment payload ────────────────────────────────────────────────
    const paymentPayload = {
      transaction_amount: payableTotal,
      token:              formData.token,
      description:        `Zoa — ${payableItems.map((i) => `${i.product.name} (${i.size})`).join(", ")}`,
      installments:       formData.installments ?? 1,
      payment_method_id:  formData.payment_method_id,
      issuer_id:          formData.issuer_id ? Number(formData.issuer_id) : undefined,
      payer: {
        email:          formData.payer?.email ?? address.email,
        identification: formData.payer?.identification,
      },
      metadata: {
        // Dirección completa para que el webhook pueda crear el envío.
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
        items: payableItems.map((i) => ({
          productId: i.product.id,
          size:      i.size,
          quantity:  i.quantity,
        })),
        subtotal:       breakdown.subtotal,
        shipping:       breakdown.shipping,
        discountAmount,
        total:          payableTotal,
        vipCode:        normalizedVipCode,
        ...(appliedCouponCode ? { couponCode: appliedCouponCode } : {}),
        brand:          BRAND,
        source:         "brick",
        ...(consent ? { consent } : {}),
      },
    };

    // Validate card token
    const isCash     = formData.payment_method_id === "oxxo" || formData.payment_method_id === "paycash";
    const isTransfer = formData.payment_method_id?.startsWith("pse") || formData.payment_method_id === "pix";
    if (!isCash && !isTransfer && !formData.token) {
      return NextResponse.json(
        { error: "Token de tarjeta inválido. Por favor vuelve a ingresar los datos de tu tarjeta." },
        { status: 400 },
      );
    }

    // ── Create payment ───────────────────────────────────────────────────────
    let result;
    try {
      result = await getPayment().create({ body: paymentPayload });
    } catch (mpErr: unknown) {
      const mpMessage = mpErr instanceof Error ? mpErr.message : JSON.stringify(mpErr);
      console.error("[process-payment] MP SDK error:", mpMessage);
      return NextResponse.json({ error: `Error de MercadoPago: ${mpMessage}` }, { status: 502 });
    }

    const orderId = `ZOA-${result.id ?? Date.now()}`;

    console.log(
      `[process-payment] Payment result — id:${result.id} status:${result.status} detail:${result.status_detail} method:${result.payment_method_id}`,
    );

    if (result.status === "approved") {
      const paymentMethod = formData.payment_method_id ?? "tarjeta";

      // ── 1. Descuento de stock (idempotente por orderId en Apps Script) ─────
      let stockDeducted = false;
      try {
        await deductStock(payableItems, orderId, BRAND);
        stockDeducted = true;
      } catch (stockError) {
        console.error(
          `[process-payment][ALERT] pending_fulfillment — orden ${orderId}: falló el descuento de stock`,
          stockError,
        );

        // Deja rastro explícito del pedido pagado sin surtir.
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
            items: payableItems.map((ci) => ({
              name:  ci.product.name,
              sku:   ci.product.id,
              size:  ci.size,
              qty:   ci.quantity,
              price: ci.product.price,
            })),
            total:         payableTotal,
            paymentMethod,
            status:        "pending_fulfillment",
            vipCode:       normalizedVipCode,
            brand:         BRAND,
            ...(consent ? { consent } : {}),
          });
        } catch (logError) {
          console.error(
            `[process-payment][ALERT] pending_fulfillment — orden ${orderId}: tampoco se pudo registrar la venta`,
            logError,
          );
        }

        return NextResponse.json({
          status:            result.status,
          paymentId:         result.id,
          statusDetail:      result.status_detail,
          orderId,
          fulfillmentStatus: "pending_fulfillment",
          warning:
            "El pago se aprobó, pero el inventario no pudo descontarse. El pedido queda pendiente de surtir y será revisado manualmente.",
        });
      }

      // ── 2. Log de venta con consentimiento ─────────────────────────────────
      let saleLogError: string | null = null;
      if (stockDeducted) {
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
            items: payableItems.map((ci) => ({
              name:  ci.product.name,
              sku:   ci.product.id,
              size:  ci.size,
              qty:   ci.quantity,
              price: ci.product.price,
            })),
            total:         payableTotal,
            paymentMethod,
            status:        result.status ?? "approved",
            vipCode:       normalizedVipCode,
            brand:         BRAND,
            ...(consent ? { consent } : {}),
          });
        } catch (logError) {
          saleLogError =
            logError instanceof Error ? logError.message.slice(0, 200) : String(logError).slice(0, 200);
          console.error(
            `[process-payment][ALERT] orden ${orderId}: stock descontado pero el log de venta falló`,
            logError,
          );
        }
      }

      // ── 3. Envío Skydropx (síncrono; si falla, el pedido sigue pagado) ─────
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
          if (shipment?.pickupError) {
            skydropxError = `Pickup failed: ${shipment.pickupError}`;
          }
          console.log(
            "[process-payment] Skydropx done — tracking:",
            trackingNumber,
            "carrier:",
            carrier,
            "pickup:",
            shipment?.pickupNumber,
            "pickupError:",
            shipment?.pickupError,
          );
        } catch (e) {
          skydropxError = e instanceof Error ? e.message : String(e);
          console.error("[process-payment] Skydropx failed:", skydropxError);
        }
      }

      // ── 4. Correo después de responder (after() — Railway/self-hosted) ─────
      after(async () => {
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
              paymentId: result.id,
              status:    result.status,
              items:     payableItems,
              address,
              total:     payableTotal,
              vipCode:   normalizedVipCode,
              ...(appliedCouponCode
                ? { discountAmount, couponCode: appliedCouponCode }
                : {}),
              orderId,
              brand:           BRAND,
              trackingNumber, labelUrl, carrier,
              skydropxError,
              saleLogError,
            }),
          });
          if (!res.ok) {
            const text = await res.text().catch(() => "");
            console.error("[process-payment] Email webhook failed:", res.status, text.slice(0, 300));
            return;
          }
          console.log(
            "[process-payment] Email webhook triggered — trackingNumber:",
            trackingNumber,
            "error:",
            skydropxError,
          );
        } catch (e) {
          console.error("[process-payment] Email trigger failed:", e);
        }
      });

      return NextResponse.json({
        status:            result.status,
        paymentId:         result.id,
        statusDetail:      result.status_detail,
        orderId,
        fulfillmentStatus: saleLogError ? "pending_fulfillment" : "approved",
        ...(saleLogError ? { warning: "El pedido se pagó, pero el log de venta no se confirmó." } : {}),
      });
    }

    // in_process / pending (OXXO, transferencia) — no se descuenta stock aún.
    if (result.status === "in_process" || result.status === "pending") {
      return NextResponse.json(
        { status: result.status, statusDetail: result.status_detail, paymentId: result.id, orderId },
        { status: 202 },
      );
    }

    // Rechazado — 402 para que el Brick permanezca abierto.
    const statusDetail = result.status_detail ?? "";
    return NextResponse.json(
      { error: getRejectMessage(statusDetail), status: result.status, statusDetail, paymentId: result.id, orderId },
      { status: 402 },
    );

  } catch (err: unknown) {
    // No exponer detalles de Apps Script/MercadoPago al navegador.
    console.error("[process-payment] Unhandled error:", err);
    return NextResponse.json(
      { error: "Error interno al procesar el pago. Intenta de nuevo." },
      { status: 500 },
    );
  }
}
