"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, X, Search, ChevronDown, LayoutGrid, Rows3, Columns4 } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/ui/Reveal";
import Chip from "@/components/ui/Chip";
import EmptyState from "@/components/ui/EmptyState";
import Overline from "@/components/ui/Overline";
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

const EASE = [0.16, 1, 0.3, 1] as const;

const FILTER_LABEL = "overline";

const FILTER_ROW =
  "group cursor-pointer w-full flex items-center gap-2.5 border-b border-zoa-line py-3 text-left text-[13px] font-sans transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zoa-slate";

// ── Orden client-side (sin params nuevos obligatorios) ──
type SortKey = "recomendado" | "precio-asc" | "precio-desc" | "novedades";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "recomendado", label: "Recomendado" },
  { value: "precio-asc",  label: "Precio ↑" },
  { value: "precio-desc", label: "Precio ↓" },
  { value: "novedades",   label: "Novedades" },
];

// ── Densidad de rejilla en desktop ──
type Density = 2 | 3 | 4;

const GRID_BY_DENSITY: Record<Density, string> = {
  2: "grid-cols-2 md:grid-cols-2 xl:grid-cols-2",
  3: "grid-cols-2 md:grid-cols-3 xl:grid-cols-3",
  4: "grid-cols-2 md:grid-cols-3 xl:grid-cols-4",
};

const GAP = "gap-x-4 md:gap-x-6 gap-y-12 md:gap-y-16";

interface TiendaClientProps { products: Product[]; }

