"use client";

// ── ProductReviews — deterministic demo reviews + real verified reviews ────────
// Real reviews come from the "Reseñas" sheet (via /api/reviews).
// Customers can submit a review after verifying their order number.

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, ShieldCheck } from "lucide-react";

interface Review {
  name:     string;
  rating:   number;
  text:     string;
  date:     string;
  verified?: boolean;
}

// ── Demo pools (same as before) ───────────────────────────────────────────────
const NAMES = [
  "Andrea López", "Bertha Santiago", "Fernanda Gómez", "Macarena García",
  "Cristina Ortega", "Valeria Reyes", "Daniela Hernández", "Patricia Morales",
  "Sofía Rojas", "Mariana Torres", "Alejandra Vega", "Carmen Ruiz",
  "Isabel Mendoza", "Lorena Castillo", "Gabriela Flores", "Lucía Ramírez",
  "Mónica Jiménez", "Karla Sánchez", "Diana Herrera", "Rosa Núñez",
];
const TEXTS = [
  "Me llegó rapido y la tela es muy bonita 💕",
  "La talla me quedó perfecta, se ve muy elegante",
  "Muy bonita, ya es mi segunda compra aquí y siempre quedo satisfecha",
  "Hermosa!! La recomiendo al 100, la calidad es excelente",
  "Me encantó aunque tardó un poquito más el envío de lo esperado",
  "La tela no se arruga fácil, ideal para viajes ✔️",
  "Perfecta para una cena especial, quedé encantada 🖤",
  "Muy linda, le queda bien a mi tipo de cuerpo. Muy buena calidad",
  "Se ve cara pero el precio es muy accesible. Ampliamente recomendada",
  "Ya la recompré en otro color 😍 me encanta cómo cae",
  "La recibí muy bien empacada y la calidad supera mis expectativas",
  "Pidan una talla menos si son entre tallas, por lo demás perfecta",
  "Me la compré para regalar y quedó encantada con ella",
  "Combina con todo, muy versátil. La atención al cliente también muy bien",
  "La calidad es increíble, no se compara con otras tiendas online",
  "La tela se siente premium, muy suave al tacto",
  "Justo lo que buscaba, estoy muy contenta con mi compra",
  "El color en persona es aún más bonito que en las fotos",
  "Me la puse al día siguiente que llegó, no me la quería quitar jaja",
  "Excelente relación calidad-precio, volvería a comprar sin dudarlo",
];
const RATINGS = [5, 5, 5, 4.5, 5, 4.8, 5, 4.7, 5, 4.5];
const DATES   = [
  "Hace 2 días", "Hace 4 días", "Hace 1 semana", "Hace 10 días",
  "Hace 2 semanas", "Hace 3 semanas", "Hace 1 mes", "Hace 6 semanas",
];

function hash32(str: string)  { let h=5381; for(let i=0;i<str.length;i++) h=Math.imul(h,33)^str.charCodeAt(i); return h>>>0; }
function hash32b(str: string) { let h=0x811c9dc5; for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,0x01000193);} return h>>>0; }

function buildDemoReviews(productId: string): Review[] {
  const h1 = hash32(productId);
  const h2 = hash32b(productId);
  if (h1 % 10 >= 7) return [];
  const count = 2 + (h1 % 3);
  return Array.from({ length: count }, (_, i) => ({
    name:   NAMES[(h1 + i*31)  % NAMES.length],
    text:   TEXTS[(h2 + i*53)  % TEXTS.length],
    rating: RATINGS[(h1 + i*17) % RATINGS.length],
    date:   DATES[(h2 + i*11)  % DATES.length],
  }));
}

