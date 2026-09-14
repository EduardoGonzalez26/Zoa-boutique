// ─────────────────────────────────────────────────────────────────────────────
//  Zoa — Quick Buy / Checkout State Store
//  Holds the "Buy Now" item that bypasses the cart, plus shipping address
//  collected on the /checkout page (for transactional emails).
// ─────────────────────────────────────────────────────────────────────────────

import { create } from "zustand";
import type { CartItem, Product, Size } from "@/lib/types";

export interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  numExterior: string;
  numInterior: string;  // optional — can be empty
  colonia: string;
  city: string;
  state: string;
  zip: string;
}

interface CheckoutState {
  /** Items going to checkout — either cart items or a single Quick Buy item */
  checkoutItems: CartItem[];
  /** VIP code forwarded from cart, if applicable */
  vipCode: string;
  /** Address captured in /checkout form */
  address: ShippingAddress | null;

  // ── Actions ────────────────────────────────────────────────────────────────
  setQuickBuy: (product: Product, size: Size) => void;
  setCartCheckout: (items: CartItem[], vipCode?: string) => void;
  setAddress: (address: ShippingAddress) => void;
  clearCheckout: () => void;
}

export const useCheckoutStore = create<CheckoutState>()((set) => ({
  checkoutItems: [],
  vipCode: "",
  address: null,

  setQuickBuy: (product, size) =>
    set({
      checkoutItems: [{ product, size, quantity: 1 }],
      vipCode: "",
    }),

  setCartCheckout: (items, vipCode = "") =>
    set({ checkoutItems: items, vipCode }),

  setAddress: (address) => set({ address }),

  clearCheckout: () =>
    set({ checkoutItems: [], vipCode: "", address: null }),
}));
