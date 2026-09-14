"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, X, Search, ChevronDown } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/types";

const CATEGORIES = [
  "Blusas", "Sweaters", "Sacos", "Chamarras",
  "Pantalones", "Vestidos", "Faldas", "Chalecos", "Mallones",
];

const COLLECTIONS = ["Otoño / Invierno", "Primavera / Verano", "Esenciales", "Recomendados", "Outlet"];

const SIZES = ["XS", "S", "M", "L", "LOV", "XL"];

// Colors matching exact values from Google Sheet's COLOR column
const COLORS: { label: string; hex: string }[] = [
  { label: "Negro",      hex: "#1a1a1a" },
  { label: "Blanco",     hex: "#f5f5f0" },
  { label: "Crema",      hex: "#e8dcc8" },
  { label: "Hueso",      hex: "#f0ead6" },
  { label: "Beige",      hex: "#d4b896" },
  { label: "Camel",      hex: "#c49a6c" },
  { label: "Café",       hex: "#6f4e37" },
  { label: "Arena",      hex: "#e8d5b0" },
  { label: "Nude",       hex: "#d4a990" },
  { label: "Rosa",       hex: "#e8a0b0" },
  { label: "Rosa palo",  hex: "#e8c4b8" },
  { label: "Coral",      hex: "#e8856e" },
  { label: "Rojo",       hex: "#c0392b" },
  { label: "Vino",       hex: "#6B1B2E" },
  { label: "Morado",     hex: "#5b2c6f" },
  { label: "Azul",       hex: "#2c4a8c" },
  { label: "Azul Fuerte",hex: "#1a3270" },
  { label: "Azul cielo", hex: "#87ceeb" },
  { label: "Verde",      hex: "#3a6b4a" },
  { label: "Verde olivo",hex: "#6b6b3a" },
  { label: "Gris",       hex: "#8a8a8a" },
  { label: "Mostaza",    hex: "#d4a017" },
  { label: "Terracota",  hex: "#c1704a" },
  { label: "Naranja",    hex: "#e67e22" },
];

const SHOW_INITIALLY = 3;

interface TiendaClientProps { products: Product[]; }