// ── Star components ────────────────────────────────────────────────────────────
function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} de 5 estrellas`}>
      {[1,2,3,4,5].map((s) => {
        const filled = rating >= s;
        const half   = !filled && rating >= s - 0.5;
        return (
          <span key={s} className={filled||half ? "text-[var(--color-gold)] text-sm leading-none" : "text-[var(--color-stone-300)] text-sm leading-none"}>
            {half ? "½" : "★"}
          </span>
        );
      })}
    </span>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          className="cursor-pointer text-2xl leading-none transition-colors"
          style={{ color: s <= (hovered || value) ? "var(--color-gold)" : "var(--color-stone-300)" }}
          aria-label={`${s} estrella${s > 1 ? "s" : ""}`}
        >★</button>
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
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center font-sans text-[9px] font-semibold text-white flex-shrink-0"
            style={{ backgroundColor: "#c8a97e" }}
          >
            {review.name.charAt(0)}
          </span>
          <span className="font-sans text-[12px] text-[var(--color-charcoal)] font-medium">{review.name}</span>
          {review.verified && (
            <span className="flex items-center gap-0.5 text-[10px] font-sans text-emerald-600">
              <ShieldCheck size={10} />
              Compra verificada
            </span>
          )}
        </div>
        <span className="font-sans text-[10px] text-[var(--color-stone-400)]">{review.date}</span>
      </div>
      <StarDisplay rating={review.rating} />
      <p className="font-sans text-[13px] text-[var(--color-stone-600)] leading-relaxed">{review.text}</p>
      {index < total - 1 && <hr className="border-[var(--color-stone-100)] mt-3" />}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ProductReviews({ productId, productName }: { productId: string; productName?: string }) {
  const demo = buildDemoReviews(productId);
  const [realReviews, setRealReviews]   = useState<Review[]>([]);
  const [modalOpen, setModalOpen]       = useState(false);

  // Form state
  const [orderId,  setOrderId]   = useState("");
  const [name,     setName]      = useState("");
  const [rating,   setRating]    = useState(5);
  const [text,     setText]      = useState("");
  const [loading,  setLoading]   = useState(false);
  const [error,    setError]     = useState("");
  const [success,  setSuccess]   = useState(false);

  // Fetch real reviews
  useEffect(() => {
    fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.reviews?.length) {
          setRealReviews(d.reviews.map((r: Review) => ({ ...r, verified: true })));
        }
      })
      .catch(() => {});
  }, [productId]);

  const allReviews = [...realReviews, ...demo];
  if (!allReviews.length) return null;

  const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
  const avgDisplay = avg % 1 === 0 ? `${avg}.0` : avg.toFixed(1);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!orderId.trim()) { setError("Ingresa tu número de orden."); return; }
    if (!name.trim())    { setError("Ingresa tu nombre."); return; }
    if (!text.trim() || text.trim().length < 10) { setError("Tu reseña debe tener al menos 10 caracteres."); return; }

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

  return (
    <>
      <div className="border-t border-[var(--color-stone-100)] pt-6 mt-2 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-[var(--color-stone-400)]">
              Reseñas de clientes
            </p>
            <span className="flex items-center gap-1.5">
              <span className="text-[var(--color-gold)] text-sm leading-none">★</span>
              <span className="font-sans text-xs text-[var(--color-charcoal)] font-medium">{avgDisplay}</span>
              <span className="font-sans text-[11px] text-[var(--color-stone-400)]">({allReviews.length})</span>
            </span>
          </div>
          {/* Discrete write review link */}
          <button
            onClick={() => { setModalOpen(true); setSuccess(false); setError(""); }}
            className="cursor-pointer font-sans text-[10px] tracking-[0.15em] uppercase text-[var(--color-stone-400)] hover:text-[var(--color-gold)] underline underline-offset-2 transition-colors"
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
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-stone-100)]">
                <h3 className="font-serif text-lg text-[var(--color-charcoal)]">Escribir reseña</h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="cursor-pointer p-1 rounded-lg hover:bg-[var(--color-stone-100)] transition-colors"
                  aria-label="Cerrar"
                >
                  <X size={17} />
                </button>
              </div>

              <div className="px-6 py-5">
                {success ? (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                      <ShieldCheck size={24} className="text-emerald-500" />
                    </div>
                    <p className="font-serif text-[var(--color-charcoal)] text-lg mb-1">¡Gracias por tu reseña!</p>
                    <p className="font-sans text-[13px] text-[var(--color-stone-500)]">
                      Tu opinión ya está visible en el producto. 🎀
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Order ID — optional, for admin reference */}
                    <div>
                      <label className="block font-sans text-[10px] tracking-[0.2em] uppercase text-[var(--color-stone-400)] mb-1.5">
                        Número de orden <span className="normal-case tracking-normal">(opcional)</span>
                      </label>
                      <input
                        type="text"
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value)}
                        placeholder="ZOA-XXXXXXXXXX"
                        className="w-full border border-[var(--color-stone-200)] rounded-lg px-3 py-2.5 font-sans text-[13px] text-[var(--color-charcoal)] focus:outline-none focus:border-[var(--color-charcoal)] transition-colors placeholder:text-[var(--color-stone-300)]"
                      />
                      <p className="mt-1 font-sans text-[10px] text-[var(--color-stone-400)]">
                        Encúentralo en tu correo de confirmación. Esto nos ayuda a verificar tu compra.
                      </p>
                    </div>

                    {/* Name */}
                    <div>
                      <label className="block font-sans text-[10px] tracking-[0.2em] uppercase text-[var(--color-stone-400)] mb-1.5">
                        Tu nombre *
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nombre o alias"
                        className="w-full border border-[var(--color-stone-200)] rounded-lg px-3 py-2.5 font-sans text-[13px] text-[var(--color-charcoal)] focus:outline-none focus:border-[var(--color-charcoal)] transition-colors placeholder:text-[var(--color-stone-300)]"
                      />
                    </div>

                    {/* Rating */}
                    <div>
                      <label className="block font-sans text-[10px] tracking-[0.2em] uppercase text-[var(--color-stone-400)] mb-1.5">
                        Calificación *
                      </label>
                      <StarPicker value={rating} onChange={setRating} />
                    </div>

                    {/* Review text */}
                    <div>
                      <label className="block font-sans text-[10px] tracking-[0.2em] uppercase text-[var(--color-stone-400)] mb-1.5">
                        Tu reseña *
                      </label>
                      <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Cuéntanos tu experiencia con este producto…"
                        rows={3}
                        className="w-full border border-[var(--color-stone-200)] rounded-lg px-3 py-2.5 font-sans text-[13px] text-[var(--color-charcoal)] focus:outline-none focus:border-[var(--color-charcoal)] transition-colors resize-none placeholder:text-[var(--color-stone-300)]"
                      />
                    </div>

                    {/* Error */}
                    {error && (
                      <p className="font-sans text-[12px] text-red-500">{error}</p>
                    )}

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[var(--color-charcoal)] text-[var(--color-cream)] font-sans text-[11px] tracking-[0.2em] uppercase py-3 rounded-lg hover:bg-[var(--color-stone-700)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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
