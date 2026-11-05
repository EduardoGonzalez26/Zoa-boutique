// ─────────────────────────────────────────────────────────────────────────────
//  Zoa — Desglose de precios del pedido (fuente única)
//
//  Server-safe y puro: sin React y sin I/O. Lo consume el backend
//  (process-payment); el carrito replica la misma regla para que el total
//  mostrado y el cobrado coincidan.
//
//  Reglas:
//  - `subtotal` = suma de precio final × cantidad.
//  - `eligibleSubtotal` = solo piezas sin descuento propio (product.discount).
//  - `discount` = campaña activa o cupón legacy previamente validado en servidor.
//  - `shipping` = regla de lib/shipping.ts sobre el subtotal ANTES del descuento.
//  - VIP (PROBADOR) cobra un depósito fijo y no lleva envío ni descuentos.
//  - Envío gratis (ENTREAMIGAS) cero el envío, sin tocar el descuento.
// ─────────────────────────────────────────────────────────────────────────────

import type { CartItem } from "./types";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FLAT } from "./shipping";
import { getPromoByCode, isPromoActive, type Promo } from "./promotions";

/** Código y monto del depósito VIP «Probador a domicilio». */
export const VIP_CODE = "PROBADOR";
export const VIP_DEPOSIT_AMOUNT = 300; // MXN

/** Cupón legacy de Apps Script ya validado por el servidor. */
export interface AppliedCoupon {
  code: string;
  type: "porcentaje" | "fijo";
  /** Porcentaje (0–100) o monto fijo en MXN, según `type`. */
  value: number;
  /** "eligible" excluye piezas con descuento propio. */
  scope: "all" | "eligible";
}

export interface OrderBreakdown {
  subtotal: number;
  eligibleSubtotal: number;
  discount: number;
  shipping: number;
  total: number;
  /** Campaña aplicada (solo si el código existe, está habilitada y vigente). */
  promo?: Promo;
  /** Cupón legacy aplicado (solo si fue validado en servidor). */
  coupon?: AppliedCoupon;
  isVip: boolean;
  freeShipping: boolean;
}

export interface OrderBreakdownOptions {
  /** Código de campaña; se ignora si no está activo o no existe. */
  promoCode?: string;
  /** Fecha de evaluación (America/Mexico_City); por defecto, el reloj real. */
  now?: Date;
  /** Código PROBADOR: depósito fijo, sin envío ni descuentos. */
  vip?: boolean;
  /** Código ENTREAMIGAS: envío gratis. */
  freeShipping?: boolean;
  /** Cupón legacy ya validado contra Apps Script. */
  legacyCoupon?: AppliedCoupon | null;
}

/** ¿La pieza ya tiene un descuento propio en el catálogo (columna N)? */
function hasOwnDiscount(item: CartItem): boolean {
  return (item.product.discount ?? 0) > 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function getOrderBreakdown(
  items: CartItem[],
  opts: OrderBreakdownOptions = {},
): OrderBreakdown {
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  const eligibleSubtotal = items.reduce(
    (sum, item) =>
      hasOwnDiscount(item) ? sum : sum + item.product.price * item.quantity,
    0,
  );

  // El depósito VIP es un cobro fijo: no acumula descuentos ni envío.
  if (opts.vip) {
    return {
      subtotal,
      eligibleSubtotal,
      discount: 0,
      shipping: 0,
      total: VIP_DEPOSIT_AMOUNT,
      isVip: true,
      freeShipping: false,
    };
  }

  const now = opts.now ?? new Date();
  const requestedPromo = opts.promoCode
    ? getPromoByCode(opts.promoCode)
    : undefined;
  const promo =
    requestedPromo &&
    requestedPromo.enabled &&
    isPromoActive(requestedPromo, now)
      ? requestedPromo
      : undefined;

  const coupon = promo ? undefined : (opts.legacyCoupon ?? undefined);

  // Todas las campañas actuales excluyen piezas rebajadas; el campo se respeta
  // por si una campaña futura decide aplicar sobre todo el carrito.
  const campaignBase =
    promo && promo.excludeDiscounted === false ? subtotal : eligibleSubtotal;
  const campaignDiscount = promo
    ? Math.round((campaignBase * promo.discount) / 100)
    : 0;

  let couponDiscount = 0;
  if (coupon) {
    const couponBase = coupon.scope === "eligible" ? eligibleSubtotal : subtotal;
    if (coupon.type === "porcentaje") {
      couponDiscount = Math.round(
        (couponBase * clamp(coupon.value, 0, 100)) / 100,
      );
    } else {
      couponDiscount = Math.round(clamp(coupon.value, 0, couponBase));
    }
  }

  const discount = clamp(campaignDiscount + couponDiscount, 0, subtotal);
  const shipping =
    opts.freeShipping || subtotal >= FREE_SHIPPING_THRESHOLD
      ? 0
      : SHIPPING_FLAT;

  return {
    subtotal,
    eligibleSubtotal,
    discount,
    shipping,
    total: Math.max(0, subtotal - discount + shipping),
    ...(promo ? { promo } : {}),
    ...(coupon ? { coupon } : {}),
    isVip: false,
    freeShipping: opts.freeShipping === true,
  };
}