export default function TiendaClient({ products }: TiendaClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inlineSearch, setInlineSearch] = useState("");
  const [showAllCats, setShowAllCats] = useState(false);
  const [showAllCols, setShowAllCols] = useState(false);

  const activeCategory   = searchParams.get("categoria") ?? "";
  const activeCollection = searchParams.get("coleccion") ?? "";
  const searchQuery      = searchParams.get("q") ?? "";
  const activeSize       = searchParams.get("talla") ?? "";
  const activeColor      = searchParams.get("color") ?? "";

  // ── Dynamic filter calculation: only show filters that have products ──
  const availableCategories = CATEGORIES.filter(cat =>
    products.some(p => p.category === cat)
  );
  const availableCollections = COLLECTIONS.filter(col => {
    const isOutlet = col.toLowerCase() === "outlet";
    return products.some(p =>
      p.collection.toLowerCase().includes(col.toLowerCase()) ||
      (isOutlet && (p.discount ?? 0) > 0)
    );
  });
  const availableSizes = SIZES.filter(s =>
    products.some(p => (p.stock[s as keyof typeof p.stock] ?? 0) > 0)
  );
  const availableColors = COLORS.filter(({ label }) =>
    products.some(p => (p.color ?? "").toLowerCase() === label.toLowerCase())
  );

  const filtered = products.filter((p) => {
    const catOk   = !activeCategory   || p.category   === activeCategory;
    const isOutlet = activeCollection.toLowerCase() === "outlet";
    const colOk   = !activeCollection ||
      p.collection.toLowerCase().includes(activeCollection.toLowerCase()) ||
      (isOutlet && (p.discount ?? 0) > 0);
    const sizeOk  = !activeSize || (p.stock[activeSize as keyof typeof p.stock] ?? 0) > 0;
    const colorOk = !activeColor || (p.color ?? "").toLowerCase() === activeColor.toLowerCase();
    const term    = (inlineSearch || searchQuery).toLowerCase();
    const qOk     = !term || p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term) || p.collection.toLowerCase().includes(term) || (p.sku ?? "").toLowerCase().includes(term) || (p.brand ?? "").toLowerCase().includes(term) || (p.skus ?? []).some((s) => s.toLowerCase().includes(term));
    return catOk && colOk && sizeOk && colorOk && qOk;
  });

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    startTransition(() => router.push(`/tienda?${params.toString()}`));
  };

  const clearAll = () => { setInlineSearch(""); startTransition(() => router.push("/tienda")); };
  const hasFilters = !!activeCategory || !!activeCollection || !!searchQuery || !!activeSize || !!activeColor || !!inlineSearch;

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setSidebarOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Visible lists based on expand state
  const visibleCats = showAllCats ? availableCategories : availableCategories.slice(0, SHOW_INITIALLY);
  const visibleCols = showAllCols ? availableCollections : availableCollections.slice(0, SHOW_INITIALLY);

  const SidebarContent = ({ onClose }: { onClose?: () => void }) => (
    <div className="space-y-6">
      {/* Buscar */}
      <div>
        <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--color-stone-400)] font-sans mb-2">Buscar</p>
        <div className="flex items-center gap-2 border border-[var(--color-stone-200)] rounded-lg px-3 py-2">
          <Search size={13} className="text-[var(--color-stone-400)] shrink-0" />
          <input
            type="search"
            value={inlineSearch}
            onChange={(e) => setInlineSearch(e.target.value)}
            placeholder="Nombre, categoría..."
            className="flex-1 text-xs font-sans text-[var(--color-charcoal)] bg-transparent focus:outline-none placeholder:text-[var(--color-stone-400)]"
          />
        </div>
      </div>

      {/* Categorías — 3 visible + "Ver más" */}
      <div>
        <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--color-stone-400)] font-sans mb-3">Categorías</p>
        <ul className="space-y-1.5">
          <li>
            <button
              onClick={() => { setFilter("categoria", ""); onClose?.(); }}
              className={`cursor-pointer w-full text-left text-[14px] font-sans tracking-wide transition-colors ${!activeCategory ? "text-[var(--color-charcoal)] font-medium" : "text-[var(--color-stone-400)] hover:text-[var(--color-charcoal)]"}`}
            >Todos</button>
          </li>
          {visibleCats.map((cat) => (
            <li key={cat}>
              <button
                onClick={() => { setFilter("categoria", activeCategory === cat ? "" : cat); onClose?.(); }}
                className={`cursor-pointer w-full text-left text-[14px] font-sans tracking-wide transition-colors flex items-center gap-2 ${activeCategory === cat ? "text-[var(--color-charcoal)] font-medium" : "text-[var(--color-stone-400)] hover:text-[var(--color-charcoal)]"}`}
              >
                {activeCategory === cat && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-gold)] shrink-0" />}
                {cat}
              </button>
            </li>
          ))}
        </ul>
        {availableCategories.length > SHOW_INITIALLY && (
          <button
            onClick={() => setShowAllCats((v) => !v)}
            className="cursor-pointer mt-2 flex items-center gap-1 text-[11px] font-sans text-[var(--color-stone-400)] hover:text-[var(--color-charcoal)] transition-colors"
          >
            <ChevronDown size={13} className={`transition-transform ${showAllCats ? "rotate-180" : ""}`} />
            {showAllCats ? "Ver menos" : `Ver ${availableCategories.length - SHOW_INITIALLY} más`}
          </button>
        )}
      </div>

      {/* Tallas — solo las que tienen productos */}
      <div>
        <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--color-stone-400)] font-sans mb-3">Talla</p>
        <div className="flex flex-wrap gap-2">
          {availableSizes.map((s) => (
            <button
              key={s}
              onClick={() => { setFilter("talla", activeSize === s ? "" : s); onClose?.(); }}
              className={`cursor-pointer w-10 h-10 rounded-md border font-sans text-[12px] tracking-wide transition-all ${activeSize === s ? "border-[var(--color-charcoal)] bg-[var(--color-charcoal)] text-[var(--color-cream)]" : "border-[var(--color-stone-200)] text-[var(--color-stone-600)] hover:border-[var(--color-charcoal)]"}`}
            >{s}</button>
          ))}
        </div>
      </div>

      {/* Colores — solo los que tienen productos */}
      <div>
        <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--color-stone-400)] font-sans mb-3">Color</p>
        <div className="flex flex-wrap gap-2.5">
          {availableColors.map(({ label, hex }) => (
            <button
              key={label}
              title={label}
              onClick={() => { setFilter("color", activeColor === label ? "" : label); onClose?.(); }}
              className="cursor-pointer relative group"
              aria-label={label}
            >
              <span
                className={`flex w-7 h-7 rounded-full border-2 transition-all ${activeColor === label ? "border-[var(--color-gold)] scale-110 shadow-md" : "border-transparent hover:border-[var(--color-stone-300)]"}`}
                style={{ backgroundColor: hex, boxShadow: hex === "#f5f5f0" || hex === "#f0ead6" || hex === "#e8dcc8" ? "inset 0 0 0 1px #e0e0e0" : undefined }}
              />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 bg-[var(--color-charcoal)] text-white text-[9px] font-sans rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Colección — 3 visible + "Ver más" */}
      <div>
        <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--color-stone-400)] font-sans mb-3">Colección</p>
        <ul className="space-y-1.5">
          <li>
            <button
              onClick={() => { setFilter("coleccion", ""); onClose?.(); }}
              className={`cursor-pointer w-full text-left text-[14px] font-sans tracking-wide transition-colors ${!activeCollection ? "text-[var(--color-charcoal)] font-medium" : "text-[var(--color-stone-400)] hover:text-[var(--color-charcoal)]"}`}
            >Todas</button>
          </li>
          {visibleCols.map((col) => (
            <li key={col}>
              <button
                onClick={() => { setFilter("coleccion", activeCollection === col ? "" : col); onClose?.(); }}
                className={`cursor-pointer w-full text-left text-[14px] font-sans tracking-wide transition-colors flex items-center gap-2 ${activeCollection === col ? "text-[var(--color-charcoal)] font-medium" : "text-[var(--color-stone-400)] hover:text-[var(--color-charcoal)]"}`}
              >
                {activeCollection === col && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-gold)] shrink-0" />}
                {col}
              </button>
            </li>
          ))}
        </ul>
        {availableCollections.length > SHOW_INITIALLY && (
          <button
            onClick={() => setShowAllCols((v) => !v)}
            className="cursor-pointer mt-2 flex items-center gap-1 text-[11px] font-sans text-[var(--color-stone-400)] hover:text-[var(--color-charcoal)] transition-colors"
          >
            <ChevronDown size={13} className={`transition-transform ${showAllCols ? "rotate-180" : ""}`} />
            {showAllCols ? "Ver menos" : `Ver ${availableCollections.length - SHOW_INITIALLY} más`}
          </button>
        )}
      </div>

      {hasFilters && (
        <button onClick={clearAll} className="cursor-pointer text-[11px] font-sans text-[var(--color-stone-400)] underline underline-offset-2 hover:text-[var(--color-charcoal)] transition-colors">
          Limpiar filtros
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen pt-20">
      {/* Page header */}
      <div className="max-w-7xl mx-auto px-5 lg:px-10 pt-8 pb-6 flex items-end justify-between border-b border-[var(--color-stone-100)]">
        <div>
          <p className="text-[10px] tracking-[0.35em] uppercase text-[var(--color-stone-400)] font-sans mb-1">Zoa</p>
          <h1 className="font-serif text-3xl md:text-4xl text-[var(--color-charcoal)]">
            {activeCategory || "Todos los productos"}
          </h1>
          <p className="text-xs font-sans text-[var(--color-stone-400)] mt-1">
            {filtered.length} {filtered.length === 1 ? "pieza" : "piezas"}
            {(searchQuery || inlineSearch) && ` para "${searchQuery || inlineSearch}"`}
          </p>
        </div>
        <button
          onClick={() => setSidebarOpen(true)}
          className="cursor-pointer flex items-center gap-2 lg:hidden px-4 py-2.5 border border-[var(--color-stone-200)] rounded-md text-[10px] font-sans tracking-[0.15em] uppercase text-[var(--color-stone-600)]"
        >
          <SlidersHorizontal size={13} />
          Filtrar
          {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold)]" />}
        </button>
      </div>

      {/* Active filter chips */}
      {hasFilters && (
        <div className="max-w-7xl mx-auto px-5 lg:px-10 py-3 flex flex-wrap gap-2">
          {activeCategory && <button onClick={() => setFilter("categoria", "")} className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-charcoal)] text-[var(--color-cream)] text-[10px] font-sans tracking-[0.1em] uppercase">{activeCategory}<X size={10} /></button>}
          {activeCollection && <button onClick={() => setFilter("coleccion", "")} className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-charcoal)] text-[var(--color-cream)] text-[10px] font-sans tracking-[0.1em] uppercase">{activeCollection}<X size={10} /></button>}
          {activeSize && <button onClick={() => setFilter("talla", "")} className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-charcoal)] text-[var(--color-cream)] text-[10px] font-sans tracking-[0.1em] uppercase">Talla {activeSize}<X size={10} /></button>}
          {activeColor && <button onClick={() => setFilter("color", "")} className="flex items-center gap-2 px-3 py-1.5 border border-[var(--color-stone-200)] text-[10px] font-sans tracking-[0.1em] uppercase text-[var(--color-stone-600)]"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.find(c => c.label === activeColor)?.hex ?? "#ccc" }} />{activeColor}<X size={10} /></button>}
          {(searchQuery || inlineSearch) && <button onClick={clearAll} className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-stone-100)] text-[var(--color-charcoal)] text-[10px] font-sans tracking-[0.1em] uppercase">"{searchQuery || inlineSearch}"<X size={10} /></button>}
          <button onClick={clearAll} className="cursor-pointer px-3 py-1.5 text-[10px] font-sans text-[var(--color-stone-400)] underline underline-offset-2">Limpiar todo</button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-5 lg:px-10 pb-20 flex gap-8 lg:gap-10">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-56 shrink-0 pt-8">
          <div className="sticky top-24"><SidebarContent /></div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1 pt-8">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-[var(--color-stone-400)]">
              <p className="font-serif text-2xl">Sin resultados</p>
              <p className="text-xs font-sans tracking-wide">Prueba con otro filtro</p>
              <button onClick={clearAll} className="cursor-pointer mt-2 text-xs font-sans underline underline-offset-2 text-[var(--color-charcoal)]">Ver todo</button>
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-3 gap-y-10">
              <AnimatePresence mode="popLayout">
                {filtered.map((product, idx) => (
                  <motion.div key={`${product.id}-${idx}`} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-[var(--color-charcoal)]/40 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-80 bg-[var(--color-cream)] shadow-xl px-6 py-8 overflow-y-auto lg:hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <p className="font-serif text-lg text-[var(--color-charcoal)]">Filtros</p>
                <button onClick={() => setSidebarOpen(false)}><X size={18} className="text-[var(--color-stone-400)]" /></button>
              </div>
              <SidebarContent onClose={() => setSidebarOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
