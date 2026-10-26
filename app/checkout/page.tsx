"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Payment, initMercadoPago } from "@mercadopago/sdk-react";
import { Lock } from "lucide-react";
import { useCheckoutStore } from "@/store/checkoutStore";
import { useCartStore } from "@/store/cartStore";
import { FREE_SHIPPING_CODE, FREE_SHIPPING_THRESHOLD, SHIPPING_FLAT } from "@/lib/shipping";
import { MP_PUBLIC_KEY } from "@/lib/mercadopagoPublicKey";
import type { ShippingAddress } from "@/store/checkoutStore";
import type { CartItem } from "@/lib/types";

//
// ── MercadoPago Bricks Initialization (runs once, client-only) ─────────────
//
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
  "w-full rounded-xs border border-zoa-line-strong bg-transparent px-3.5 py-3 font-sans text-[13px] text-zoa-slate transition-colors placeholder:text-zoa-slate-60 focus:outline-none focus:border-zoa-slate focus:ring-2 focus:ring-zoa-slate/15";

/** Enlaces legales dentro de copy/microcopy (arena u off-white). */
const LEGAL_LINK =
  "underline underline-offset-2 transition-colors hover:text-zoa-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-forest";

const OVERLINE = "overline-forest";

export default function CheckoutPage() {
  const router = useRouter();
  const { checkoutItems, vipCode, setAddress, clearCheckout } = useCheckoutStore();
  const {
    items: cartItems,
    vipCode: cartVipCode,
    couponDiscount,
    couponScope,
    discountAmount,
    isVip,
    clearCart,
  } = useCartStore();

  const [address, setLocalAddress] = useState<ShippingAddress>(EMPTY_ADDRESS);
  const [addressValid, setAddressValid] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);

  // ── Determine items to charge ─────────────────────────────────────────────
  // If checkoutItems has items → Quick Buy flow. Otherwise → Cart flow.
  const isCartFlow = checkoutItems.length === 0;
  const items: CartItem[] = isCartFlow ? cartItems : checkoutItems;

  // ── Compute totals ────────────────────────────────────────────────────────
  const subtotal = items.reduce((sum: number, ci: CartItem) => sum + ci.product.price * ci.quantity, 0);
  const rawActiveCode = (vipCode || cartVipCode).trim().toUpperCase();
  // Quick Buy no tiene campo de cupón: solo conserva VIP y envío gratis.
  const activeCode =
    isCartFlow || rawActiveCode === "PROBADOR" || rawActiveCode === FREE_SHIPPING_CODE
      ? rawActiveCode
      : "";
  const freeShippingCode = activeCode === FREE_SHIPPING_CODE;
  const shipping = freeShippingCode || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
  const vipActive = isVip() || activeCode === "PROBADOR";
  // El cupón de campaña vive en el store del carrito y ya excluye piezas
  // rebajadas; Quick Buy no aplica cupones de campaña.
  const campaignDiscount = isCartFlow ? discountAmount() : 0;
  const hasExcludedItems = isCartFlow && items.some((ci) => (ci.product.discount ?? 0) > 0);
  const total = vipActive ? 300 : subtotal - campaignDiscount + shipping;

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
        body: JSON.stringify({
          formData, items, address, total, vipCode: activeCode,
          consent: { privacy: true, terms: true, acceptedAt: new Date().toISOString() },
        }),
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
                  { field: "fullName" as keyof ShippingAddress, label: "Nombre completo", span: 2, autoComplete: "name" },
                  { field: "email" as keyof ShippingAddress, label: "Correo electrónico", type: "email", autoComplete: "email" },
                  { field: "phone" as keyof ShippingAddress, label: "Teléfono", type: "tel", autoComplete: "tel" },
                  { field: "street" as keyof ShippingAddress, label: "Calle", span: 2, autoComplete: "street-address" },
                  { field: "numExterior" as keyof ShippingAddress, label: "Núm. Exterior", autoComplete: "address-line2" },
                  { field: "numInterior" as keyof ShippingAddress, label: "Núm. Interior (opcional)", autoComplete: "address-line3" },
                  { field: "colonia" as keyof ShippingAddress, label: "Colonia", autoComplete: "address-level3" },
                  { field: "zip" as keyof ShippingAddress, label: "Código postal", autoComplete: "postal-code" },
                  { field: "city" as keyof ShippingAddress, label: "Ciudad", autoComplete: "address-level2" },
                  { field: "state" as keyof ShippingAddress, label: "Estado", autoComplete: "address-level1" },
                ] satisfies { field: keyof ShippingAddress; label: string; type?: string; span?: number; autoComplete: string }[]
              ).map(({ field, label, type = "text", span, autoComplete }) => {
                const inputId = `checkout-${field}`;
                return (
                  <div key={field} className={span === 2 ? "sm:col-span-2" : ""}>
                    <label
                      htmlFor={inputId}
                      className="mb-1.5 block font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-zoa-slate-60"
                    >
                      {label}
                    </label>
                    <input
                      id={inputId}
                      type={type}
                      value={address[field]}
                      onChange={(e) => updateField(field, e.target.value)}
                      className={INPUT_CLS}
                      autoComplete={autoComplete}
                    />
                  </div>
                );
              })}
            </div>

            {/* Consentimiento obligatorio (Aviso de Privacidad + Términos) */}
            <div className="mt-6 flex items-start gap-2.5">
              <input
                id="checkout-consent"
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-zoa-forest"
              />
              <label
                htmlFor="checkout-consent"
                className="font-sans text-[11px] leading-relaxed text-zoa-slate-60"
              >
                He leído y acepto el{" "}
                <Link href="/privacidad" className={LEGAL_LINK}>Aviso de Privacidad</Link> y los{" "}
                <Link href="/terminos" className={LEGAL_LINK}>Términos y Condiciones</Link>
              </label>
            </div>
          </section>

          {/* MP Payment Brick */}
          <section>
            <h2 className={`${OVERLINE} mb-6`}>
              Método de pago
            </h2>
            {!addressValid || !accepted ? (
              <div className="border border-zoa-line bg-transparent px-6 py-10 text-center">
                <p role="alert" className="font-sans text-xs tracking-wide text-zoa-slate-60">
                  Completa la información de envío y acepta los avisos para continuar.
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
              <motion.p role="alert" aria-live="polite" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="mt-3 font-sans text-xs text-zoa-error">
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
                  {campaignDiscount > 0 && (
                    <div className="flex justify-between font-sans text-xs text-zoa-success">
                      <span>Descuento ({couponDiscount}%)</span>
                      <span className="tabular-nums">- {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(campaignDiscount)}</span>
                    </div>
                  )}
                  {couponScope === "eligible" && hasExcludedItems && (
                    <p className="font-sans text-[11px] leading-relaxed text-zoa-slate-60">
                      El 15% aplica solo a piezas sin promoción.
                    </p>
                  )}
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

            <p className="font-sans text-[10px] leading-relaxed tracking-wide text-zoa-slate-60">
              Al pagar aceptas el{" "}
              <Link href="/privacidad" className={LEGAL_LINK}>Aviso de Privacidad</Link> y los{" "}
              <Link href="/terminos" className={LEGAL_LINK}>Términos y Condiciones</Link> vigentes.
            </p>

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
