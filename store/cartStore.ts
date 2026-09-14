// ─────────────────────────────────────────────────────────────────────────────
//  Zoa — Zustand Cart Store
//  Manages: cart items, VIP code, drawer visibility, drawer view, shipping & total logic.
// ─────────────────────────────────────────────────────────────────────────────

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Product, Size } from "@/lib/types";

const VIP_CODE = "PROBADOR";
const VIP_DEPOSIT_AMOUNT = 300; // MXN
const SHIPPING_FLAT = 150;       // MXN
const FREE_SHIPPING_THRESHOLD = 3000; // MXN

type DrawerView = "cart" | "checkout";

interface CartState {
  // ── Data ──────────────────────────────────────────────────────────────────
  items: CartItem[];
  vipCode: string;
  couponDiscount: number;   // % off (0-100)
  couponType: string;       // "porcentaje" | "fijo" | "interno" | ""
  isOpen: boolean;
  drawerView: DrawerView;

  // ── Computed helpers ────────────────────────────────────────────────────────
  subtotal: () => number;
  shipping: () => number;
  total: () => number;
  discountAmount: () => number;
  isVip: () => boolean;
  itemCount: () => number;

  // ── Actions ────────────────────────────────────────────────────────────────
  addItem: (product: Product, size: Size) => void;
  removeItem: (productId: string, size: Size) => void;
  updateQuantity: (productId: string, size: Size, quantity: number) => void;
  setVipCode: (code: string) => void;
  setCouponDiscount: (pct: number, type: string) => void;
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
      isOpen: false,
      drawerView: "cart",

      // ── Computed ────────────────────────────────────────────────────────────
      subtotal: () =>
        get().items.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        ),

      shipping: () => {
        const sub = get().subtotal();
        return sub >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
      },

      discountAmount: () => {
        const pct = get().couponDiscount;
        if (!pct) return 0;
        return Math.round(get().subtotal() * pct / 100);
      },

      total: () => {
        if (get().isVip()) return VIP_DEPOSIT_AMOUNT;
        const sub  = get().subtotal();
        const disc = get().discountAmount();
        return (sub - disc) + get().shipping();
      },

      isVip: () =>
        get().vipCode.trim().toUpperCase() === VIP_CODE,

      itemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      // ── Actions ─────────────────────────────────────────────────────────────
      addItem: (product, size) => {
        set((state) => {
          const stockAvailable = product.stock?.[size] ?? 0;
          const existing = state.items.find(
            (i) => i.product.id === product.id && i.size === size
          );
          if (existing) {
            // Don't exceed stock
            if (existing.quantity >= stockAvailable) return state;
            return {
              items: state.items.map((i) =>
                i.product.id === product.id && i.size === size
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            };
          }
          if (stockAvailable <= 0) return state;  // out of stock
          return { items: [...state.items, { product, size, quantity: 1 }] };
        });
      },

      removeItem: (productId, size) => {
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.product.id === productId && i.size === size)
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
            (i) => i.product.id === productId && i.size === size
          );
          // Cap at stock
          const maxQty = item ? (item.product.stock?.[size as keyof typeof item.product.stock] ?? quantity) : quantity;
          const capped = Math.min(quantity, maxQty);
          return {
            items: state.items.map((i) =>
              i.product.id === productId && i.size === size
                ? { ...i, quantity: capped }
                : i
            ),
          };
        });
      },

      setVipCode: (code) => set({ vipCode: code }),
      setCouponDiscount: (pct, type) => set({ couponDiscount: pct, couponType: type }),

      clearCart: () => set({ items: [], vipCode: "", couponDiscount: 0, couponType: "" }),

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
      // Only persist items, vipCode and coupon — not UI state
      partialize: (state) => ({
        items: state.items,
        vipCode: state.vipCode,
        couponDiscount: state.couponDiscount,
        couponType: state.couponType,
      }),
    }
  )
);
