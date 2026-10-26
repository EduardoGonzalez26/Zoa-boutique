"use client";

// ── ProductReviews — reseñas reales de clientas ────────────────────────────────
// Real reviews come from the "Reseñas" sheet (via /api/reviews).
// Customers can submit a review after verifying their order number.

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, ShieldCheck, CheckCircle2 } from "lucide-react";
import useFocusTrap from "@/components/ui/useFocusTrap";

interface Review {
  name:     string;
  rating:   number;
  text:     string;
  date:     string;
  verified?: boolean;
}

// ── Star components ────────────────────────────────────────────────────────────
function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${rating} de 5 estrellas`}>
      {[1,2,3,4,5].map((s) => {
        const fill = Math.max(0, Math.min(1, rating - (s - 1))); // 0..1 por estrella
        return (
          <span key={s} className="relative inline-flex" aria-hidden="true">
            <Star size={14} strokeWidth={1.5} className="text-zoa-slate-60" />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star size={14} strokeWidth={1.5} className="text-zoa-slate" fill="currentColor" />
            </span>
          </span>
        );
      })}
    </span>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;
  return (
    <div role="radiogroup" aria-labelledby="review-rating-label" className="flex gap-1">
      {[1,2,3,4,5].map((s) => (
        <button
          key={s}
          type="button"
          role="radio"
          aria-checked={s === value}
          onClick={() => onChange(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          className="flex h-11 w-11 cursor-pointer items-center justify-center leading-none transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate"
          style={{ color: s <= active ? "var(--color-zoa-slate)" : "var(--color-zoa-slate-60)" }}
          aria-label={`${s} estrella${s > 1 ? "s" : ""}`}
        >
          <Star size={24} strokeWidth={1.4} fill={s <= active ? "currentColor" : "none"} aria-hidden />
        </button>
      ))}
    </div>
  );
}

// ── Review Card ────────────────────────────────────────────────────────────────
function ReviewCard({ review, index, total }: { review: Review; index: number; total: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-xs bg-zoa-slate font-sans text-[10px] font-medium text-zoa-sand">
            {review.name.charAt(0)}
          </span>
          <span className="font-sans text-[12px] font-medium text-zoa-slate">{review.name}</span>
          {review.verified && (
            <span className="flex items-center gap-0.5 font-sans text-[10px] text-zoa-success">
              <ShieldCheck size={10} aria-hidden />
              Compra verificada
            </span>
          )}
        </div>
        <span className="font-sans text-[10px] text-zoa-slate-60">{review.date}</span>
      </div>
      <StarDisplay rating={review.rating} />
      <p className="font-sans text-[13px] leading-relaxed text-zoa-slate-60">{review.text}</p>
      {index < total - 1 && <hr className="mt-4 border-zoa-line" />}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ProductReviews({ productId, productName }: { productId: string; productName?: string }) {
  const [realReviews, setRealReviews]   = useState<Review[]>([]);
  const [modalOpen, setModalOpen]       = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  // Form state
  const [orderId,  setOrderId]   = useState("");
  const [name,     setName]      = useState("");
  const [rating,   setRating]    = useState(5);
  const [text,     setText]      = useState("");
  const [consent,  setConsent]   = useState(false);
  const [loading,  setLoading]   = useState(false);
  const [error,    setError]     = useState("");
  const [success,  setSuccess]   = useState(false);

  // Diálogo de reseña: foco inicial, trap de Tab, Escape, scroll lock y
  // devolución del foco al botón "Escribir reseña".
  useFocusTrap(modalOpen, modalRef, () => setModalOpen(false));

  // Al enviar con éxito, lleva el foco al mensaje para que se anuncie.
  useEffect(() => {
    if (success) successRef.current?.focus({ preventScroll: true });
  }, [success]);

  // Fetch real reviews
  useEffect(() => {
    fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.reviews?.length) {
          setRealReviews(d.reviews as Review[]);
        }
      })
      .catch(() => {});
  }, [productId]);

  const allReviews = realReviews;
  if (!allReviews.length) return null;

  const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
  const avgDisplay = avg % 1 === 0 ? `${avg}.0` : avg.toFixed(1);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim())    { setError("Ingresa tu nombre."); return; }
    if (!text.trim() || text.trim().length < 10) { setError("Tu reseña debe tener al menos 10 caracteres."); return; }
    if (!consent) { setError("Acepta que tu nombre y tu reseña se publiquen para continuar."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/reviews", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: orderId.trim() || undefined, productId, productName, name: name.trim(), rating, text: text.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al enviar la reseña.");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full border border-zoa-line-strong bg-transparent px-3 py-3 font-sans text-[13px] text-zoa-slate transition-colors duration-200 focus:outline-none focus:border-zoa-slate focus:ring-2 focus:ring-zoa-slate/15 placeholder:text-zoa-slate-60";

  return (
    <>
      <div className="mt-2 space-y-5 border-t border-zoa-line pt-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <p className="overline">Reseñas de clientes</p>
            <span className="flex items-center gap-1.5">
              <StarDisplay rating={avg} />
              <span className="font-sans text-xs font-medium text-zoa-slate tabular-nums">{avgDisplay}</span>
              <span className="font-sans text-[11px] text-zoa-slate-60 tabular-nums">({allReviews.length})</span>
            </span>
          </div>
          {/* Discrete write review link */}
          <button
            onClick={() => { setModalOpen(true); setSuccess(false); setError(""); }}
            className="link-underline cursor-pointer font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-zoa-slate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate"
          >
            Escribir reseña
          </button>
        </div>

        {/* Review list */}
        <div className="space-y-4">
          {allReviews.map((r, i) => (
            <ReviewCard key={i} review={r} index={i} total={allReviews.length} />
          ))}
        </div>
      </div>

      {/* ── Review Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-zoa-slate/50 backdrop-blur-sm p-4"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="review-modal-title"
              tabIndex={-1}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-md overflow-hidden border border-zoa-line bg-zoa-sand shadow-card"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zoa-line px-6 py-4">
                <h3 id="review-modal-title" className="font-display text-xl leading-none text-zoa-slate">Escribir reseña</h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex h-11 w-11 cursor-pointer items-center justify-center text-zoa-slate-60 transition-colors duration-200 hover:text-zoa-slate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate"
                  aria-label="Cerrar"
                >
                  <X size={17} aria-hidden />
                </button>
              </div>

              <div className="px-6 py-5">
                {success ? (
                  <div
                    ref={successRef}
                    role="status"
                    aria-live="polite"
                    tabIndex={-1}
                    className="py-6 text-center focus:outline-none"
                  >
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-zoa-success">
                      <CheckCircle2 size={24} className="text-zoa-success" aria-hidden />
                    </div>
                    <p className="mb-1 font-sans text-base font-medium text-zoa-slate">¡Gracias por tu reseña!</p>
                    <p className="font-sans text-[13px] text-zoa-slate-60">
                      Tu reseña quedó registrada y será revisada antes de publicarse.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Order ID — optional, for admin reference */}
                    <div>
                      <label
                        htmlFor="review-order-id"
                        className="mb-1.5 block font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-zoa-slate-60"
                      >
                        Número de orden <span className="normal-case tracking-normal">(opcional)</span>
                      </label>
                      <input
                        id="review-order-id"
                        type="text"
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value)}
                        placeholder="ZOA-XXXXXXXXXX"
                        className={inputCls}
                      />
                      <p className="mt-1 font-sans text-[10px] text-zoa-slate-60">
                        Encúentralo en tu correo de confirmación. Esto nos ayuda a verificar tu compra.
                      </p>
                    </div>

                    {/* Name */}
                    <div>
                      <label
                        htmlFor="review-name"
                        className="mb-1.5 block font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-zoa-slate-60"
                      >
                        Tu nombre *
                      </label>
                      <input
                        id="review-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nombre o alias"
                        className={inputCls}
                      />
                    </div>

                    {/* Rating */}
                    <div>
                      <label
                        id="review-rating-label"
                        className="mb-1.5 block font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-zoa-slate-60"
                      >
                        Calificación *
                      </label>
                      <StarPicker value={rating} onChange={setRating} />
                    </div>

                    {/* Review text */}
                    <div>
                      <label
                        htmlFor="review-text"
                        className="mb-1.5 block font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-zoa-slate-60"
                      >
                        Tu reseña *
                      </label>
                      <textarea
                        id="review-text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Cuéntanos tu experiencia con este producto…"
                        rows={3}
                        className={`${inputCls} resize-none`}
                      />
                    </div>

                    {/* Consentimiento de publicación */}
                    <div className="flex items-start gap-2.5">
                      <input
                        id="review-consent"
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-zoa-forest"
                      />
                      <label
                        htmlFor="review-consent"
                        className="font-sans text-[11px] leading-relaxed text-zoa-slate-60"
                      >
                        Acepto que mi nombre y mi reseña se publiquen en el sitio —{" "}
                        <Link
                          href="/privacidad"
                          className="underline underline-offset-2 transition-colors hover:text-zoa-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-forest"
                        >
                          Aviso de Privacidad
                        </Link>
                      </label>
                    </div>

                    {/* Error */}
                    {error && (
                      <p role="alert" aria-live="polite" className="font-sans text-[12px] text-zoa-wine">{error}</p>
                    )}

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex h-12 w-full cursor-pointer items-center justify-center bg-zoa-forest font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-zoa-surface transition-colors duration-200 hover:bg-zoa-forest-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? "Verificando…" : "Enviar reseña"}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