export default function TiendaClient({ products }: TiendaClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [inlineSearch, setInlineSearch] = useState("");
  const [showAllCats, setShowAllCats] = useState(false);
  const [showAllCols, setShowAllCols] = useState(false);
  const [sort, setSort] = useState<SortKey>("recomendado");
  const [density, setDensity] = useState<Density>(4);

  const activeCategory   = searchParams.get("categoria") ?? "";
  const activeCollection = searchParams.get("coleccion") ?? "";
  const searchQuery      = searchParams.get("q") ?? "";
  const activeSize       = searchParams.get("talla") ?? "";
  const activeColor      = searchParams.get("color") ?? "";

  // ── Filtros dinámicos: solo se muestran los que tienen producto ──
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

  // ── Orden client-side puro ──
  const sorted = (() => {
    switch (sort) {
      case "precio-asc":  return [...filtered].sort((a, b) => a.price - b.price);
      case "precio-desc": return [...filtered].sort((a, b) => b.price - a.price);
      case "novedades":   return [...filtered].reverse();
      default:            return filtered;
    }
  })();

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    startTransition(() => router.push(`/tienda?${params.toString()}`));
  };

  const clearAll = () => { setInlineSearch(""); startTransition(() => router.push("/tienda")); };
  const hasFilters = !!activeCategory || !!activeCollection || !!searchQuery || !!activeSize || !!activeColor || !!inlineSearch;

  const activeFilterCount =
    (activeCategory ? 1 : 0) +
    (activeCollection ? 1 : 0) +
    (activeSize ? 1 : 0) +
    (activeColor ? 1 : 0) +
    (searchQuery || inlineSearch ? 1 : 0);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setFiltersOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Bloquea el scroll de fondo mientras el bottom sheet está abierto
  useEffect(() => {
    if (!filtersOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [filtersOpen]);

  const visibleCats = showAllCats ? availableCategories : availableCategories.slice(0, SHOW_INITIALLY);
  const visibleCols = showAllCols ? availableCollections : availableCollections.slice(0, SHOW_INITIALLY);

  const renderSidebar = (onClose?: () => void) => (
    <div className="space-y-9">
      {/* Buscar */}
      <div>
        <p className={`${FILTER_LABEL} mb-4`}>Buscar</p>
        <div className="flex items-center gap-2 border border-zoa-line-strong px-3 py-2 transition-colors focus-within:border-zoa-slate focus-within:ring-2 focus-within:ring-zoa-slate/15">
          <Search size={13} aria-hidden className="shrink-0 text-zoa-slate-60" />
          <input
            type="search"
            value={inlineSearch}
            onChange={(e) => setInlineSearch(e.target.value)}
            placeholder="Nombre, categoría..."
            aria-label="Buscar productos"
            className="min-h-11 flex-1 bg-transparent font-sans text-xs text-zoa-slate placeholder:text-zoa-slate-60 focus:outline-none"
          />
        </div>
      </div>

      {/* Categorías — 3 + "Ver más" */}
      <div>
        <p className={`${FILTER_LABEL} mb-3`}>Categorías</p>
        <ul className="m-0 list-none border-t border-zoa-line p-0">
          <li className="list-none">
            <button
              onClick={() => { setFilter("categoria", ""); onClose?.(); }}
              aria-pressed={!activeCategory}
              className={`${FILTER_ROW} ${!activeCategory ? "font-medium text-zoa-forest" : "text-zoa-slate-60 hover:text-zoa-slate"}`}
            >
              {!activeCategory && <span aria-hidden className="h-3.5 w-0.5 shrink-0 bg-zoa-forest" />}
              Todas
            </button>
          </li>
          {visibleCats.map((cat) => (
            <li key={cat} className="list-none">
              <button
                onClick={() => { setFilter("categoria", activeCategory === cat ? "" : cat); onClose?.(); }}
                aria-pressed={activeCategory === cat}
                className={`${FILTER_ROW} ${activeCategory === cat ? "font-medium text-zoa-forest" : "text-zoa-slate-60 hover:text-zoa-slate"}`}
              >
                {activeCategory === cat && <span aria-hidden className="h-3.5 w-0.5 shrink-0 bg-zoa-forest" />}
                {cat}
              </button>
            </li>
          ))}
        </ul>
        {availableCategories.length > SHOW_INITIALLY && (
          <button
            onClick={() => setShowAllCats((v) => !v)}
            className="link-underline mt-4 flex cursor-pointer items-center gap-1.5 font-sans text-[10px] uppercase tracking-[0.18em] text-zoa-slate-60 transition-colors hover:text-zoa-slate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate"
          >
            <ChevronDown size={12} aria-hidden className={`transition-transform duration-300 ${showAllCats ? "rotate-180" : ""}`} />
            {showAllCats ? "Ver menos" : `Ver ${availableCategories.length - SHOW_INITIALLY} más`}
          </button>
        )}
      </div>

      {/* Tallas */}
      <div>
        <p className={`${FILTER_LABEL} mb-4`}>Talla</p>
        <div className="flex flex-wrap gap-2">
          {availableSizes.map((s) => (
            <button
              key={s}
              onClick={() => { setFilter("talla", activeSize === s ? "" : s); onClose?.(); }}
              aria-pressed={activeSize === s}
              className={`h-11 w-11 cursor-pointer rounded-xs border font-sans text-[12px] tracking-wide transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate focus-visible:ring-offset-1 ${
                activeSize === s
                  ? "border-zoa-forest bg-zoa-forest text-zoa-surface"
                  : "border-zoa-line-strong text-zoa-slate hover:border-zoa-slate"
              }`}
            >{s}</button>
          ))}
        </div>
      </div>

      {/* Colores */}
      <div>
        <p className={`${FILTER_LABEL} mb-4`}>Color</p>
        <div className="flex flex-wrap gap-2.5">
          {availableColors.map(({ label, hex }) => (
            <button
              key={label}
              title={label}
              onClick={() => { setFilter("color", activeColor === label ? "" : label); onClose?.(); }}
              className="group relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate focus-visible:ring-offset-1"
              aria-label={label}
              aria-pressed={activeColor === label}
            >
              <span
                className={`flex h-7 w-7 rounded-full border-2 transition-all duration-200 ${activeColor === label ? "scale-110 border-zoa-slate" : "border-transparent hover:border-zoa-line-strong"}`}
                style={{ backgroundColor: hex, boxShadow: hex === "#f5f5f0" || hex === "#f0ead6" || hex === "#e8dcc8" ? "inset 0 0 0 1px rgba(43,60,66,0.18)" : undefined }}
              />
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap bg-zoa-slate px-2 py-1 font-sans text-[9px] uppercase tracking-[0.12em] text-zoa-sand opacity-0 transition-opacity group-hover:opacity-100">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Colección */}
      <div>
        <p className={`${FILTER_LABEL} mb-3`}>Colección</p>
        <ul className="m-0 list-none border-t border-zoa-line p-0">
          <li className="list-none">
            <button
              onClick={() => { setFilter("coleccion", ""); onClose?.(); }}
              aria-pressed={!activeCollection}
              className={`${FILTER_ROW} ${!activeCollection ? "font-medium text-zoa-forest" : "text-zoa-slate-60 hover:text-zoa-slate"}`}
            >
              {!activeCollection && <span aria-hidden className="h-3.5 w-0.5 shrink-0 bg-zoa-forest" />}
              Todas
            </button>
          </li>
          {visibleCols.map((col) => (
            <li key={col} className="list-none">
              <button
                onClick={() => { setFilter("coleccion", activeCollection === col ? "" : col); onClose?.(); }}
                aria-pressed={activeCollection === col}
                className={`${FILTER_ROW} ${activeCollection === col ? "font-medium text-zoa-forest" : "text-zoa-slate-60 hover:text-zoa-slate"}`}
              >
                {activeCollection === col && <span aria-hidden className="h-3.5 w-0.5 shrink-0 bg-zoa-forest" />}
                {col}
              </button>
            </li>
          ))}
        </ul>
        {availableCollections.length > SHOW_INITIALLY && (
          <button
            onClick={() => setShowAllCols((v) => !v)}
            className="link-underline mt-4 flex cursor-pointer items-center gap-1.5 font-sans text-[10px] uppercase tracking-[0.18em] text-zoa-slate-60 transition-colors hover:text-zoa-slate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate"
          >
            <ChevronDown size={12} aria-hidden className={`transition-transform duration-300 ${showAllCols ? "rotate-180" : ""}`} />
            {showAllCols ? "Ver menos" : `Ver ${availableCollections.length - SHOW_INITIALLY} más`}
          </button>
        )}
      </div>

      {hasFilters && (
        <button
          onClick={clearAll}
          className="link-underline cursor-pointer font-sans text-[10px] uppercase tracking-[0.18em] text-zoa-slate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen pt-28 md:pt-32">
      {/* ── Header editorial ── */}
      <div className="container-zoa">
        {/* Breadcrumb hairline */}
        <nav aria-label="Breadcrumb" className="hairline-b flex items-center gap-2 pb-4 pt-6">
          <Link
            href="/"
            className="link-underline cursor-pointer font-sans text-[10px] uppercase tracking-[0.18em] text-zoa-slate-60 transition-colors hover:text-zoa-slate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate"
          >
            Inicio
          </Link>
          <span aria-hidden className="font-sans text-[10px] text-zoa-slate-60">/</span>
          <span className="font-sans text-[10px] uppercase tracking-[0.18em] text-zoa-slate">Tienda</span>
        </nav>

        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-6 pt-8 pb-6">
          <div className="min-w-0">
            <Overline>{activeCategory || "Catálogo completo"}</Overline>
            <h1 className="mt-4 text-balance font-display text-[clamp(2.25rem,5.5vw,4.75rem)] font-normal leading-[0.98] tracking-[-0.02em] text-zoa-slate">
              {activeCategory || "Todos los productos"}
            </h1>
            <p className="mt-4 font-sans text-[13px] text-zoa-slate-60 tabular">
              <span className="text-zoa-forest">{sorted.length}</span>{" "}
              {sorted.length === 1 ? "pieza" : "piezas"}
              {(searchQuery || inlineSearch) && ` para "${searchQuery || inlineSearch}"`}
            </p>
          </div>

          {/* Controles: orden + densidad + filtros móvil */}
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label htmlFor="orden" className="mb-2 block font-sans text-[10px] font-medium uppercase tracking-[0.25em] text-zoa-slate-60">
                Ordenar
              </label>
              <div className="relative">
                <select
                  id="orden"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="min-h-11 cursor-pointer appearance-none border border-zoa-line-strong bg-transparent py-2 pl-4 pr-10 font-sans text-[11px] uppercase tracking-[0.14em] text-zoa-slate transition-colors duration-200 hover:border-zoa-slate focus:border-zoa-forest focus:outline-none focus:ring-2 focus:ring-zoa-forest/15"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown size={13} aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zoa-slate-60" />
              </div>
            </div>

            {/* Densidad (desktop) */}
            <div className="hidden lg:block">
              <p className="mb-2 font-sans text-[10px] font-medium uppercase tracking-[0.25em] text-zoa-slate-60">
                Rejilla
              </p>
              <div className="flex border border-zoa-line-strong">
                {([
                  { d: 2 as Density, icon: Rows3, label: "2 columnas" },
                  { d: 3 as Density, icon: LayoutGrid, label: "3 columnas" },
                  { d: 4 as Density, icon: Columns4, label: "4 columnas" },
                ]).map(({ d, icon: Icon, label }) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDensity(d)}
                    aria-pressed={density === d}
                    aria-label={label}
                    className={`flex h-11 w-11 cursor-pointer items-center justify-center transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zoa-slate ${
                      density === d ? "bg-zoa-slate text-zoa-sand" : "text-zoa-slate-60 hover:text-zoa-slate"
                    }`}
                  >
                    <Icon size={15} strokeWidth={1.4} aria-hidden />
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setFiltersOpen(true)}
              className="flex min-h-11 cursor-pointer items-center gap-2 border border-zoa-forest-35 px-5 font-sans text-[10px] uppercase tracking-[0.16em] text-zoa-forest transition-colors duration-200 hover:bg-zoa-forest/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-forest lg:hidden"
            >
              <SlidersHorizontal size={13} aria-hidden />
              Filtrar
              {activeFilterCount > 0 && (
                <span aria-hidden className="flex h-4 min-w-4 items-center justify-center bg-zoa-forest px-1 font-sans text-[9px] leading-none text-zoa-surface tabular">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Chips de filtros activos ── */}
      {hasFilters && (
        <div className="container-zoa flex flex-wrap items-center gap-2 py-4">
          {activeCategory && <Chip variant="forest" onRemove={() => setFilter("categoria", "")}>{activeCategory}</Chip>}
          {activeCollection && <Chip variant="forest" onRemove={() => setFilter("coleccion", "")}>{activeCollection}</Chip>}
          {activeSize && <Chip variant="forest" onRemove={() => setFilter("talla", "")}>Talla {activeSize}</Chip>}
          {activeColor && (
            <Chip
              variant="forest"
              onRemove={() => setFilter("color", "")}
              leading={
                <span
                  aria-hidden
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: COLORS.find(c => c.label === activeColor)?.hex ?? "#ccc" }}
                />
              }
            >
              {activeColor}
            </Chip>
          )}
          {(searchQuery || inlineSearch) && (
            <Chip variant="forest" onRemove={clearAll}>
              &quot;{searchQuery || inlineSearch}&quot;
            </Chip>
          )}
          <button
            onClick={clearAll}
            className="link-underline ml-1 cursor-pointer px-1 font-sans text-[10px] uppercase tracking-[0.16em] text-zoa-slate-60 transition-colors hover:text-zoa-slate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate"
          >
            Limpiar todo
          </button>
        </div>
      )}

      <div className="container-zoa flex gap-8 pb-24 pt-4 lg:gap-12">
        {/* Sidebar escritorio */}
        <aside className="hidden w-56 shrink-0 pt-6 lg:block">
          <div className="sticky top-28 max-h-[calc(100vh-9rem)] overflow-y-auto pr-1">
            {renderSidebar()}
          </div>
        </aside>

        {/* Rejilla de producto */}
        <div className="min-w-0 flex-1 pt-6">
          {sorted.length === 0 ? (
            <EmptyState
              overline="Sin resultados"
              title="No encontramos piezas con esos filtros"
              description="Prueba con otro filtro o limpia la búsqueda para ver el catálogo completo."
              action={{ label: "Ver todo", onClick: clearAll }}
            />
          ) : (
            <motion.div layout className={`grid ${GRID_BY_DENSITY[density]} ${GAP}`}>
              <AnimatePresence mode="popLayout">
                {sorted.map((product, idx) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: EASE }}
                  >
                    <Reveal offset={idx % 8} y={24}>
                      <ProductCard product={product} index={idx + 1} priority={idx < 4} />
                    </Reveal>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Bottom sheet de filtros (móvil) ── */}
      <AnimatePresence>
        {filtersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="fixed inset-0 z-50 bg-zoa-slate/40 backdrop-blur-sm lg:hidden"
              onClick={() => setFiltersOpen(false)}
              aria-hidden
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Filtros"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ duration: 0.32, ease: EASE }}
              className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88svh] flex-col border-t border-zoa-line bg-zoa-sand lg:hidden"
            >
              {/* Drag handle hairline */}
              <div className="flex flex-none flex-col items-center pt-3">
                <span aria-hidden className="h-px w-12 bg-zoa-forest" />
              </div>

              <div className="flex flex-none items-center justify-between px-5 py-4">
                <p className="font-display text-xl leading-none text-zoa-slate">Filtros</p>
                <button
                  onClick={() => setFiltersOpen(false)}
                  aria-label="Cerrar filtros"
                  className="flex h-11 w-11 cursor-pointer items-center justify-center text-zoa-slate-60 transition-colors hover:text-zoa-slate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate"
                >
                  <X size={18} aria-hidden />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-6">
                {renderSidebar()}
              </div>

              {/* Bloque sticky de confirmación */}
              <div className="hairline-t flex flex-none items-center gap-3 bg-zoa-sand px-5 py-4">
                <button
                  onClick={() => setFiltersOpen(false)}
                  className="flex min-h-12 flex-1 cursor-pointer items-center justify-center gap-2 bg-zoa-forest px-6 font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-zoa-surface transition-colors duration-200 hover:bg-zoa-forest-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:translate-y-px"
                >
                  Ver {sorted.length} {sorted.length === 1 ? "pieza" : "piezas"}
                </button>
                {hasFilters && (
                  <button
                    onClick={clearAll}
                    className="min-h-12 shrink-0 cursor-pointer border border-zoa-line-strong px-5 font-sans text-[10px] uppercase tracking-[0.16em] text-zoa-slate transition-colors duration-200 hover:bg-zoa-slate/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
