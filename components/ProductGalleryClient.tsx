"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ShoppingBag, ChevronLeft, ChevronRight as ChevronRightIcon, Shield, CreditCard, Lock, Zap, ArrowLeft, X } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import useMounted from "@/components/ui/useMounted";
import type { Product, Size } from "@/lib/types";
import ProductReviews from "@/components/ProductReviews";
import Accordion, { type AccordionEntry } from "@/components/ui/Accordion";
import Overline from "@/components/ui/Overline";
import ImageReveal from "@/components/ui/ImageReveal";

interface ProductGalleryClientProps {
  product: Product;
  allProducts?: Product[]; // for cross-sell recommendations
}

const SIZES: Size[] = ["XS", "S", "M", "L", "LOV", "XL"];

const EASE = [0.16, 1, 0.3, 1] as const;

// Cross-sell categories for each product category
const CROSS_SELL_MAP: Record<string, string[]> = {
  Blusas:     ["Sacos", "Pantalones", "Faldas"],
  Sweaters:   ["Sacos", "Pantalones", "Faldas"],
  Sacos:      ["Blusas", "Pantalones", "Sweaters"],
  Pantalones: ["Blusas", "Sacos", "Sweaters"],
  Vestidos:   ["Sacos", "Faldas", "Sweaters"],
  Faldas:     ["Blusas", "Sacos", "Sweaters"],
  Conjuntos:  ["Blusas", "Pantalones", "Sacos"],
  Blazers:    ["Blusas", "Pantalones", "Sweaters"],
};

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(n);

const pad = (n: number) => String(n).padStart(2, "0");

