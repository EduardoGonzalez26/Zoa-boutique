"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, Trash2, ShoppingBag, Tag, ArrowLeft, Mail, Phone, CreditCard, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import type { CartItem } from "@/lib/types";
import AddressAutocomplete from '@/components/AddressAutocomplete';

// ── MercadoPagoWrapper loaded client-side only (prevents SSR hydration error) ───
const MercadoPagoWrapper = dynamic(() => import('@/components/MercadoPagoWrapper'), { ssr: false });

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(n);

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
    subtotal, shipping, total, isVip,
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

    // Prevent stacking: if a coupon is already applied, block
    if (couponDiscount > 0 && vipCode && code !== vipCode) {
      setCouponStatus("error");
      setCouponMsg(`Ya tienes el cupón ${vipCode} aplicado. Bórralo primero para usar otro.`);
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
          setCouponMsg("✓ Cupón VENDIDO activo — venta física");
        } else {
          setCouponMsg(`✓ Cupón aplicado — ${data.discount}% de descuento`);
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

  const InputCls = "w-full border border-[var(--color-stone-200)] rounded-md px-3 py-2.5 text-sm font-sans bg-transparent text-[var(--color-charcoal)] placeholder:text-[var(--color-stone-400)] focus:outline-none focus:border-[var(--color-gold)] transition-colors";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div ref={overlayRef} key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-[var(--color-charcoal)]/40 backdrop-blur-sm"
            onClick={handleClose} />

          {/* Drawer panel — bottom sheet on mobile (95svh), full-height on desktop */}
          <motion.aside key="drawer"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="cart-drawer-aside fixed left-0 right-0 bottom-0 md:left-auto md:top-0 md:bottom-0 md:right-0 z-50 w-full md:max-w-md bg-[var(--color-cream)] shadow-2xl flex flex-col rounded-t-2xl md:rounded-t-none md:rounded-l-2xl"
            style={{ maxHeight: "95svh" }}
          >

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-stone-100)] flex-shrink-0">
              <div className="flex items-center gap-2">
                {drawerView === "checkout" ? (
                  <button onClick={() => { setDrawerView("cart"); setShowBrick(false); }}
                    className="cursor-pointer flex items-center gap-1.5 text-[var(--color-stone-600)] hover:text-[var(--color-charcoal)] transition-colors">
                    <ArrowLeft size={14} strokeWidth={1.5} />
                    <span className="font-sans text-[10px] tracking-[0.2em] uppercase">Carrito</span>
                  </button>
                ) : (
                  <>
                    <ShoppingBag size={18} strokeWidth={1.5} className="text-[var(--color-charcoal)]" />
                    <h2 className="font-serif text-xl text-[var(--color-charcoal)]">Tu carrito</h2>
                  </>
                )}
              </div>
              <button onClick={handleClose} aria-label="Cerrar carrito"
                className="cursor-pointer p-2 rounded-lg text-[var(--color-stone-400)] hover:text-[var(--color-charcoal)] transition-colors">
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            {/* ═══════════════ CART VIEW ═══════════════ */}
            {drawerView === "cart" && (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
                  <AnimatePresence initial={false}>
                    {items.length === 0 ? (
                      <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center h-48 gap-3 text-[var(--color-stone-400)]">
                        <ShoppingBag size={36} strokeWidth={1} />
                        <p className="font-sans text-sm tracking-wide">Tu carrito está vacío</p>
                      </motion.div>
                    ) : (
                      items.map((item: CartItem) => (
                        <motion.div key={`${item.product.id}-${item.size}`}
                          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.25 }}
                          className="flex gap-4 pb-5 border-b border-[var(--color-stone-100)] last:border-0">
                          {/* Thumbnail */}
                          <div className="relative w-20 h-28 flex-shrink-0 bg-[var(--color-stone-100)] overflow-hidden rounded-lg">
                            {item.product.images[0] && (
                              <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" sizes="80px" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-serif text-sm text-[var(--color-charcoal)] leading-snug">{item.product.name}</h3>
                            <p className="text-[11px] text-[var(--color-stone-400)] font-sans tracking-[0.15em] uppercase mt-0.5">Talla {item.size}</p>
                            <p className="font-sans text-sm text-[var(--color-stone-600)] mt-1">{fmt(item.product.price)}</p>
                            {/* Quantity controls */}
                            <div className="flex items-center gap-3 mt-3">
                              <button onClick={() => updateQuantity(item.product.id, item.size, item.quantity - 1)}
                                className="cursor-pointer w-7 h-7 flex items-center justify-center border border-[var(--color-stone-200)] rounded-md text-[var(--color-charcoal)] hover:border-[var(--color-charcoal)] transition-colors" aria-label="Reducir">
                                <Minus size={12} />
                              </button>
                              <span className="font-sans text-sm w-4 text-center">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.product.id, item.size, item.quantity + 1)}
                                className="cursor-pointer w-7 h-7 flex items-center justify-center border border-[var(--color-stone-200)] rounded-md text-[var(--color-charcoal)] hover:border-[var(--color-charcoal)] transition-colors" aria-label="Aumentar">
                                <Plus size={12} />
                              </button>
                              <button onClick={() => removeItem(item.product.id, item.size)}
                                className="cursor-pointer ml-auto p-1.5 rounded-md text-[var(--color-stone-400)] hover:text-red-500 transition-colors" aria-label="Eliminar">
                                <Trash2 size={14} strokeWidth={1.5} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>

                {items.length > 0 && (
                  <div className="border-t border-[var(--color-stone-100)] px-6 py-5 space-y-4 flex-shrink-0">
                    {/* Promo / VIP code */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-1.5 text-[10px] font-sans tracking-[0.2em] uppercase text-[var(--color-stone-600)]">
                        <Tag size={12} /> Código promo
                      </label>

                      {/* Active coupon chip */}
                      {vipCode && couponDiscount >= 0 && couponStatus === "ok" ? (
                        <div className="flex items-center justify-between px-3 py-2 rounded-md bg-emerald-50 border border-emerald-200">
                          <span className="text-[11px] font-sans text-emerald-700 font-medium">
                            ✓ {vipCode}{couponDiscount > 0 ? ` — ${couponDiscount}% off` : " — venta física"}
                          </span>
                          <button onClick={handleRemoveCoupon}
                            className="ml-3 text-emerald-500 hover:text-red-500 transition-colors text-xs leading-none cursor-pointer"
                            aria-label="Quitar cupón">
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input type="text" value={promoCode}
                            onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setCouponStatus("idle"); setCouponMsg(null); }}
                            onKeyDown={(e) => e.key === "Enter" && handleApplyCode()}
                            placeholder="Aplicar un cupón"
                            className="flex-1 border border-[var(--color-stone-200)] rounded-md px-3 py-2 text-xs font-sans tracking-widest bg-transparent text-[var(--color-charcoal)] placeholder:text-[var(--color-stone-400)] focus:outline-none focus:border-[var(--color-gold)] transition-colors" />
                          <button onClick={handleApplyCode} disabled={couponStatus === "loading"}
                            className="cursor-pointer px-4 py-2 rounded-md bg-[var(--color-charcoal)] text-[var(--color-cream)] text-[10px] font-sans tracking-[0.15em] uppercase hover:bg-[var(--color-gold)] transition-colors duration-300 disabled:opacity-60">
                            {couponStatus === "loading" ? "..." : "Aplicar"}
                          </button>
                        </div>
                      )}
                      {couponMsg && couponStatus === "error" && (
                        <p className="text-[11px] font-sans text-red-500">{couponMsg}</p>
                      )}
                    </div>


                    {/* Price summary */}
                    <div className="space-y-2 pt-1">
                      <div className="flex justify-between text-xs font-sans text-[var(--color-stone-600)]">
                        <span>Subtotal</span><span>{fmt(subtotalVal)}</span>
                      </div>
                      {discountVal > 0 && (
                        <div className="flex justify-between text-xs font-sans text-emerald-600">
                          <span>Descuento ({couponDiscount}%)</span>
                          <span>- {fmt(discountVal)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs font-sans text-[var(--color-stone-600)]">
                        <span>Envío estándar</span>
                        <span className={shippingVal === 0 ? "text-green-600" : ""}>
                          {shippingVal === 0 ? "Gratis 🎉" : fmt(shippingVal)}
                        </span>
                      </div>
                      {subtotalVal < 3000 && (
                        <p className="text-[10px] text-[var(--color-stone-400)] font-sans">
                          Agrega {fmt(3000 - subtotalVal)} más para envío gratis
                        </p>
                      )}
                      <div className="flex justify-between pt-2 border-t border-[var(--color-stone-100)]">
                        <span className="font-serif text-base text-[var(--color-charcoal)]">Total</span>
                        <span className="font-serif text-base text-[var(--color-charcoal)]">{fmt(finalTotal)}</span>
                      </div>
                    </div>


                    {/* VENDIDO: special physical sale confirm */}
                    {isVendido ? (
                      <>
                        {vendidoSuccess ? (
                          <div className="w-full py-3.5 rounded-xl bg-emerald-500 text-white text-center font-sans text-sm tracking-wide">
                            ✅ Venta registrada — inventario descontado
                          </div>
                        ) : (
                          <motion.button
                            onClick={handleVendido}
                            disabled={vendidoLoading}
                            whileTap={{ scale: 0.98 }}
                            className="cursor-pointer w-full py-3.5 rounded-xl bg-emerald-600 text-white font-sans text-xs tracking-[0.25em] uppercase hover:bg-emerald-700 transition-colors duration-300 disabled:opacity-60"
                          >
                            {vendidoLoading ? "Registrando..." : "✅ Confirmar Venta Física"}
                          </motion.button>
                        )}
                        <p className="text-[10px] text-center font-sans text-[var(--color-stone-400)] tracking-wide">
                          Solo descuenta inventario · Sin cobro
                        </p>
                      </>
                    ) : (
                      /* Normal checkout → go to payment */
                      <>
                        <motion.button
                          onClick={() => setDrawerView("checkout")}
                          whileTap={{ scale: 0.98 }}
                          className="cursor-pointer w-full py-3.5 rounded-xl bg-[var(--color-charcoal)] text-[var(--color-cream)] font-sans text-xs tracking-[0.25em] uppercase hover:bg-[var(--color-gold)] transition-colors duration-300">
                          Ir a pagar →
                        </motion.button>
                        <p className="text-[10px] text-center font-sans text-[var(--color-stone-400)] tracking-wide">
                          Pago seguro con MercadoPago
                        </p>
                      </>
                    )}
                    {error && <p className="text-xs text-red-500 text-center">{error}</p>}
                  </div>
                )}
              </>
            )}

            {/* ═══════════════ CHECKOUT VIEW ═══════════════ */}
            {drawerView === "checkout" && (
              <div className="flex-1 overflow-y-auto">
                <div className="px-6 py-5 space-y-5">
                  <p className="font-serif text-xl text-[var(--color-charcoal)]">Datos de envío</p>

                  {/* Delivery time badge */}
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
                    <span className="text-emerald-600 text-sm">📦</span>
                    <p className="text-[11px] font-sans text-emerald-700 tracking-wide">
                      Entrega estimada: <strong>3–5 días hábiles</strong>
                    </p>
                  </div>

                  {/* Order mini-summary */}
                  <div className="bg-[var(--color-stone-100)] rounded-lg px-4 py-3 space-y-1">
                    {items.map((item) => (
                      <div key={`${item.product.id}-${item.size}`} className="flex justify-between text-xs font-sans text-[var(--color-stone-600)]">
                        <span>{item.product.name} · Talla {item.size} × {item.quantity}</span>
                        <span>{fmt(item.product.price * item.quantity)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 border-t border-[var(--color-stone-200)] font-sans text-xs text-[var(--color-charcoal)] font-medium">
                      <span>Total</span><span>{fmt(finalTotal)}</span>
                    </div>
                  </div>

                  {/* Show MP Checkout Brick once form is validated */}
                  {showBrick ? (
                    /* key estable basado en total para evitar duplicados */
                    <div key={`mp-brick-${finalTotal}`} style={{ touchAction: 'manipulation', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
                      {error && <p className="text-xs text-red-500 font-sans mb-3">{error}</p>}
                      {paying && (
                        <div className="flex items-center justify-center gap-2 py-4 text-xs font-sans text-[var(--color-stone-400)]">
                          <div className="w-4 h-4 border-2 border-[var(--color-gold)] border-t-transparent rounded-full animate-spin" />
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
                        onSubmit={async ({ formData }: any) => {
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
                          } catch (err: any) {
                            setError(err.message ?? "Error inesperado");
                            setPaying(false);
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <>
                      {/* Shipping form */}
                      <div className="space-y-3">
                        <input type="text" placeholder="Nombre completo"
                          value={shippingData.name}
                          onChange={(e) => setShippingData((d) => ({ ...d, name: e.target.value }))}
                          className={InputCls} />

                        <div className="grid grid-cols-2 gap-2">
                          <div className="relative">
                            <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-stone-400)] pointer-events-none" />
                            <input type="email" placeholder="Correo electrónico"
                              value={shippingData.email}
                              onChange={(e) => setShippingData((d) => ({ ...d, email: e.target.value }))}
                              className={`${InputCls} pl-8`} />
                          </div>
                          <div className="relative">
                            <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-stone-400)] pointer-events-none" />
                            <input type="tel" placeholder="Teléfono"
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
                            className={`${InputCls} ${addressSelected ? "border-green-500 pr-10" : ""}`}
                            placeholder="Calle, número y colonia — ej: Insurgentes 123, Roma"
                          />
                          {addressSelected && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                              <CheckCircle2 size={15} className="text-green-500" />
                            </div>
                          )}
                        </div>

                        {/* Ciudad/Estado auto-poblados */}
                        {addressSelected && (shippingData.city || shippingData.state) && (
                          <p className="text-[11px] font-sans text-[var(--color-stone-500)] px-1">
                            📍 {[shippingData.city, shippingData.state, shippingData.zip].filter(Boolean).join(", ")}
                          </p>
                        )}

                        {/* Número Exterior + Interior */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <input type="text" placeholder="Núm. Exterior *"
                              value={shippingData.numExterior}
                              onChange={(e) => setShippingData((d) => ({ ...d, numExterior: e.target.value }))}
                              className={InputCls} />
                          </div>
                          <input type="text" placeholder="Interior / Depto. (opcional)"
                            value={shippingData.interior}
                            onChange={(e) => setShippingData((d) => ({ ...d, interior: e.target.value }))}
                            className={InputCls} />
                        </div>
                        <input type="text" placeholder="Referencias (entre calles, color de fachada...)"
                          value={shippingData.referencias}
                          onChange={(e) => setShippingData((d) => ({ ...d, referencias: e.target.value }))}
                          className={InputCls} />
                      </div>

                      {formError && (
                        <p className="text-xs text-red-500 font-sans">{formError}</p>
                      )}

                      <div className="flex items-start gap-2 text-xs font-sans text-[var(--color-stone-600)] bg-[var(--color-stone-100)] rounded-lg px-4 py-3">
                        <CreditCard size={14} className="mt-0.5 shrink-0 text-[var(--color-stone-400)]" />
                        <span>El pago se procesará de forma segura a través de <strong>Mercado Pago</strong>. Aceptamos tarjetas, OXXO y transferencias.</span>
                      </div>

                      {error && <p className="text-xs text-red-500 font-sans">{error}</p>}

                      <motion.button
                        onClick={handleGoToPayment}
                        whileTap={{ scale: 0.98 }}
                        className="cursor-pointer w-full py-3.5 rounded-xl bg-[var(--color-charcoal)] text-[var(--color-cream)] font-sans text-xs tracking-[0.25em] uppercase hover:bg-[var(--color-gold)] transition-colors duration-300">
                        Confirmar y pagar →
                      </motion.button>

                      <p className="text-[10px] text-center font-sans text-[var(--color-stone-400)] tracking-wide">
                        Pago seguro · Certificado SSL
                      </p>
                      {/* Espacio reservado para logo MercadoPago — subir imagen después */}
                      <div className="flex justify-center mt-1 h-8" aria-label="Logo MercadoPago" />
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
