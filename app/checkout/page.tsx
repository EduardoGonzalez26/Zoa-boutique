"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Payment, initMercadoPago } from "@mercadopago/sdk-react";
import { useCheckoutStore } from "@/store/checkoutStore";
import { useCartStore } from "@/store/cartStore";
import type { ShippingAddress } from "@/store/checkoutStore";
import type { CartItem } from "@/lib/types";

//
// ── MercadoPago Bricks Initialization (runs once, client-only) ─────────────
//
const MP_PUBLIC_KEY = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY ?? "";

if (MP_PUBLIC_KEY) {
  initMercadoPago(MP_PUBLIC_KEY, { locale: "es-MX" });
}

// ── Address form defaults ───────────────────────────────────────────────────
const EMPTY_ADDRESS: ShippingAddress = {
  fullName: "", email: "", phone: "",
  street: "", numExterior: "", numInterior: "",
  colonia: "", city: "", state: "", zip: "",
};

export default function CheckoutPage() {
  const router = useRouter();
  const { checkoutItems, vipCode, setAddress, clearCheckout } = useCheckoutStore();
  const { items: cartItems, isVip, clearCart } = useCartStore();

  const [address, setLocalAddress] = useState<ShippingAddress>(EMPTY_ADDRESS);
  const [addressValid, setAddressValid] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);

  // ── Determine items to charge ─────────────────────────────────────────────
  // If checkoutItems has items → Quick Buy flow. Otherwise → Cart flow.
  const items: CartItem[] = checkoutItems.length > 0 ? checkoutItems : cartItems;

  // ── Compute totals ────────────────────────────────────────────────────────
  const subtotal = items.reduce((sum: number, ci: CartItem) => sum + ci.product.price * ci.quantity, 0);
  const shipping = subtotal >= 3000 ? 0 : 150;
  const vipActive = isVip() || vipCode === "PROBADOR";
  const total = vipActive ? 300 : subtotal + shipping;

  const formattedTotal = new Intl.NumberFormat("es-MX", {
    style: "currency", currency: "MXN", minimumFractionDigits: 0,
  }).format(total);

  // Redirect if nothing to checkout
  useEffect(() => {
    if (items.length === 0) router.replace("/tienda");
  }, [items, router]);

  // ── Address validation ────────────────────────────────────────────────────
  useEffect(() => {
    const { fullName, email, phone, street, numExterior, colonia, city, state, zip } = address;
    setAddressValid(
      [fullName, email, phone, street, numExterior, colonia, city, state, zip].every((v) => v.trim().length >= 1) &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    );
  }, [address]);

  const updateField = (field: keyof ShippingAddress, value: string) =>
    setLocalAddress((prev) => ({ ...prev, [field]: value }));

  // ── MP Bricks Submit ──────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePaymentSubmit = async (formData: any) => {
    setProcessingError(null);
    try {
      setAddress(address);
      const res = await fetch("/api/process-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData, items, address, total, vipCode }),
      });
      const result = await res.json() as { status?: string; error?: string };
      if (!res.ok) throw new Error(result.error ?? "Error procesando pago");

      if (result.status === "approved" || result.status === "pending") {
        clearCart();
        clearCheckout();
        router.push(result.status === "pending" ? "/checkout/success?pendiente=1" : "/checkout/success");
      } else {
        setProcessingError("El pago fue rechazado. Intenta con otro método.");
      }
    } catch (err: unknown) {
      setProcessingError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const handlePaymentError = (err: unknown) => {
    console.error("MP Brick error:", err);
    setProcessingError("Ocurrió un error con el método de pago. Intenta de nuevo.");
  };

  if (items.length === 0) return null;

  return (
    <div className="min-h-screen bg-[var(--color-cream)] pt-20">
      {/* Page header */}
      <div className="max-w-6xl mx-auto px-5 md:px-10 py-8 border-b border-[var(--color-stone-100)]">
        <p className="font-sans text-[10px] tracking-[0.35em] uppercase text-[var(--color-stone-400)] mb-1">Zoa</p>
        <h1 className="font-serif text-3xl md:text-4xl text-[var(--color-charcoal)]">Checkout</h1>
      </div>

      <div className="max-w-6xl mx-auto px-5 md:px-10 py-10 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10 lg:gap-14">

        {/* ── LEFT: Address Form + MP Brick ──────────────────────────────── */}
        <div className="space-y-10">

          {/* Shipping Address */}
          <section>
            <h2 className="font-sans text-[10px] tracking-[0.3em] uppercase text-[var(--color-stone-400)] mb-6">
              Información de envío
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(
                [
                  { field: "fullName" as keyof ShippingAddress, label: "Nombre completo", span: 2 },
                  { field: "email" as keyof ShippingAddress, label: "Correo electrónico", type: "email" },
                  { field: "phone" as keyof ShippingAddress, label: "Teléfono", type: "tel" },
                  { field: "street" as keyof ShippingAddress, label: "Calle", span: 2 },
                  { field: "numExterior" as keyof ShippingAddress, label: "Núm. Exterior" },
                  { field: "numInterior" as keyof ShippingAddress, label: "Núm. Interior (opcional)" },
                  { field: "colonia" as keyof ShippingAddress, label: "Colonia" },
                  { field: "zip" as keyof ShippingAddress, label: "Código postal" },
                  { field: "city" as keyof ShippingAddress, label: "Ciudad" },
                  { field: "state" as keyof ShippingAddress, label: "Estado" },
                ] satisfies { field: keyof ShippingAddress; label: string; type?: string; span?: number }[]
              ).map(({ field, label, type = "text", span }) => (
                <div key={field} className={span === 2 ? "sm:col-span-2" : ""}>
                  <label className="block font-sans text-[10px] tracking-[0.15em] uppercase text-[var(--color-stone-400)] mb-1.5">
                    {label}
                  </label>
                  <input
                    type={type}
                    value={address[field]}
                    onChange={(e) => updateField(field, e.target.value)}
                    className="w-full border border-[var(--color-stone-200)] bg-transparent px-3.5 py-2.5 font-sans text-[13px] text-[var(--color-charcoal)] focus:outline-none focus:border-[var(--color-charcoal)] transition-colors"
                    autoComplete="on"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* MP Payment Brick */}
          <section>
            <h2 className="font-sans text-[10px] tracking-[0.3em] uppercase text-[var(--color-stone-400)] mb-6">
              Método de pago
            </h2>
            {!addressValid ? (
              <div className="border border-[var(--color-stone-100)] bg-[var(--color-stone-100)]/30 p-6 text-center">
                <p className="font-sans text-xs text-[var(--color-stone-400)] tracking-wide">
                  Completa la información de envío para continuar
                </p>
              </div>
            ) : !MP_PUBLIC_KEY ? (
              <div className="border border-red-200 bg-red-50 p-6 text-center">
                <p className="font-sans text-xs text-red-600 tracking-wide">
                  ⚠️ Configuración pendiente: MercadoPago Public Key no está configurada.<br />
                  Configura <code>NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY</code> en <code>.env.local</code>.
                </p>
              </div>
            ) : (
              <div className="border border-[var(--color-stone-100)]">
                <Payment
                  initialization={{ amount: total }}
                  customization={{
                    paymentMethods: {
                      creditCard: "all",
                      debitCard: "all",
                      ticket: "all",        // OXXO
                      bankTransfer: "all",
                    },
                    visual: {
                      style: {
                        theme: "flat",
                        customVariables: {
                          formBackgroundColor: "transparent",
                          baseColor: "#1C1917",
                          baseColorFirstVariant: "#C9A96E",
                          baseColorSecondVariant: "#A89F95",
                        },
                      },
                    },
                  }}
                  onSubmit={handlePaymentSubmit}
                  onError={handlePaymentError}
                />
              </div>
            )}
            {processingError && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-xs font-sans text-red-500">
                {processingError}
              </motion.p>
            )}
          </section>
        </div>

        {/* ── RIGHT: Order Summary ────────────────────────────────────────── */}
        <aside>
          <div className="border border-[var(--color-stone-100)] p-6 space-y-5 sticky top-24">
            <h2 className="font-sans text-[10px] tracking-[0.3em] uppercase text-[var(--color-stone-400)]">
              Resumen del pedido
            </h2>

            <ul className="space-y-4">
              {items.map((ci: CartItem, i: number) => (
                <li key={i} className="flex justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-sans text-[13px] text-[var(--color-charcoal)] leading-tight">{ci.product.name}</p>
                    <p className="text-[11px] text-[var(--color-stone-400)] mt-0.5">Talla {ci.size} · ×{ci.quantity}</p>
                  </div>
                  <p className="font-sans text-[13px] text-[var(--color-charcoal)] shrink-0">
                    {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(ci.product.price * ci.quantity)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="border-t border-[var(--color-stone-100)] pt-4 space-y-2">
              {!vipActive ? (
                <>
                  <div className="flex justify-between text-xs font-sans text-[var(--color-stone-600)]">
                    <span>Subtotal</span>
                    <span>{new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-sans text-[var(--color-stone-600)]">
                    <span>Envío</span>
                    <span>{shipping === 0 ? "Gratis" : `$${shipping} MXN`}</span>
                  </div>
                </>
              ) : (
                <p className="text-xs font-sans text-[var(--color-gold)] leading-relaxed">Depósito Probador a Domicilio VIP</p>
              )}
              <div className="flex justify-between font-serif text-xl text-[var(--color-charcoal)] pt-2">
                <span>Total</span><span>{formattedTotal}</span>
              </div>
            </div>

            <p className="text-[10px] font-sans text-[var(--color-stone-400)] text-center tracking-wide">
              🔒 Pago 100% seguro · SSL · Mercado Pago
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
