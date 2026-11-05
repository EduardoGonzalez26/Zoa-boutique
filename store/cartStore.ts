// ─────────────────────────────────────────────────────────────────────────────
//  Zoa — Zustand Cart Store
//  Manages: cart items, VIP code, drawer visibility, drawer view, shipping & total logic.
// ─────────────────────────────────────────────────────────────────────────────

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Product, Size } from "@/lib/types";
import { FREE_SHIPPING_CODE, FREE_SHIPPING_THRESHOLD, SHIPPING_FLAT } from "@/lib/shipping";

const VIP_CODE = "PROBADOR";
const VIP_DEPOSIT_AMOUNT = 300; // MXN

type DrawerView = "cart" | "checkout";
export type CouponScope = "all" | "eligible";

interface CartState {
  // ── Data ──────────────────────────────────────────────────────────────────
  items: CartItem[];
  vipCode: string;
  /**
   * Valor del cupón según `couponType`:
   * - "porcentaje": porcentaje (0-100).
   * - "fijo": monto en MXN.
   * - "interno" / "envio-gratis" / "": sin descuento monetario (0).
   */
  couponDiscount: number;
  couponType: string; // "porcentaje" | "fijo" | "interno" | ""
  /** "eligible" excluye piezas con descuento propio (campañas). */
  couponScope: CouponScope;
  isOpen: boolean;
  drawerView: DrawerView;

  // ── Computed helpers ────────────────────────────────────────────────────────
  subtotal: () => number;
  shipping: () => number;
  total: () => number;
  discountAmount: () => number;
  isVip: () => boolean;
  isFreeShipping: () => boolean;
  itemCount: () => number;

  // ── Actions ────────────────────────────────────────────────────────────────
  addItem: (product: Product, size: Size) => void;
  removeItem: (productId: string, size: Size) => void;
  updateQuantity: (productId: string, size: Size, quantity: number) => void;
  setVipCode: (code: string) => void;
  /**
   * Guarda el cupón activo.
   * @param value Porcentaje 0-100 si `type === "porcentaje"`; monto en MXN si
   *              `type === "fijo"`; ignorado para "interno"/"envio-gratis".
   * @param type "porcentaje" | "fijo" | "interno" | "" (u otros códigos locales).
   * @param scope "eligible" limita la base a piezas sin descuento propio.
   */
  setCouponDiscount: (value: number, type: string, scope?: CouponScope) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  setDrawerView: (view: DrawerView) => void;
  /** Add item to cart, open drawer, and immediately jump to checkout view */
  openCartAtCheckout: (product: Product, size: Size) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      vipCode: "",
      couponDiscount: 0,
      couponType: "",
      couponScope: "all",
      isOpen: false,
      drawerView: "cart",

      // ── Computed ────────────────────────────────────────────────────────────
      subtotal: () =>
        get().items.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0,
        ),

      shipping: () => {
        if (get().isFreeShipping()) return 0;
        const sub = get().subtotal();
        return sub >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
      },

      discountAmount: () => {
        const { couponDiscount, couponType, couponScope } = get();
        const value = Number(couponDiscount);
        if (!Number.isFinite(value) || value <= 0) return 0;

        // Base elegible: excluye piezas con descuento propio (campañas).
        const base =
          couponScope === "eligible"
            ? get().items.reduce(
                (sum, item) =>
                  (item.product.discount ?? 0) > 0
                    ? sum
                    : sum + item.product.price * item.quantity,
                0,
              )
            : get().subtotal();

        if (base <= 0) return 0;

        switch (couponType) {
          case "fijo":
            // `value` ya está en MXN; nunca descuenta más que la base.
            return Math.min(Math.round(value), Math.round(base));
          case "porcentaje":
            // `value` es porcentaje; se acota a 0-100.
            return Math.round((base * Math.min(value, 100)) / 100);
          case "interno":
            // VENDIDO y otros códigos internos no son descuentos.
            return 0;
          default:
            return 0;
        }
      },

      total: () => {
        if (get().isVip()) return VIP_DEPOSIT_AMOUNT;
        const sub = get().subtotal();
        const disc = get().discountAmount();
        return sub - disc + get().shipping();
      },

      isVip: () =>
        get().vipCode.trim().toUpperCase() === VIP_CODE,

      isFreeShipping: () =>
        get().vipCode.trim().toUpperCase() === FREE_SHIPPING_CODE,

      itemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      // ── Actions ─────────────────────────────────────────────────────────────
      addItem: (product, size) => {
        set((state) => {
          const stockAvailable = product.stock?.[size] ?? 0;
          const existing = state.items.find(
            (i) => i.product.id === product.id && i.size === size,
          );
          if (existing) {
            // Don't exceed stock
            if (existing.quantity >= stockAvailable) return state;
            return {
              items: state.items.map((i) =>
                i.product.id === product.id && i.size === size
                  ? { ...i, quantity: i.quantity + 1 }
                  : i,
              ),
            };
          }
          if (stockAvailable <= 0) return state; // out of stock
          return { items: [...state.items, { product, size, quantity: 1 }] };
        });
      },

      removeItem: (productId, size) => {
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.product.id === productId && i.size === size),
          ),
        }));
      },

      updateQuantity: (productId, size, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, size);
          return;
        }
        set((state) => {
          const item = state.items.find(
            (i) => i.product.id === productId && i.size === size,
          );
          // Cap at stock
          const maxQty = item
            ? (item.product.stock?.[size as keyof typeof item.product.stock] ??
              quantity)
            : quantity;
          const capped = Math.min(quantity, maxQty);
          return {
            items: state.items.map((i) =>
              i.product.id === productId && i.size === size
                ? { ...i, quantity: capped }
                : i,
            ),
          };
        });
      },

      setVipCode: (code) => set({ vipCode: code }),
      setCouponDiscount: (value, type, scope = "all") => {
        const numericValue = Number(value);
        set({
          couponDiscount: Number.isFinite(numericValue)
            ? Math.max(0, numericValue)
            : 0,
          couponType: type,
          couponScope: scope,
        });
      },

      clearCart: () =>
        set({
          items: [],
          vipCode: "",
          couponDiscount: 0,
          couponType: "",
          couponScope: "all",
        }),

      openCart: () => set({ isOpen: true, drawerView: "cart" }),
      closeCart: () => set({ isOpen: false }),
      setDrawerView: (view) => set({ drawerView: view }),

      /** Comprar Ahora: add item, open drawer, jump directly to checkout */
      openCartAtCheckout: (product, size) => {
        get().addItem(product, size);
        set({ isOpen: true, drawerView: "checkout" });
      },
    }),
    {
      name: "zoa-cart",
      // Only persist items, vipCode and coupon — not UI state.
      // Los carritos anteriores sin `couponScope` conservan el default "all"
      // al fusionarse con el estado inicial de Zustand.
      partialize: (state) => ({
        items: state.items,
        vipCode: state.vipCode,
        couponDiscount: state.couponDiscount,
        couponType: state.couponType,
        couponScope: state.couponScope,
      }),
    },
  ),
);
