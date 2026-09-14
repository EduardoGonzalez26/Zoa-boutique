"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ChevronLeft, ChevronRight as ChevronRightIcon, Shield, CreditCard, Lock, Zap, ChevronDown, ArrowLeft } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import type { Product, Size } from "@/lib/types";
import ProductReviews from "@/components/ProductReviews";
import { X } from "lucide-react";

interface ProductGalleryClientProps {
  product: Product;
  allProducts?: Product[]; // for cross-sell recommendations
}

const SIZES: Size[] = ["XS", "S", "M", "L", "LOV", "XL"];

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

export default function ProductGalleryClient({ product, allProducts = [] }: ProductGalleryClientProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [added, setAdded] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  // Single open accordion key — null = all closed, "desc"/"ship"/"care" = that one open
  const [openAccordion, setOpenAccordion] = useState<"desc" | "ship" | "care" | null>("desc");
  const { addItem, openCart, openCartAtCheckout } = useCartStore();
  const router = useRouter();

  const images = product.images.length > 0 ? product.images : ["/placeholder.jpg"];

  // ── Native CSS scroll-snap slider ─────────────────────────────────────
  // overflow-x-scroll + scroll-snap handles ALL touch swipe natively.
  // No JS touch listeners needed — they would interfere with native scroll.
  const sliderRef = useRef<HTMLDivElement>(null);

  // Programmatic scroll for arrows/dots
  const scrollToSlide = useCallback((idx: number) => {
    const el = sliderRef.current;
    if (!el) return;
    el.scrollTo({ left: idx * el.clientWidth, behavior: "smooth" });
  }, []);

  // Track current slide index by watching scroll position
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


  const toggleAccordion = (key: "desc" | "ship" | "care") => {
    setOpenAccordion((prev) => (prev === key ? null : key));
  };

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

  // Cross-sell: pick 1 product per recommended category
  const crossSellCats = CROSS_SELL_MAP[product.category] ?? ["Blusas", "Sacos", "Pantalones"];
  const crossSell = crossSellCats
    .map((cat) => allProducts.find((p) => p.category === cat && p.id !== product.id))
    .filter(Boolean) as Product[];

  // Accordion item component
  const AccordionItem = ({
    id, label, children,
  }: { id: "desc" | "ship" | "care"; label: string; children: React.ReactNode }) => {
    const isOpen = openAccordion === id;
    return (
      <div className="border-b border-[var(--color-stone-100)]">
        <button
          type="button"
          onClick={() => toggleAccordion(id)}
          className="cursor-pointer w-full flex justify-between items-center py-4 font-sans text-[11px] tracking-[0.2em] uppercase text-[var(--color-stone-600)] text-left"
        >
          {label}
          <ChevronDown
            size={13}
            className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              key={id}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              style={{ overflow: "hidden" }}
            >
              <div className="pb-4 pr-4">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <>
      {/* ── Mobile Layout ────────────────────────────────────────── */}
      <div className="lg:hidden">
        {/* Mobile gallery — CSS scroll-snap */}
        {/* Outer: establece el aspect-ratio y el espacio */}
        <div className="relative w-full aspect-[4/5] bg-[var(--color-stone-100)]">
          {/* Scroll container: absolute inset-0 para tener dimensiones explícitas */}
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

          {/* Controls superpuestos — dentro del wrapper con posición relativa */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-white/70 backdrop-blur-sm rounded-full z-10 shadow"
                aria-label="Anterior"
              >
                <ChevronLeft size={18} strokeWidth={1.5} />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-white/70 backdrop-blur-sm rounded-full z-10 shadow"
                aria-label="Siguiente"
              >
                <ChevronRightIcon size={18} strokeWidth={1.5} />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goToImage(i)}
                    className={`rounded-full transition-all duration-200 ${
                      i === selectedImage
                        ? "w-4 h-2 bg-white"
                        : "w-2 h-2 bg-white/50"
                    }`}
                    aria-label={`Imagen ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>


        {/* Mobile product info */}
        <div className="px-5 pt-6 pb-10 space-y-5">
          <div>
            {/* Breadcrumb row with back button */}
            <div className="flex items-center gap-2 mb-1">
              <button onClick={() => router.back()}
                aria-label="Regresar"
                className="p-1 -ml-1 text-[var(--color-stone-400)] hover:text-[var(--color-charcoal)] transition-colors cursor-pointer">
                <ArrowLeft size={13} strokeWidth={1.5} />
              </button>
              <p className="font-sans text-[9px] tracking-[0.3em] uppercase text-[var(--color-stone-400)]">{product.category}</p>
            </div>
            <h1 className="font-serif text-2xl text-[var(--color-charcoal)] leading-snug">{product.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="font-serif text-xl text-[var(--color-charcoal)]">{fmt(product.price)}</span>
              {product.originalPrice && <span className="font-sans text-sm text-[var(--color-stone-400)] line-through">{fmt(product.originalPrice)}</span>}
            </div>
            {/* SKU + Marca + WhatsApp share */}
            <div className="flex items-center gap-4 mt-2">
              <span className="font-sans text-[9px] tracking-wide text-[var(--color-stone-400)]">SKU: <span className="text-[var(--color-stone-600)]">{product.sku ?? product.id}</span></span>
              <span className="font-sans text-[9px] tracking-wide text-[var(--color-stone-400)]">Marca: <span className="text-[var(--color-stone-600)]">{product.brand || 'Zoa'}</span></span>
              <button
                onClick={() => setSizeGuideOpen(true)}
                className="cursor-pointer font-sans text-[9px] tracking-wide text-[var(--color-gold)] hover:text-[var(--color-charcoal)] underline underline-offset-2 transition-colors"
              >Guía de tallas</button>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  const url = `https://wa.me/?text=${encodeURIComponent(`¡Mira este producto de Zoa! ${product.name} — ${window.location.href}`)}`;
                  window.open(url, '_blank', 'noopener,noreferrer');
                }}
                title="Compartir en WhatsApp"
                className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366]/5 transition-colors cursor-pointer"
                aria-label="Compartir en WhatsApp"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.79 23.492l4.623-1.467A11.932 11.932 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.168 0-4.191-.586-5.932-1.608l-.42-.252-2.744.87.885-2.683-.276-.44A9.77 9.77 0 012.182 12c0-5.414 4.404-9.818 9.818-9.818S21.818 6.586 21.818 12 17.414 21.818 12 21.818z"/></svg>
                <span className="font-sans text-[10px] tracking-[0.15em] uppercase">Compartir</span>
              </a>
            </div>
          </div>
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
          <AccordionBlock openAccordion={openAccordion} toggleAccordion={toggleAccordion} AccordionItem={AccordionItem} description={product.description} />
          <ProductReviews productId={product.id} productName={product.name} />
          <CrossSellSection crossSell={crossSell} />
        </div>
      </div>

      {/* ── Desktop Layout ─────────────────────────────────────────────────── */}
      <div className="hidden lg:grid lg:grid-cols-2 min-h-screen">
        {/* Left — Image stack, scrolls with the page */}
        <div className="space-y-1 bg-[var(--color-stone-100)]">
          {images.map((img, i) => (
            <div key={i} className="relative aspect-[4/5]" onClick={() => setSelectedImage(i)}>
              <Image src={img} alt={`${product.name} ${i + 1}`} fill className="object-cover" sizes="50vw" priority={i === 0} />
            </div>
          ))}
        </div>

        {/* Right — pure sticky, no scroll, no height limit */}
        <div className="sticky top-16 self-start px-10 xl:px-16 py-14 space-y-7">
          <div>
          {/* Breadcrumb with back button */}
          <div className="flex items-center gap-2 mb-1">
            <button onClick={() => router.back()}
              aria-label="Regresar"
              className="p-1 -ml-1 text-[var(--color-stone-400)] hover:text-[var(--color-charcoal)] transition-colors cursor-pointer">
              <ArrowLeft size={13} strokeWidth={1.5} />
            </button>
            <p className="font-sans text-[9px] tracking-[0.4em] uppercase text-[var(--color-stone-400)]">{product.category} · {product.collection}</p>
          </div>
            <h1 className="font-serif text-3xl xl:text-4xl text-[var(--color-charcoal)] leading-snug mb-3">{product.name}</h1>
            <div className="flex items-center gap-4 mb-2">
              <span className="font-serif text-2xl text-[var(--color-charcoal)]">{fmt(product.price)}</span>
              {product.originalPrice && <span className="font-sans text-base text-[var(--color-stone-400)] line-through">{fmt(product.originalPrice)}</span>}
            </div>
            {/* SKU + Marca + WhatsApp share */}
            <div className="flex items-center gap-5">
              <span className="font-sans text-[9px] tracking-wide text-[var(--color-stone-400)]">SKU: <span className="text-[var(--color-stone-600)]">{product.sku ?? product.id}</span></span>
              <span className="font-sans text-[9px] tracking-wide text-[var(--color-stone-400)]">Marca: <span className="text-[var(--color-stone-600)]">{product.brand || 'Zoa'}</span></span>
              <button
                onClick={() => setSizeGuideOpen(true)}
                className="cursor-pointer font-sans text-[9px] tracking-wide text-[var(--color-gold)] hover:text-[var(--color-charcoal)] underline underline-offset-2 transition-colors"
              >Guía de tallas</button>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  const url = `https://wa.me/?text=${encodeURIComponent(`¡Mira este producto de Zoa! ${product.name} — ${window.location.href}`)}`;
                  window.open(url, '_blank', 'noopener,noreferrer');
                }}
                title="Compartir en WhatsApp"
                className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366]/5 transition-colors cursor-pointer"
                aria-label="Compartir en WhatsApp"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.79 23.492l4.623-1.467A11.932 11.932 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.168 0-4.191-.586-5.932-1.608l-.42-.252-2.744.87.885-2.683-.276-.44A9.77 9.77 0 012.182 12c0-5.414 4.404-9.818 9.818-9.818S21.818 6.586 21.818 12 17.414 21.818 12 21.818z"/></svg>
                <span className="font-sans text-[10px] tracking-[0.15em] uppercase">Compartir</span>
              </a>
            </div>
          </div>
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

          {/* Trust badges */}
          <div className="border-t border-[var(--color-stone-100)] pt-5">
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: <Shield size={14} strokeWidth={1.5} />, text: "Pago protegido por Mercado Pago" },
                { icon: <Lock size={14} strokeWidth={1.5} />, text: "Certificado SSL" },
                { icon: <CreditCard size={14} strokeWidth={1.5} />, text: "Aceptamos todas las tarjetas" },
              ].map(({ icon, text }) => (
                <div key={text} className="flex flex-col items-center gap-1.5 text-center">
                  <span className="text-[var(--color-stone-400)]">{icon}</span>
                  <p className="text-[9px] font-sans text-[var(--color-stone-400)] tracking-wide leading-snug">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <AccordionBlock openAccordion={openAccordion} toggleAccordion={toggleAccordion} AccordionItem={AccordionItem} description={product.description} />

          {/* Reviews section */}
          <ProductReviews productId={product.id} productName={product.name} />

          {/* Acompaña tu pedido — dentro del panel, después de los acordeones */}
          <CrossSellSection crossSell={crossSell} />
        </div>
      </div>

      {/* ── Size Guide Modal ── */}
      <AnimatePresence>
        {sizeGuideOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setSizeGuideOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-stone-100)]">
                <h3 className="font-serif text-lg text-[var(--color-charcoal)]">Guía de tallas</h3>
                <button
                  onClick={() => setSizeGuideOpen(false)}
                  className="cursor-pointer p-1 rounded-lg hover:bg-[var(--color-stone-100)] transition-colors"
                  aria-label="Cerrar"
                >
                  <X size={18} />
                </button>
              </div>
              <iframe
                src="/blog/guia-de-tallas-ropa-mujer-como-elegir"
                className="w-full border-0"
                style={{ height: "calc(85vh - 52px)" }}
                title="Guía de tallas"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Shared sub-components ───────────────────────────────────────────────────


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
    Negro: "#1C1917", Blanco: "#F5F0EB", Azul: "#2C4A8C", "Azul Fuerte": "#1A3270",
    Beige: "#D4B896", Gris: "#9A9490", Vino: "#7B2D3E", Rosa: "#E8A0B0",
    "Rosa palo": "#E8C4B8", Camel: "#C49A6C", Crema: "#EDE8E2", Verde: "#3A6B4A",
    "Verde olivo": "#6B6B3A", Terracota: "#C1704A", Nude: "#D4A990",
    Rojo: "#C0392B", Mostaza: "#D4A017", Hueso: "#F0EAD6", Arena: "#E8D5B0",
    Café: "#6F4E37", Morado: "#5B2C6F", Naranja: "#E67E22", Amarillo: "#F1C40F",
    Marfil: "#F0EAD6", Coral: "#E8856E", "Azul cielo": "#87CEEB",
  };

  // Color swatches:
  // — Si el producto tiene variantes (cargado via getGroupedProductById), muestra TODAS
  //   y navega al hacer click en una variante distinta.
  // — Si no hay variantes, muestra solo el color del producto actual (sin navegación).
  const productColor = product.color?.trim();
  const hasVariants = (product.variants ?? []).length > 1;

  const [hoveredColor, setHoveredColor] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      {/* Selector de colores */}
      {(hasVariants || productColor) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-[var(--color-stone-400)]">Color</p>
            <p className="font-sans text-[10px] text-[var(--color-stone-600)] tracking-wide">
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
                      onClick={() => !isCurrent && onVariantSelect?.(v.id)}
                      onMouseEnter={() => setHoveredColor(v.color)}
                      onMouseLeave={() => setHoveredColor(null)}
                      className={`relative shrink-0 focus:outline-none ${
                        isCurrent ? "cursor-default" : "cursor-pointer hover:scale-110"
                      } transition-transform duration-200`}
                      style={{
                        backgroundColor: v.hex,
                        width: "2rem",
                        height: "2rem",
                        borderRadius: "50%",
                        border: "none",
                        padding: 0,
                        display: "block",
                      }}
                    >
                      {/* Ring on current variant */}
                      {isCurrent && (
                        <span style={{
                          position: "absolute", inset: "-4px",
                          borderRadius: "50%",
                          border: "2px solid var(--color-charcoal)",
                          pointerEvents: "none",
                        }} />
                      )}
                      {/* Inner border for light colors */}
                      <span style={{
                        position: "absolute", inset: 0,
                        borderRadius: "50%",
                        border: "1px solid rgba(0,0,0,0.12)",
                        pointerEvents: "none",
                      }} />
                    </button>
                  );
                })
              : productColor
              ? (
                  // Sin variantes — solo muestra el color actual, sin navegación
                  <span
                    title={productColor}
                    style={{
                      backgroundColor: COLOR_HEX[productColor] ?? "#D9D1C7",
                      width: "2rem",
                      height: "2rem",
                      borderRadius: "50%",
                      display: "block",
                      border: "2px solid var(--color-charcoal)",
                      position: "relative",
                    }}
                  >
                    <span style={{
                      position: "absolute", inset: 0,
                      borderRadius: "50%",
                      border: "1px solid rgba(0,0,0,0.12)",
                      pointerEvents: "none",
                    }} />
                  </span>
                )
              : null
            }
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-[var(--color-stone-400)]">Selecciona tu talla</p>
          {sizeError && <p className="font-sans text-[10px] text-red-500 animate-pulse">Elige una talla</p>}
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
                className={`cursor-pointer relative w-12 h-12 font-sans text-[13px] tracking-wider border rounded-md transition-all duration-200
                  ${available
                    ? selected
                      ? "bg-[var(--color-charcoal)] text-[var(--color-cream)] border-[var(--color-charcoal)]"
                      : "border-[var(--color-stone-200)] text-[var(--color-charcoal)] hover:border-[var(--color-charcoal)]"
                    : "border-[var(--color-stone-100)] text-[var(--color-stone-400)]/50 cursor-not-allowed bg-[var(--color-stone-100)]/30"
                  }`}
              >
                {size}
                {!available && (
                  <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 48 48">
                      <line x1="6" y1="6" x2="42" y2="42" stroke="var(--color-stone-200)" strokeWidth="1.5" />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {selectedSize && product.stock[selectedSize] > 0 && product.stock[selectedSize] <= 2 && (
          <p className="text-[11px] font-sans text-[var(--color-gold)]">
            ¡Últimas {product.stock[selectedSize]} {product.stock[selectedSize] === 1 ? "pieza" : "piezas"}!
          </p>
        )}
      </div>

      {isFullyOutOfStock ? (
        <div className="flex items-center justify-center py-4 border border-[var(--color-stone-200)] rounded-lg">
          <p className="font-sans text-xs tracking-[0.2em] uppercase text-[var(--color-stone-400)]">Agotado</p>
        </div>
      ) : (
        <div className="space-y-3">
          <motion.button
            onClick={handleAddToCart}
            whileTap={{ scale: 0.98 }}
            className={`cursor-pointer w-full flex items-center justify-center gap-3 py-5 md:py-3.5 rounded-lg font-sans text-xs tracking-[0.3em] uppercase transition-colors duration-300
              ${added ? "bg-[var(--color-gold)] text-[var(--color-cream)]" : "bg-[var(--color-charcoal)] text-[var(--color-cream)] hover:bg-[var(--color-gold)]"}`}
          >
            <ShoppingBag size={15} strokeWidth={1.5} />
            {added ? "¡Agregado!" : "Agregar al carrito"}
          </motion.button>
          <motion.button
            onClick={handleBuyNow}
            whileTap={{ scale: 0.98 }}
            className="cursor-pointer w-full flex items-center justify-center gap-3 py-3.5 rounded-lg font-sans text-xs tracking-[0.3em] uppercase border border-[var(--color-charcoal)] text-[var(--color-charcoal)] hover:bg-[var(--color-cream-dark)] transition-colors duration-300"
          >
            <Zap size={14} strokeWidth={1.5} />
            Comprar Ahora
          </motion.button>
        </div>
      )}
    </div>
  );
}

