"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Payment, initMercadoPago } from "@mercadopago/sdk-react";
import { Lock } from "lucide-react";
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

const INPUT_CLS =
  "w-full rounded-xs border border-zoa-line-strong bg-transparent px-3.5 py-3 font-sans text-[13px] text-zoa-slate transition-colors placeholder:text-zoa-slate-60/60 focus:outline-none focus:border-zoa-slate focus:ring-2 focus:ring-zoa-slate/15";

const OVERLINE = "overline-forest";

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
    <div className="min-h-screen pt-28 md:pt-32">
      {/* Page header */}
      <div className="mx-auto max-w-6xl px-5 md:px-10">
        <nav aria-label="Breadcrumb" className="hairline-b flex items-center gap-2 pb-4 pt-6">
          <span className="font-sans text-[10px] uppercase tracking-[0.18em] text-zoa-slate-60">Inicio</span>
          <span aria-hidden className="font-sans text-[10px] text-zoa-slate-60">/</span>
          <span className="font-sans text-[10px] uppercase tracking-[0.18em] text-zoa-slate">Checkout</span>
        </nav>

        <div className="pt-8 pb-8">
          <p className={OVERLINE}>Zoa · Pago seguro</p>
          <h1 className="mt-4 font-display text-[clamp(2rem,4vw,3rem)] font-normal leading-[1.04] tracking-[-0.02em] text-zoa-slate">
            Checkout
          </h1>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 py-10 md:px-10 lg:grid-cols-[1fr_400px] lg:gap-14">

        {/* ── LEFT: Address Form + MP Brick ──────────────────────────────── */}
        <div className="space-y-12">

          {/* Shipping Address */}
          <section>
            <h2 className={`${OVERLINE} mb-6`}>
              Información de envío
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  <label className="mb-1.5 block font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-zoa-slate-60">
                    {label}
                  </label>
                  <input
                    type={type}
                    value={address[field]}
                    onChange={(e) => updateField(field, e.target.value)}
                    className={INPUT_CLS}
                    autoComplete="on"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* MP Payment Brick */}
          <section>
            <h2 className={`${OVERLINE} mb-6`}>
              Método de pago
            </h2>
            {!addressValid ? (
              <div className="border border-zoa-line bg-transparent px-6 py-10 text-center">
                <p className="font-sans text-xs tracking-wide text-zoa-slate-60">
                  Completa la información de envío para continuar
                </p>
              </div>
            ) : !MP_PUBLIC_KEY ? (
              <div className="border border-zoa-error px-6 py-6 text-center">
                <p className="font-sans text-xs tracking-wide text-zoa-error">
                  Configuración pendiente: MercadoPago Public Key no está configurada.<br />
                  Configura <code>NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY</code> en <code>.env.local</code>.
                </p>
              </div>
            ) : (
              <div className="border border-zoa-line bg-transparent">
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
                          baseColor: "#2B3C42",
                          baseColorFirstVariant: "#003628",
                          baseColorSecondVariant: "#1E2A2F",
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
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="mt-3 font-sans text-xs text-zoa-error">
                {processingError}
              </motion.p>
            )}
          </section>
        </div>

        {/* ── RIGHT: Order Summary ────────────────────────────────────────── */}
        <aside>
          <div className="sticky top-24 space-y-5 border border-zoa-line bg-transparent p-6">
            <h2 className={OVERLINE}>
              Resumen del pedido
            </h2>

            <ul className="m-0 list-none border-t border-zoa-line p-0">
              {items.map((ci: CartItem, i: number) => (
                <li key={i} className="flex justify-between gap-3 border-b border-zoa-line py-3">
                  <div className="flex-1">
                    <p className="font-sans text-[13px] leading-tight text-zoa-slate">{ci.product.name}</p>
                    <p className="mt-1 font-sans text-[11px] uppercase tracking-[0.14em] text-zoa-slate-60">Talla {ci.size} · ×{ci.quantity}</p>
                  </div>
                  <p className="shrink-0 font-sans text-[13px] font-medium text-zoa-slate tabular-nums">
                    {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(ci.product.price * ci.quantity)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="space-y-3 pt-4">
              {!vipActive ? (
                <>
                  <div className="flex justify-between font-sans text-xs text-zoa-slate-60">
                    <span>Subtotal</span>
                    <span className="tabular-nums">{new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(subtotal)}</span>
                  </div>
                  <div className="flex justify-between font-sans text-xs text-zoa-slate-60">
                    <span>Envío</span>
                    <span className={shipping === 0 ? "text-zoa-success" : "tabular-nums"}>{shipping === 0 ? "Gratis" : `$${shipping} MXN`}</span>
                  </div>
                </>
              ) : (
                <p className="inline-flex rounded-xs border border-zoa-line px-3 py-1.5 font-sans text-[11px] leading-relaxed text-zoa-slate">
                  Depósito Probador a Domicilio VIP
                </p>
              )}
              <div className="flex items-baseline justify-between border-t border-zoa-line pt-4">
                <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-zoa-slate-60">Total</span>
                <span className="font-display text-[clamp(1.5rem,2.4vw,2rem)] leading-none text-zoa-slate tabular-nums">{formattedTotal}</span>
              </div>
            </div>

            <p className="flex items-center justify-center gap-1.5 text-center font-sans text-[10px] tracking-wide text-zoa-slate-60">
              <Lock size={11} aria-hidden />
              Pago 100% seguro · SSL · Mercado Pago
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
