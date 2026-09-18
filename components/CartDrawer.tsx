"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, Trash2, ShoppingBag, Tag, ArrowLeft, Mail, Phone, CreditCard, CheckCircle2, Check, MapPin, Package, Loader2 } from "lucide-react";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import type { CartItem } from "@/lib/types";
import { FREE_SHIPPING_CODE, FREE_SHIPPING_THRESHOLD } from "@/lib/shipping";
import AddressAutocomplete from '@/components/AddressAutocomplete';
import Overline from "@/components/ui/Overline";

// ── MercadoPagoWrapper loaded client-side only (prevents SSR hydration error) ───
const MercadoPagoWrapper = dynamic(() => import('@/components/MercadoPagoWrapper'), { ssr: false });

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(n);

/** Payload mínimo del Brick de Mercado Pago que viaja al API tal cual. */
type BrickFormData = Record<string, unknown>;

interface ShippingData {
  name: string; email: string; phone: string;
  address: string; numExterior: string; interior: string; referencias: string;
  colonia: string; city: string; state: string; zip: string;
}
const EMPTY_SHIPPING: ShippingData = { name: "", email: "", phone: "", address: "", numExterior: "", interior: "", referencias: "", colonia: "", city: "", state: "", zip: "" };

export default function CartDrawer() {
  const router = useRouter();
  const {
    items, vipCode, isOpen, drawerView,
    subtotal, shipping, total, isVip, isFreeShipping,
    couponDiscount, couponType, discountAmount,
    removeItem, updateQuantity, setVipCode, setCouponDiscount,
    closeCart, setDrawerView, clearCart,
  } = useCartStore();

  const [promoCode, setPromoCode]     = useState(vipCode ?? "");
  const [couponMsg, setCouponMsg]     = useState<string | null>(null);
  const [couponStatus, setCouponStatus] = useState<"idle"|"loading"|"ok"|"error">("idle");
  const [shippingData, setShippingData] = useState<ShippingData>(EMPTY_SHIPPING);
  const [addressSelected, setAddressSelected] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [showBrick, setShowBrick] = useState(false);
  const [paying, setPaying]       = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleApplyCode = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;

    // Prevent stacking: one code at a time
    if (vipCode && code !== vipCode) {
      setCouponStatus("error");
      setCouponMsg(`Ya tienes el código ${vipCode} aplicado. Quítalo primero para usar otro.`);
      return;
    }

    // Secret free-shipping code — resolved locally, never sent to Apps Script
    if (code === FREE_SHIPPING_CODE) {
      setVipCode(code);
      setCouponDiscount(0, "envio-gratis");
      setCouponMsg("Código aplicado — envío gratis");
      setCouponStatus("ok");
      return;
    }

    setCouponStatus("loading");
    setCouponMsg(null);
    try {
      const res  = await fetch("/api/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json() as { ok: boolean; type?: string; discount?: number; error?: string; code?: string };
      if (data.ok) {
        setVipCode(code);
        setCouponDiscount(data.discount ?? 0, data.type ?? "");
        if (data.type === "interno") {
          setCouponMsg("Cupón VENDIDO activo — venta física");
        } else {
          setCouponMsg(`Cupón aplicado — ${data.discount}% de descuento`);
        }
        setCouponStatus("ok");
      } else {
        setCouponStatus("error");
        setCouponMsg(data.error ?? "Cupón no válido");
        setCouponDiscount(0, "");
      }
    } catch {
      setCouponStatus("error");
      setCouponMsg("Error al validar el cupón. Intenta de nuevo.");
    }
  };

  const handleRemoveCoupon = () => {
    setVipCode("");
    setCouponDiscount(0, "");
    setPromoCode("");
    setCouponMsg(null);
    setCouponStatus("idle");
  };

  const vipActive   = isVip();
  const subtotalVal = subtotal();
  const shippingVal = shipping();
  const discountVal = discountAmount ? discountAmount() : 0;
  const isVendido   = vipCode === 'VENDIDO' && couponType === 'interno';
  const finalTotal  = vipActive ? 300 : total();

  // ── VENDIDO: direct stock deduction, no payment/shipping ──────────────
  const [vendidoLoading, setVendidoLoading] = useState(false);
  const [vendidoSuccess, setVendidoSuccess] = useState(false);

  const handleVendido = async () => {
    setVendidoLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/vendido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al registrar venta");
      setVendidoSuccess(true);
      clearCart();
      setTimeout(() => {
        setVendidoSuccess(false);
        handleClose();
      }, 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al registrar venta");
    } finally {
      setVendidoLoading(false);
    }
  };

  const validateForm = (): boolean => {
    if (!shippingData.name.trim()) { setFormError("Por favor ingresa tu nombre."); return false; }
    if (!shippingData.email.trim() || !/\S+@\S+\.\S+/.test(shippingData.email)) { setFormError("Correo electrónico inválido."); return false; }
    if (!shippingData.phone.trim()) { setFormError("Por favor ingresa tu teléfono."); return false; }
    if (!addressSelected || !shippingData.address.trim()) { setFormError("Selecciona una dirección de las sugerencias."); return false; }
    if (!shippingData.numExterior.trim()) { setFormError("Por favor ingresa el número exterior."); return false; }
    setFormError(null);
    return true;
  };

  const handleGoToPayment = () => {
    if (!validateForm()) return;
    setError(null);   // clear any error from a previous payment attempt
    setPaying(false);
    setShowBrick(true);
  };

  const handleClose = () => {
    closeCart();
    setTimeout(() => { setDrawerView("cart"); setShowBrick(false); setFormError(null); setError(null); setAddressSelected(false); setShippingData(EMPTY_SHIPPING); }, 400);
  };

  const InputCls = "w-full rounded-xs border border-zoa-line-strong bg-transparent px-3 py-2.5 font-sans text-sm text-zoa-slate placeholder:text-zoa-slate-60 transition-colors focus:outline-none focus:border-zoa-slate focus:ring-2 focus:ring-zoa-slate/15";

  const itemCountTotal = items.reduce((sum, i) => sum + i.quantity, 0);
  const freeShipCodeActive = isFreeShipping();
  const freeShippingProgress = freeShipCodeActive ? 100 : Math.min(100, Math.round((subtotalVal / FREE_SHIPPING_THRESHOLD) * 100));
  const missingForFreeShipping = freeShipCodeActive ? 0 : Math.max(0, FREE_SHIPPING_THRESHOLD - subtotalVal);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div ref={overlayRef} key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-zoa-slate/40 backdrop-blur-sm"
            onClick={handleClose} />

          {/* Drawer — bottom sheet en móvil, altura completa en escritorio */}
          <motion.aside key="drawer"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="cart-drawer-aside fixed left-0 right-0 bottom-0 md:left-auto md:top-0 md:bottom-0 md:right-0 z-50 w-full md:max-w-md bg-zoa-sand shadow-card flex flex-col border-t border-zoa-line md:border-t-0 md:border-l"
            style={{ maxHeight: "95svh" }}
          >

            {/* Drag handle (móvil) — hairline forest al 35% */}
            <div aria-hidden className="flex flex-none justify-center pt-3 md:hidden">
              <span className="h-px w-12 bg-zoa-forest-35" />
            </div>

            {/* ── Header ── */}
            <div className="flex flex-none items-start justify-between border-b border-zoa-line px-6 py-5">
              <div className="flex min-w-0 flex-col gap-1.5">
                {drawerView === "checkout" ? (
                  <button onClick={() => { setDrawerView("cart"); setShowBrick(false); }}
                    className="flex min-h-11 cursor-pointer items-center gap-2 text-zoa-slate-60 transition-colors hover:text-zoa-slate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate">
                    <ArrowLeft size={14} strokeWidth={1.4} aria-hidden />
                    <span className="font-sans text-[10px] uppercase tracking-[0.18em]">Volver a la bolsa</span>
                  </button>
                ) : (
                  <Overline>
                    Tu bolsa
                    {itemCountTotal > 0 && (
                      <>
                        {" · "}
                        <span className="tabular text-zoa-forest">
                          {itemCountTotal} {itemCountTotal === 1 ? "pieza" : "piezas"}
                        </span>
                      </>
                    )}
                  </Overline>
                )}
                <h2 className="font-display text-2xl leading-none tracking-[-0.02em] text-zoa-slate">
                  {drawerView === "checkout" ? "Datos de envío" : "Tu selección"}
                </h2>
              </div>
              <button onClick={handleClose} aria-label="Cerrar carrito"
                className="flex h-11 w-11 flex-none cursor-pointer items-center justify-center text-zoa-slate-60 transition-colors hover:text-zoa-slate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate">
                <X size={20} strokeWidth={1.4} />
              </button>
            </div>

            {/* ═══════════════ CART VIEW ═══════════════ */}
            {drawerView === "cart" && (
              <>
                <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
                  <AnimatePresence initial={false}>
                    {items.length === 0 ? (
                      <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="flex h-56 flex-col items-center justify-center gap-4 text-zoa-slate-60">
                        <ShoppingBag size={32} strokeWidth={1} aria-hidden className="text-zoa-forest" />
                        <p className="font-display text-xl italic text-zoa-slate">Tu bolsa está vacía</p>
                        <button
                          onClick={handleClose}
                          className="link-underline cursor-pointer font-sans text-[10px] uppercase tracking-[0.18em] text-zoa-slate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate"
                        >
                          Explorar la tienda
                        </button>
                      </motion.div>
                    ) : (
                      items.map((item: CartItem) => (
                        <motion.div key={`${item.product.id}-${item.size}`}
                          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.25 }}
                          className="flex gap-4 border-b border-zoa-line pb-5 last:border-0">
                          {/* Miniatura 4/5 — placeholder #FFF7F5 */}
                          <div className="relative aspect-[4/5] w-20 flex-shrink-0 overflow-hidden bg-zoa-surface">
                            {item.product.images[0] && (
                              <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" sizes="80px" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-sans text-sm font-normal leading-snug text-zoa-slate">{item.product.name}</h3>
                            <p className="mt-1 font-sans text-[10px] uppercase tracking-[0.18em] text-zoa-slate-60">
                              Talla {item.size}
                            </p>
                            <p className="mt-1.5 font-sans text-sm text-zoa-slate tabular">{fmt(item.product.price)}</p>

                            {/* Steppers hairline 44px */}
                            <div className="mt-3 flex items-center gap-2">
                              <button onClick={() => updateQuantity(item.product.id, item.size, item.quantity - 1)}
                                className="flex h-11 w-11 cursor-pointer items-center justify-center border border-zoa-line-strong text-zoa-slate transition-colors duration-200 hover:border-zoa-slate hover:bg-zoa-slate/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate" aria-label="Reducir cantidad">
                                <Minus size={12} aria-hidden />
                              </button>
                              <span className="w-6 text-center font-sans text-sm text-zoa-slate tabular">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.product.id, item.size, item.quantity + 1)}
                                className="flex h-11 w-11 cursor-pointer items-center justify-center border border-zoa-line-strong text-zoa-slate transition-colors duration-200 hover:border-zoa-slate hover:bg-zoa-slate/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate" aria-label="Aumentar cantidad">
                                <Plus size={12} aria-hidden />
                              </button>
                              <button onClick={() => removeItem(item.product.id, item.size)}
                                className="ml-auto flex h-11 w-11 cursor-pointer items-center justify-center text-zoa-slate-60 transition-colors duration-200 hover:text-zoa-wine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-wine" aria-label="Eliminar pieza">
                                <Trash2 size={14} strokeWidth={1.4} aria-hidden />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>

                {items.length > 0 && (
                  <div className="flex-none space-y-5 border-t border-zoa-line px-6 py-5">

                    {/* ── Progreso de envío gratis (1px forest) ── */}
                    <div>
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-zoa-slate-60">
                          {missingForFreeShipping > 0 ? "Envío gratis" : "Envío gratis desbloqueado"}
                        </p>
                        <p className="font-sans text-[10px] tracking-[0.14em] text-zoa-slate tabular">
                          {fmt(subtotalVal)} / {fmt(FREE_SHIPPING_THRESHOLD)}
                        </p>
                      </div>
                      <div className="mt-2 h-px w-full bg-zoa-line" role="presentation">
                        <span
                          className="block h-px bg-zoa-forest transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                          style={{ width: `${freeShippingProgress}%` }}
                        />
                      </div>
                      <p className="mt-2 font-display text-[13px] italic text-zoa-wine">
                        {missingForFreeShipping > 0
                          ? `Te faltan ${fmt(missingForFreeShipping)}`
                          : "Tu envío corre por nuestra cuenta"}
                      </p>
                    </div>

                    {/* ── Cupón editorial ── */}
                    <div className="space-y-2 border-t border-zoa-line pt-5">
                      <label className="flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.2em] text-zoa-slate-60">
                        <Tag size={12} aria-hidden /> Código promo
                      </label>

                      {vipCode && couponDiscount >= 0 && couponStatus === "ok" ? (
                        <div className="flex items-center justify-between border border-zoa-success px-3 py-2">
                          <span className="inline-flex items-center gap-2 font-sans text-[11px] font-medium text-zoa-success">
                            <Check size={12} aria-hidden />
                            {vipCode}{couponType === "envio-gratis" ? " — envío gratis" : couponDiscount > 0 ? ` — ${couponDiscount}% off` : " — venta física"}
                          </span>
                          <button onClick={handleRemoveCoupon}
                            className="ml-3 cursor-pointer text-zoa-success transition-colors hover:text-zoa-wine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-wine"
                            aria-label="Quitar cupón">
                            <X size={13} aria-hidden />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input type="text" value={promoCode}
                            onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setCouponStatus("idle"); setCouponMsg(null); }}
                            onKeyDown={(e) => e.key === "Enter" && handleApplyCode()}
                            placeholder="Aplicar un cupón"
                            aria-label="Código promocional"
                            className="min-h-11 flex-1 border border-zoa-line-strong bg-transparent px-3 font-sans text-xs tracking-widest text-zoa-slate transition-colors placeholder:text-zoa-slate-60 focus:border-zoa-slate focus:outline-none focus:ring-2 focus:ring-zoa-slate/15" />
                          <button onClick={handleApplyCode} disabled={couponStatus === "loading"}
                            className="min-h-11 cursor-pointer border border-zoa-line-strong px-4 font-sans text-[10px] uppercase tracking-[0.15em] text-zoa-slate transition-colors duration-200 hover:bg-zoa-slate/5 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate">
                            {couponStatus === "loading" ? "…" : "Aplicar"}
                          </button>
                        </div>
                      )}
                      {couponMsg && (
                        <p className={`font-sans text-[11px] ${couponStatus === "error" ? "text-zoa-wine" : "text-zoa-success"}`}>
                          {couponMsg}
                        </p>
                      )}
                    </div>

                    {/* ── Resumen tabular ── */}
                    <div className="space-y-2 border-t border-zoa-line pt-5">
                      <div className="flex justify-between font-sans text-xs text-zoa-slate-60">
                        <span>Subtotal</span><span className="tabular">{fmt(subtotalVal)}</span>
                      </div>
                      {discountVal > 0 && (
                        <div className="flex justify-between font-sans text-xs text-zoa-success">
                          <span>Descuento ({couponDiscount}%)</span>
                          <span className="tabular">- {fmt(discountVal)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-sans text-xs text-zoa-slate-60">
                        <span>Envío estándar</span>
                        <span className={shippingVal === 0 ? "text-zoa-success" : "tabular"}>
                          {shippingVal === 0 ? "Gratis" : fmt(shippingVal)}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between border-t border-zoa-line pt-3">
                        <span className="font-sans text-base font-medium text-zoa-slate">Total</span>
                        <span className="font-sans text-base font-medium text-zoa-slate tabular">{fmt(finalTotal)}</span>
                      </div>
                    </div>

                    {/* VENDIDO: venta física */}
                    {isVendido ? (
                      <>
                        {vendidoSuccess ? (
                          <div className="inline-flex w-full items-center justify-center gap-2 border border-zoa-success py-3.5 text-center font-sans text-sm tracking-wide text-zoa-success">
                            <CheckCircle2 size={16} aria-hidden /> Venta registrada — inventario descontado
                          </div>
                        ) : (
                          <motion.button
                            onClick={handleVendido}
                            disabled={vendidoLoading}
                            whileTap={{ scale: 0.99 }}
                            className="flex h-14 w-full cursor-pointer items-center justify-center bg-zoa-forest font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-zoa-surface transition-colors duration-200 hover:bg-zoa-forest-dark disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:translate-y-px">
                            {vendidoLoading ? "Registrando…" : "Confirmar venta física"}
                          </motion.button>
                        )}
                        <p className="text-center font-sans text-[10px] tracking-wide text-zoa-slate-60">
                          Solo descuenta inventario · Sin cobro
                        </p>
                      </>
                    ) : (
                      /* Checkout normal */
                      <>
                        <motion.button
                          onClick={() => setDrawerView("checkout")}
                          whileTap={{ scale: 0.99 }}
                          className="flex h-14 w-full cursor-pointer items-center justify-center bg-zoa-forest font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-zoa-surface transition-colors duration-200 hover:bg-zoa-forest-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:translate-y-px">
                          Finalizar compra
                        </motion.button>
                        <button
                          onClick={handleClose}
                          className="flex h-12 w-full cursor-pointer items-center justify-center border border-zoa-line-strong font-sans text-[10px] uppercase tracking-[0.18em] text-zoa-slate transition-colors duration-200 hover:border-zoa-slate hover:bg-zoa-slate/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:translate-y-px">
                          Seguir comprando
                        </button>
                        <p className="text-center font-sans text-[10px] tracking-wide text-zoa-slate-60">
                          Pago seguro con Mercado Pago
                        </p>
                      </>
                    )}
                    {error && <p className="text-center font-sans text-xs text-zoa-wine">{error}</p>}
                  </div>
                )}
              </>
            )}

            {/* ═══════════════ CHECKOUT VIEW ═══════════════ */}
            {drawerView === "checkout" && (
              <div className="flex-1 overflow-y-auto">
                <div className="space-y-5 px-6 py-5">
                  {/* Entrega estimada */}
                  <div className="inline-flex items-center gap-2 border border-zoa-line px-3 py-2">
                    <Package size={14} strokeWidth={1.4} aria-hidden className="text-zoa-slate-60" />
                    <p className="font-sans text-[11px] tracking-wide text-zoa-slate-60">
                      Entrega estimada: <strong className="font-medium text-zoa-slate">3–5 días hábiles</strong>
                    </p>
                  </div>

                  {/* Mini resumen */}
                  <div className="space-y-2 border border-zoa-line px-4 py-3">
                    {items.map((item) => (
                      <div key={`${item.product.id}-${item.size}`} className="flex justify-between gap-3 font-sans text-xs text-zoa-slate-60">
                        <span className="min-w-0 truncate">{item.product.name} · Talla {item.size} × {item.quantity}</span>
                        <span className="shrink-0 tabular">{fmt(item.product.price * item.quantity)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between border-t border-zoa-line pt-2 font-sans text-xs font-medium text-zoa-slate">
                      <span>Total</span><span className="tabular">{fmt(finalTotal)}</span>
                    </div>
                  </div>

                  {/* MP Brick una vez validado el formulario */}
                  {showBrick ? (
                    <div key={`mp-brick-${finalTotal}`} style={{ touchAction: 'manipulation', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
                      {error && <p className="mb-3 font-sans text-xs text-zoa-wine">{error}</p>}
                      {paying && (
                        <div className="flex items-center justify-center gap-2 py-4 font-sans text-xs text-zoa-slate-60">
                          <Loader2 size={16} aria-hidden className="animate-spin text-zoa-slate" />
                          Procesando pago...
                        </div>
                      )}
                      <MercadoPagoWrapper
                        initialization={{
                          amount: finalTotal,
                          payer: {
                            email: shippingData.email,
                            // Pass customer name so the Brick pre-fills the cardholder
                            // field — prevents cc_rejected_bad_filled_other on mobile
                            name: shippingData.name,
                          },
                        }}
                        onSubmit={async ({ formData }: { formData: BrickFormData }) => {
                          if (paying) return;
                          setPaying(true);
                          setError(null);
                          try {
                            const res = await fetch("/api/process-payment", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                formData,
                                items,
                                address: {
                                  fullName:    shippingData.name,
                                  email:       shippingData.email,
                                  phone:       shippingData.phone,
                                  street:      shippingData.address,
                                  numExterior: shippingData.numExterior,
                                  numInterior: shippingData.interior,
                                  colonia:     shippingData.colonia,
                                  referencias: shippingData.referencias,
                                  city:        shippingData.city,
                                  state:       shippingData.state,
                                  zip:         shippingData.zip,
                                },
                                total: finalTotal,
                                vipCode: promoCode,
                              }),
                            });
                            const data = await res.json();
                            // API returns 402 for rejected/non-approved payments
                            if (!res.ok) throw new Error(data.error ?? "Error al procesar el pago");
                            const status = data.status as string;
                            // Only navigate to success for genuinely approved or pending (OXXO/transfer) payments
                            if (status === "approved") {
                              clearCart();
                              handleClose();
                              router.push("/checkout/success");
                            } else if (status === "in_process" || status === "pending") {
                              clearCart();
                              handleClose();
                              router.push("/checkout/success?pendiente=1");
                            } else {
                              // Rejected or unknown — show error, keep brick visible so user can retry
                              throw new Error(data.error ?? `Pago no aprobado (${status}). Intenta de nuevo.`);
                            }
                          } catch (err: unknown) {
                            setError(err instanceof Error ? err.message : "Error inesperado");
                            setPaying(false);
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <>
                      {/* Formulario de envío */}
                      <div className="space-y-3">
                        <input type="text" placeholder="Nombre completo"
                          aria-label="Nombre completo"
                          value={shippingData.name}
                          onChange={(e) => setShippingData((d) => ({ ...d, name: e.target.value }))}
                          className={InputCls} />

                        <div className="grid grid-cols-2 gap-2">
                          <div className="relative">
                            <Mail size={13} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zoa-slate-60" />
                            <input type="email" placeholder="Correo electrónico"
                              aria-label="Correo electrónico"
                              value={shippingData.email}
                              onChange={(e) => setShippingData((d) => ({ ...d, email: e.target.value }))}
                              className={`${InputCls} pl-8`} />
                          </div>
                          <div className="relative">
                            <Phone size={13} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zoa-slate-60" />
                            <input type="tel" placeholder="Teléfono"
                              aria-label="Teléfono"
                              value={shippingData.phone}
                              onChange={(e) => setShippingData((d) => ({ ...d, phone: e.target.value }))}
                              className={`${InputCls} pl-8`} />
                          </div>
                        </div>

                        {/* Dirección con autocompletado */}
                        <div className="relative">
                          <AddressAutocomplete
                            value={shippingData.address}
                            onChange={(v) => {
                              setShippingData((d) => ({ ...d, address: v }));
                              setAddressSelected(false);
                            }}
                            onSelect={({ street, colonia, city, state, zip }) => {
                              setShippingData((d) => ({
                                ...d,
                                address: [street, colonia].filter(Boolean).join(", "),
                                colonia: colonia || d.colonia,
                                city: city || d.city,
                                state: state || d.state,
                                zip: zip || d.zip,
                              }));
                              setAddressSelected(true);
                            }}
                            className={`${InputCls} ${addressSelected ? "border-zoa-success pr-10" : ""}`}
                            placeholder="Calle, número y colonia — ej: Insurgentes 123, Roma"
                          />
                          {addressSelected && (
                            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                              <CheckCircle2 size={15} aria-hidden className="text-zoa-success" />
                            </div>
                          )}
                        </div>

                        {/* Ciudad/Estado auto-poblados */}
                        {addressSelected && (shippingData.city || shippingData.state) && (
                          <p className="inline-flex items-center gap-2 px-1 font-sans text-[11px] text-zoa-slate-60">
                            <MapPin size={12} aria-hidden />
                            {[shippingData.city, shippingData.state, shippingData.zip].filter(Boolean).join(", ")}
                          </p>
                        )}

                        {/* Núm. Exterior / Interior */}
                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" placeholder="Núm. Exterior *"
                            aria-label="Número exterior"
                            value={shippingData.numExterior}
                            onChange={(e) => setShippingData((d) => ({ ...d, numExterior: e.target.value }))}
                            className={InputCls} />
                          <input type="text" placeholder="Interior / Depto. (opcional)"
                            aria-label="Número interior"
                            value={shippingData.interior}
                            onChange={(e) => setShippingData((d) => ({ ...d, interior: e.target.value }))}
                            className={InputCls} />
                        </div>
                        <input type="text" placeholder="Referencias (entre calles, color de fachada...)"
                          aria-label="Referencias de entrega"
                          value={shippingData.referencias}
                          onChange={(e) => setShippingData((d) => ({ ...d, referencias: e.target.value }))}
                          className={InputCls} />
                      </div>

                      {formError && <p className="font-sans text-xs text-zoa-wine">{formError}</p>}

                      <div className="flex items-start gap-2 border border-zoa-line px-4 py-3 font-sans text-xs text-zoa-slate-60">
                        <CreditCard size={14} strokeWidth={1.4} aria-hidden className="mt-0.5 shrink-0 text-zoa-slate-60" />
                        <span>El pago se procesará de forma segura a través de <strong className="font-medium text-zoa-slate">Mercado Pago</strong>. Aceptamos tarjetas, OXXO y transferencias.</span>
                      </div>

                      {error && <p className="font-sans text-xs text-zoa-wine">{error}</p>}

                      <motion.button
                        onClick={handleGoToPayment}
                        whileTap={{ scale: 0.99 }}
                        className="flex h-14 w-full cursor-pointer items-center justify-center bg-zoa-forest font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-zoa-surface transition-colors duration-200 hover:bg-zoa-forest-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:translate-y-px">
                        Confirmar y pagar
                      </motion.button>

                      <p className="text-center font-sans text-[10px] tracking-wide text-zoa-slate-60">
                        Pago seguro · Certificado SSL
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