function AccordionBlock({
  openAccordion, toggleAccordion, AccordionItem, description,
}: {
  openAccordion: string | null;
  toggleAccordion: (id: "desc" | "ship" | "care") => void;
  AccordionItem: React.ComponentType<{ id: "desc" | "ship" | "care"; label: string; children: React.ReactNode }>;
  description?: string;
}) {
  const descText = description && description.trim()
    ? description
    : "Pieza de colección confeccionada con materiales de primera calidad. Diseñada para la mujer moderna que valora el detalle y la elegancia en su día a día.";

  return (
    <div className="space-y-0 border-t border-[var(--color-stone-100)]">
      <AccordionItem id="desc" label="Descripción">
        <p className="text-[13px] font-sans text-[var(--color-stone-600)] leading-relaxed">
          {descText}
        </p>
      </AccordionItem>
      <AccordionItem id="ship" label="Envío y devoluciones">
        <p className="text-[13px] font-sans text-[var(--color-stone-600)] leading-relaxed">
          Envío $150 MXN · Gratis en compras ≥ $3,000 MXN. Tiempo: 3–5 días hábiles. Cambios hasta 7 días hábiles.
        </p>
      </AccordionItem>
      <AccordionItem id="care" label="Cuidado del tejido">
        <p className="text-[13px] font-sans text-[var(--color-stone-600)] leading-relaxed">
          Lavar a mano o ciclo delicado. No usar blanqueador. Planchar a temperatura baja.
        </p>
      </AccordionItem>
    </div>
  );
}

function CrossSellSection({ crossSell }: { crossSell: Product[] }) {
  if (!crossSell.length) return null;
  const fmt = (n: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(n);

  return (
    <div className="border-t border-[var(--color-stone-100)] pt-8">
      <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-[var(--color-stone-400)] mb-5">
        Acompaña tu pedido
      </p>
      <div className="grid grid-cols-3 gap-3">
        {crossSell.map((p) => (
          <Link key={p.id} href={`/product/${p.id}`} className="group block">
            <div className="relative aspect-[3/4] bg-[var(--color-stone-100)] overflow-hidden rounded-md mb-2">
              {p.images[0] && (
                <Image
                  src={p.images[0]}
                  alt={p.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 33vw, 20vw"
                />
              )}
            </div>
            <p className="font-sans text-[8px] tracking-[0.15em] uppercase text-[var(--color-stone-400)] mb-0.5">{p.category}</p>
            <p className="font-serif text-[13px] text-[var(--color-charcoal)] leading-tight truncate">{p.name}</p>
            <p className="font-sans text-[12px] text-[var(--color-charcoal)] mt-0.5">{fmt(p.price)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