export default function ProductGalleryClient({ product, allProducts = [] }: ProductGalleryClientProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [added, setAdded] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [barVisible, setBarVisible] = useState(false);
  const { addItem, openCart, openCartAtCheckout } = useCartStore();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const mounted = useMounted();
  const rm = mounted && reduceMotion;

  const images = product.images.length > 0 ? product.images : ["/placeholder.jpg"];

  // ── Slider móvil: CSS scroll-snap nativo ──────────────────────────────
  const sliderRef = useRef<HTMLDivElement>(null);

  const scrollToSlide = useCallback((idx: number) => {
    const el = sliderRef.current;
    if (!el) return;
    el.scrollTo({ left: idx * el.clientWidth, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const el = sliderRef.current;
    if (!el || images.length <= 1) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollLeft / el.clientWidth);
      setSelectedImage(idx);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [images.length]);

  const prevImage = () => { const next = selectedImage === 0 ? images.length - 1 : selectedImage - 1; scrollToSlide(next); };
  const nextImage = () => { const next = selectedImage === images.length - 1 ? 0 : selectedImage + 1; scrollToSlide(next); };
  const goToImage = (idx: number) => scrollToSlide(idx);

  // ── Barra sticky inferior (móvil): aparece al hacer scroll ──
  useEffect(() => {
    const onScroll = () => setBarVisible(window.scrollY > 420);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Retira el FAB de WhatsApp mientras la barra sticky está visible
  useEffect(() => {
    document.body.classList.toggle("zoa-hide-fab", barVisible);
    return () => document.body.classList.remove("zoa-hide-fab");
  }, [barVisible]);

  const requireSize = (): boolean => {
    if (!selectedSize) {
      setSizeError(true);
      setTimeout(() => setSizeError(false), 2500);
      return false;
    }
    return true;
  };

  const handleAddToCart = () => {
    if (!requireSize()) return;
    addItem(product, selectedSize!);
    setAdded(true);
    openCart();
    setTimeout(() => setAdded(false), 2500);
  };

  const handleBuyNow = () => {
    if (!requireSize()) return;
    openCartAtCheckout(product, selectedSize!);
  };

  // ── Cross-sell ──
  const crossSellCats = CROSS_SELL_MAP[product.category] ?? ["Blusas", "Sacos", "Pantalones"];
  const crossSell = crossSellCats
    .map((cat) => allProducts.find((p) => p.category === cat && p.id !== product.id))
    .filter(Boolean)
    .slice(0, 4) as Product[];

  return (
    <>
      {/* ══ REJILLA PRINCIPAL ══ */}
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-0 px-0 lg:grid-cols-12 lg:gap-10 lg:px-10 xl:px-20">

        {/* ── Galería ── */}
        <div className="lg:col-span-7">
          {/* Móvil: slider scroll-snap + contador */}
          <div className="relative w-full lg:hidden">
            <div className="relative aspect-[4/5] w-full bg-zoa-surface">
              <div
                ref={sliderRef}
                className="absolute inset-0 overflow-x-scroll overflow-y-hidden"
                style={{
                  display: "flex",
                  scrollSnapType: "x mandatory",
                  WebkitOverflowScrolling: "touch",
                  scrollbarWidth: "none",
                }}
              >
                {images.map((img, i) => (
                  <div
                    key={i}
                    style={{
                      flex: "0 0 100%",
                      width: "100%",
                      height: "100%",
                      position: "relative",
                      scrollSnapAlign: "start",
                    }}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="100vw"
                      priority={i === 0}
                    />
                  </div>
                ))}
              </div>

              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center border border-zoa-line bg-zoa-sand/90 text-zoa-slate backdrop-blur-sm transition-colors duration-200 hover:bg-zoa-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate"
                    aria-label="Anterior"
                  >
                    <ChevronLeft size={18} strokeWidth={1.4} aria-hidden />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center border border-zoa-line bg-zoa-sand/90 text-zoa-slate backdrop-blur-sm transition-colors duration-200 hover:bg-zoa-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate"
                    aria-label="Siguiente"
                  >
                    <ChevronRightIcon size={18} strokeWidth={1.4} aria-hidden />
                  </button>

                  {/* Contador 01 / 05 sobre hairline */}
                  <span className="absolute right-3 top-3 z-10 border border-zoa-line bg-zoa-sand/90 px-2.5 py-1 font-sans text-[10px] tracking-[0.2em] text-zoa-slate backdrop-blur-sm tabular">
                    {pad(selectedImage + 1)} / {pad(images.length)}
                  </span>

                  <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => goToImage(i)}
                        aria-label={`Imagen ${i + 1}`}
                        aria-current={i === selectedImage}
                        className={`h-0.5 cursor-pointer transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate focus-visible:ring-offset-2 ${
                          i === selectedImage
                            ? "w-8 bg-zoa-surface"
                            : "w-4 bg-zoa-surface/50 hover:bg-zoa-surface"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Escritorio: raíl de miniaturas sticky + imagen principal 4/5 */}
          <div className="hidden lg:flex lg:gap-5">
            {images.length > 1 && (
              <div className="sticky top-28 h-fit w-20 shrink-0">
                <div className="flex flex-col gap-3">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedImage(i)}
                      aria-label={`Ver imagen ${i + 1}`}
                      aria-current={i === selectedImage}
                      className={`relative aspect-[3/4] w-20 cursor-pointer overflow-hidden border transition-opacity duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate ${
                        i === selectedImage
                          ? "border-zoa-slate opacity-100"
                          : "border-zoa-line opacity-60 hover:opacity-100"
                      }`}
                    >
                      <Image src={img} alt="" fill className="object-cover" sizes="80px" />
                    </button>
                  ))}
                </div>
                <p className="mt-4 font-sans text-[10px] tracking-[0.2em] text-zoa-slate-60 tabular">
                  {pad(selectedImage + 1)} / {pad(images.length)}
                </p>
              </div>
            )}

            <div className="group relative min-w-0 flex-1">
              <ImageReveal
                src={images[selectedImage]}
                alt={`${product.name} ${selectedImage + 1}`}
                sizes="(max-width: 1280px) 50vw, 720px"
                priority={selectedImage === 0}
                className="aspect-[4/5] w-full"
                imgClassName="object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
              />
              {/* Contador en overlay hairline */}
              <span className="pointer-events-none absolute bottom-4 right-4 border border-zoa-line bg-zoa-sand/90 px-3 py-1.5 font-sans text-[10px] tracking-[0.2em] text-zoa-slate backdrop-blur-sm tabular">
                {pad(selectedImage + 1)} / {pad(images.length)}
              </span>
            </div>
          </div>
        </div>

        {/* ── Panel de información (sticky en escritorio) ── */}
        <div className="lg:col-span-5 lg:self-start">
          <div className="space-y-8 px-5 pb-28 pt-8 lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:px-0 lg:pb-12 lg:pr-1 lg:pt-0">
            <ProductInfoHeader
              product={product}
              onOpenSizeGuide={() => setSizeGuideOpen(true)}
              onBack={() => router.back()}
            />

            <ProductFormSection
              product={product}
              selectedSize={selectedSize}
              setSelectedSize={setSelectedSize}
              sizeError={sizeError}
              added={added}
              handleAddToCart={handleAddToCart}
              handleBuyNow={handleBuyNow}
              onVariantSelect={(id) => router.push(`/product/${id}`)}
            />

            {/* Fila de confianza */}
            <div className="hairline-t pt-6">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: <Shield size={20} strokeWidth={1.4} aria-hidden />, text: "Pago protegido por Mercado Pago" },
                  { icon: <Lock size={20} strokeWidth={1.4} aria-hidden />, text: "Certificado SSL" },
                  { icon: <CreditCard size={20} strokeWidth={1.4} aria-hidden />, text: "Aceptamos todas las tarjetas" },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex flex-col items-start gap-3">
                    <span className="text-zoa-forest">{icon}</span>
                    <p className="font-sans text-[10px] uppercase leading-snug tracking-[0.14em] text-zoa-slate-60">
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <AccordionBlock description={product.description} />

            <ProductReviews productId={product.id} productName={product.name} />

            <CrossSellSection crossSell={crossSell} />
          </div>
        </div>
      </div>

      {/* ══ BARRA STICKY INFERIOR (móvil) ══ */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-zoa-forest-35 bg-zoa-sand/95 backdrop-blur-md transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:hidden ${
          barVisible ? "translate-y-0" : "translate-y-full"
        }`}
        style={rm ? { transition: "none" } : undefined}
        aria-hidden={!barVisible}
      >
        <div className="flex items-center gap-4 px-5 py-3">
          <div className="min-w-0">
            <p className="truncate font-sans text-[10px] uppercase tracking-[0.18em] text-zoa-slate-60">
              {product.name}
            </p>
            <p className="font-sans text-[17px] font-medium text-zoa-slate tabular">
              {fmt(product.price)}
            </p>
          </div>
          <button
            onClick={handleAddToCart}
            tabIndex={barVisible ? 0 : -1}
            className="ml-auto flex min-h-12 shrink-0 cursor-pointer items-center justify-center gap-2 bg-zoa-forest px-6 font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-zoa-surface transition-colors duration-200 hover:bg-zoa-forest-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:translate-y-px"
          >
            <ShoppingBag size={15} strokeWidth={1.5} aria-hidden />
            {added ? "Agregado" : "Añadir a la bolsa"}
          </button>
        </div>
      </div>

      {/* ══ Modal: guía de tallas ══ */}
      <AnimatePresence>
        {sizeGuideOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-zoa-slate/50 p-4 backdrop-blur-sm"
            onClick={() => setSizeGuideOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="relative w-full max-w-2xl overflow-hidden border border-zoa-line bg-zoa-sand shadow-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="hairline-b flex items-center justify-between px-5 py-4">
                <Overline as="h3">Guía de tallas</Overline>
                <button
                  onClick={() => setSizeGuideOpen(false)}
                  className="flex h-11 w-11 cursor-pointer items-center justify-center text-zoa-slate-60 transition-colors hover:text-zoa-slate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate"
                  aria-label="Cerrar"
                >
                  <X size={18} aria-hidden />
                </button>
              </div>
              <iframe
                src="/blog/guia-de-tallas-ropa-mujer-como-elegir"
                className="w-full border-0"
                style={{ height: "calc(85vh - 60px)" }}
                title="Guía de tallas"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Sub-componentes compartidos ─────────────────────────────────────────────

function ProductInfoHeader({
  product, onOpenSizeGuide, onBack,
}: {
  product: Product;
  onOpenSizeGuide: () => void;
  onBack: () => void;
}) {
  const totalStock = Object.values(product.stock ?? {}).reduce((a, b) => a + b, 0);
  const isFullyOutOfStock = totalStock === 0;
  const lowStock = totalStock > 0 && totalStock <= 5;
  const priceDiscount = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  return (
    <div>
      {/* Breadcrumb + regresar */}
      <div className="mb-2 flex items-center gap-3">
        <button
          onClick={onBack}
          aria-label="Regresar"
          className="-ml-1 flex h-11 w-11 cursor-pointer items-center justify-center text-zoa-slate-60 transition-colors hover:text-zoa-slate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate"
        >
          <ArrowLeft size={14} strokeWidth={1.4} aria-hidden />
        </button>
        <Overline>{product.category}</Overline>
      </div>

      <div className="flex flex-wrap items-start gap-3">
        <h1 className="font-display text-[clamp(1.75rem,3.4vw,2.9rem)] font-normal leading-[1.04] tracking-[-0.02em] text-zoa-slate">
          {product.name}
        </h1>
        {isFullyOutOfStock && (
          <span className="mt-1 border border-zoa-line-strong px-2.5 py-1 font-sans text-[9px] uppercase tracking-[0.2em] text-zoa-slate">
            Agotado
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-baseline gap-3">
        <span className="font-sans text-[clamp(22px,2.4vw,28px)] font-normal text-zoa-slate tabular">
          {fmt(product.price)}
        </span>
        {product.originalPrice && (
          <span className="font-sans text-sm text-zoa-slate-60 line-through tabular">
            {fmt(product.originalPrice)}
          </span>
        )}
      </div>

      {/* Leyenda vino (Bodoni italic) */}
      {(priceDiscount !== null || lowStock) && (
        <p className="mt-2 font-display text-[13px] italic text-zoa-wine">
          {priceDiscount !== null ? `−${priceDiscount}% · Precios especiales` : "Últimas tallas"}
          {priceDiscount !== null && lowStock ? " · Últimas tallas" : ""}
        </p>
      )}

      {/* SKU + marca + guía de tallas + compartir */}
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
        <span className="font-sans text-[10px] uppercase tracking-[0.16em] text-zoa-slate-60">
          SKU <span className="text-zoa-slate">{product.sku ?? product.id}</span>
        </span>
        <span className="font-sans text-[10px] uppercase tracking-[0.16em] text-zoa-slate-60">
          Marca <span className="text-zoa-slate">{product.brand || "Zoa"}</span>
        </span>
        <button
          onClick={onOpenSizeGuide}
          className="link-underline cursor-pointer font-sans text-[10px] uppercase tracking-[0.16em] text-zoa-slate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate"
        >
          Guía de tallas
        </button>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            const url = `https://wa.me/?text=${encodeURIComponent(`¡Mira este producto de Zoa! ${product.name} — ${window.location.href}`)}`;
            window.open(url, "_blank", "noopener,noreferrer");
          }}
          title="Compartir en WhatsApp"
          className="ml-auto flex min-h-11 cursor-pointer items-center gap-2 border border-zoa-line px-3 text-zoa-slate transition-colors duration-200 hover:bg-zoa-slate/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate"
          aria-label="Compartir en WhatsApp"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.79 23.492l4.623-1.467A11.932 11.932 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.168 0-4.191-.586-5.932-1.608l-.42-.252-2.744.87.885-2.683-.276-.44A9.77 9.77 0 012.182 12c0-5.414 4.404-9.818 9.818-9.818S21.818 6.586 21.818 12 17.414 21.818 12 21.818z"/></svg>
          <span className="font-sans text-[10px] uppercase tracking-[0.15em]">Compartir</span>
        </a>
      </div>
    </div>
  );
}

function ProductFormSection({
  product, selectedSize, setSelectedSize, sizeError, added, handleAddToCart, handleBuyNow, onVariantSelect,
}: {
  product: Product;
  selectedSize: Size | null;
  setSelectedSize: (s: Size | null) => void;
  sizeError: boolean;
  added: boolean;
  handleAddToCart: () => void;
  handleBuyNow: () => void;
  onVariantSelect?: (variantId: string) => void;
}) {
  const totalStock = Object.values(product.stock).reduce((a, b) => a + b, 0);
  const isFullyOutOfStock = totalStock === 0;

  // Mapa de nombre de color → hex (del Sheet viene el nombre)
  const COLOR_HEX: Record<string, string> = {
    Negro: "#1A1A1A", Blanco: "#F5F0EB", Azul: "#2C4A8C", "Azul Fuerte": "#1A3270",
    Beige: "#D4B896", Gris: "#9A9490", Vino: "#7B2D3E", Rosa: "#E8A0B0",
    "Rosa palo": "#E8C4B8", Camel: "#C49A6C", Crema: "#EDE4D3", Verde: "#3A6B4A",
    "Verde olivo": "#6B6B3A", Terracota: "#C1704A", Nude: "#D4A990",
    Rojo: "#C0392B", Mostaza: "#D4A017", Hueso: "#F0EAD6", Arena: "#E8D5B0",
    Café: "#6F4E37", Morado: "#5B2C6F", Naranja: "#E67E22", Amarillo: "#F1C40F",
    Marfil: "#F0EAD6", Coral: "#E8856E", "Azul cielo": "#87CEEB",
  };

  const productColor = product.color?.trim();
  const hasVariants = (product.variants ?? []).length > 1;
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Selector de color */}
      {(hasVariants || productColor) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="overline">Color</p>
            <p className="font-sans text-[10px] uppercase tracking-[0.16em] text-zoa-slate">
              {hoveredColor ?? productColor ?? ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {hasVariants
              ? (product.variants ?? []).map((v) => {
                  const isCurrent = v.id === product.id;
                  return (
                    <button
                      key={v.id}
                      title={v.color}
                      aria-label={v.color}
                      aria-pressed={isCurrent}
                      onClick={() => !isCurrent && onVariantSelect?.(v.id)}
                      onMouseEnter={() => setHoveredColor(v.color)}
                      onMouseLeave={() => setHoveredColor(null)}
                      className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate focus-visible:ring-offset-2 ${
                        isCurrent ? "cursor-default" : "cursor-pointer hover:scale-110"
                      } transition-transform duration-200`}
                    >
                      <span
                        style={{
                          backgroundColor: v.hex,
                          width: "2rem",
                          height: "2rem",
                          borderRadius: "50%",
                          display: "block",
                        }}
                      />
                      {isCurrent && (
                        <span style={{
                          position: "absolute", inset: "2px",
                          borderRadius: "50%",
                          border: "1.5px solid var(--color-zoa-slate)",
                          pointerEvents: "none",
                        }} />
                      )}
                      <span style={{
                        position: "absolute", inset: "6px",
                        borderRadius: "50%",
                        border: "1px solid rgba(43,60,66,0.2)",
                        pointerEvents: "none",
                      }} />
                    </button>
                  );
                })
              : productColor
              ? (
                  <span
                    title={productColor}
                    aria-label={productColor}
                    style={{
                      backgroundColor: COLOR_HEX[productColor] ?? "#DDDBD3",
                      width: "2rem",
                      height: "2rem",
                      borderRadius: "50%",
                      display: "block",
                      border: "2px solid var(--color-zoa-slate)",
                      position: "relative",
                    }}
                  >
                    <span style={{
                      position: "absolute", inset: 0,
                      borderRadius: "50%",
                      border: "1px solid rgba(43,60,66,0.2)",
                      pointerEvents: "none",
                    }} />
                  </span>
                )
              : null
            }
          </div>
        </div>
      )}

      {/* Tallas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <p className="overline">Selecciona tu talla</p>
          {sizeError && (
            <p role="alert" className="font-display text-[13px] italic text-zoa-wine">
              Elige una talla
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2.5">
          {SIZES.map((size) => {
            const stock = product.stock[size];
            const available = stock > 0;
            const selected = selectedSize === size;
            return (
              <button
                key={size}
                onClick={() => available && setSelectedSize(selected ? null : size)}
                disabled={!available}
                aria-label={`Talla ${size}${!available ? " — agotada" : ""}`}
                aria-pressed={selected}
                className={`relative h-12 w-12 border font-sans text-[13px] tracking-wider transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate focus-visible:ring-offset-1
                  ${available
                    ? selected
                      ? "cursor-pointer border-zoa-forest bg-zoa-forest text-zoa-surface"
                      : "cursor-pointer border-zoa-line-strong text-zoa-slate hover:border-zoa-slate"
                    : "cursor-not-allowed border-zoa-line text-zoa-slate-60/60"
                  }`}
              >
                {size}
                {!available && (
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 48 48" aria-hidden="true">
                      <line x1="6" y1="6" x2="42" y2="42" stroke="var(--color-zoa-line-strong)" strokeWidth="1.5" />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {/* Indicador de stock: disponible en forest · últimas piezas en vino */}
        {selectedSize && product.stock[selectedSize] > 2 && (
          <p className="font-display text-[13px] italic text-zoa-forest">
            Disponible
          </p>
        )}
        {selectedSize && product.stock[selectedSize] > 0 && product.stock[selectedSize] <= 2 && (
          <p className="font-display text-[13px] italic text-zoa-wine">
            Últimas {product.stock[selectedSize]} {product.stock[selectedSize] === 1 ? "pieza" : "piezas"}!
          </p>
        )}
      </div>

      {/* CTAs */}
      {isFullyOutOfStock ? (
        <div className="flex items-center justify-center border border-zoa-line bg-zoa-sand py-4">
          <p className="font-sans text-[10px] font-medium uppercase tracking-[0.22em] text-zoa-slate-60">Agotado</p>
        </div>
      ) : (
        <div className="space-y-3">
          <motion.button
            onClick={handleAddToCart}
            whileTap={{ scale: 0.99 }}
            className="flex h-14 w-full cursor-pointer items-center justify-center gap-3 bg-zoa-forest font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-zoa-surface transition-colors duration-200 hover:bg-zoa-forest-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:translate-y-px"
          >
            <ShoppingBag size={15} strokeWidth={1.5} aria-hidden />
            {added ? "¡Agregado!" : "Añadir a la bolsa"}
          </motion.button>
          <motion.button
            onClick={handleBuyNow}
            whileTap={{ scale: 0.99 }}
            className="flex h-14 w-full cursor-pointer items-center justify-center gap-3 border border-zoa-forest-35 font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-zoa-forest transition-[background-color,border-color,color] duration-200 hover:border-zoa-forest hover:bg-zoa-forest hover:text-zoa-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-forest focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:translate-y-px"
          >
            <Zap size={14} strokeWidth={1.5} aria-hidden />
            Comprar ahora
          </motion.button>
        </div>
      )}
    </div>
  );
}

function AccordionBlock({ description }: { description?: string }) {
  const descText = description && description.trim()
    ? description
    : "Pieza de colección confeccionada con materiales de primera calidad. Diseñada para la mujer moderna que valora el detalle y la elegancia en su día a día.";

  const items: AccordionEntry[] = [
    {
      id: "desc",
      label: "Descripción",
      content: <p>{descText}</p>,
    },
    {
      id: "ship",
      label: "Envío y devoluciones",
      content: <p>Envío $150 MXN · Gratis en compras ≥ $3,000 MXN. Tiempo: 3–5 días hábiles. Cambios hasta 7 días hábiles.</p>,
    },
    {
      id: "care",
      label: "Cuidado del tejido",
      content: <p>Lavar a mano o ciclo delicado. No usar blanqueador. Planchar a temperatura baja.</p>,
    },
  ];

  return <Accordion items={items} defaultOpenId="desc" />;
}

function CrossSellSection({ crossSell }: { crossSell: Product[] }) {
  if (!crossSell.length) return null;

  return (
    <div className="hairline-t pt-8">
      <Overline>Acompaña tu pedido</Overline>

      <div className="no-scrollbar mt-6 flex gap-4 overflow-x-auto">
        {crossSell.map((p) => (
          <Link
            key={p.id}
            href={`/product/${p.id}`}
            className="group w-36 shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate"
          >
            <div className="relative mb-3 aspect-[3/4] overflow-hidden border border-zoa-line bg-zoa-surface">
              {p.images[0] && (
                <Image
                  src={p.images[0]}
                  alt={p.name}
                  fill
                  className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                  sizes="144px"
                />
              )}
            </div>
            <p className="font-sans text-[9px] uppercase tracking-[0.18em] text-zoa-slate-60">{p.category}</p>
            <p className="truncate font-sans text-[13px] font-normal text-zoa-slate">{p.name}</p>
            <p className="mt-0.5 font-sans text-[12px] text-zoa-slate tabular">{fmt(p.price)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
