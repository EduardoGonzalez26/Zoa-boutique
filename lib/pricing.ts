// ─────────────────────────────────────────────────────────────────────────────
//  Zoa — Desglose de precios del pedido (fuente única)
//
//  Server-safe y puro: sin React, sin I/O y sin dependencias de cliente.
//  Lo consume el backend (process-payment); el carrito replica la misma regla
//  para que el total mostrado y el cobrado coincidan.
//
//  Reglas:
//  - `subtotal` = suma de precio final × cantidad.
//  - `eligibleSubtotal` = solo piezas sin descuento propio (product.discount).
//  - `discount` = % de la campaña activa sobre la base elegible.
//  - `shipping` = regla de lib/shipping.ts sobre el subtotal ANTES del cupón.
//  - VIP (PROBADOR) y envío gratis (ENTREAMIGAS) NO se manejan aquí.
// ─────────────────────────────────────────────────────────────────────────────

import type { CartItem } from "./types";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FLAT } from "./shipping";
import { getPromoByCode, isPromoActive, type Promo } from "./promotions";

export interface OrderBreakdown {
  subtotal: number;
  eligibleSubtotal: number;
  discount: number;
  shipping: number;
  total: number;
  /** Campaña aplicada (solo si el código existe y está dentro de su ventana). */
  promo?: Promo;
}

export interface OrderBreakdownOptions {
  /** Código de campaña; se ignora si no está activo o no existe. */
  promoCode?: string;
  /** Fecha de evaluación (America/Mexico_City); por defecto, el reloj real. */
  now?: Date;
}

/** ¿La pieza ya tiene un descuento propio en el catálogo (columna N)? */
function hasOwnDiscount(item: CartItem): boolean {
  return (item.product.discount ?? 0) > 0;
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

  const now = opts.now ?? new Date();
  const requestedPromo = opts.promoCode
    ? getPromoByCode(opts.promoCode)
    : undefined;
  const promo =
    requestedPromo && isPromoActive(requestedPromo, now)
      ? requestedPromo
      : undefined;

  // Todas las campañas actuales excluyen piezas rebajadas; el campo se respeta
  // por si una campaña futura decide aplicar sobre todo el carrito.
  const discountBase =
    promo && promo.excludeDiscounted === false ? subtotal : eligibleSubtotal;
  const discount = promo
    ? Math.round((discountBase * promo.discount) / 100)
    : 0;

  const shipping =
    subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;

  return {
    subtotal,
    eligibleSubtotal,
    discount,
    shipping,
    total: subtotal - discount + shipping,
    promo,
  };
}
