"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Product, Size } from "@/lib/types";

interface ProductCardProps {
  product: Product;
  /** Micro-índice editorial en la esquina de la imagen (01, 02…). */
  index?: number;
  /** Precarga la imagen principal (primeras piezas del grid/carrusel). */
  priority?: boolean;
  /** Sobrescribe el `sizes` por defecto. */
  sizes?: string;
}

const SIZE_ORDER: Size[] = ["XS", "S", "M", "L", "LOV", "XL"];

export default function ProductCard({
  product,
  index,
  priority = false,
  sizes = "(max-width: 768px) 50vw, 25vw",
}: ProductCardProps) {
  const [activeVariant, setActiveVariant] = useState(0);

  const variants = product.variants ?? [];
  const activeProduct = variants.length > 0
    ? { ...product, images: [variants[activeVariant]?.image ?? product.images[0], ...product.images.slice(1)] }
    : product;

  const primaryImage = activeProduct.images[0] ?? "/placeholder.jpg";
  const hoverImage = activeProduct.images[1] ?? activeProduct.images[0] ?? "/placeholder.jpg";
  const hasHoverImage = activeProduct.images.length > 1;

  const totalStock = Object.values(product.stock ?? {}).reduce((a, b) => a + (b ?? 0), 0);
  const isAgotado = totalStock === 0;
  const lowStock = !isAgotado && totalStock <= 5;

  const formattedPrice = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(product.price);

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  const formattedOriginal =
    product.originalPrice && discount
      ? new Intl.NumberFormat("es-MX", {
          style: "currency",
          currency: "MXN",
          minimumFractionDigits: 0,
        }).format(product.originalPrice)
      : null;

  // Leyenda de urgencia (vino, Bodoni italic): descuento y/o stock bajo
  const wineLegend = discount
    ? `−${discount}% · Precios especiales${lowStock ? " · Últimas tallas" : ""}`
    : lowStock
      ? "Últimas tallas"
      : null;

  // Badge editorial: AGOTADO tiene prioridad; NUEVO para temporada vigente sin descuento
  const isNuevo = !isAgotado && !discount && (product.collection ?? "").toLowerCase().includes("primavera");
  const badge = isAgotado ? "Agotado" : isNuevo ? "Nuevo" : null;

  const href = variants.length > 0
    ? `/product/${encodeURIComponent(variants[activeVariant]?.id ?? product.id)}`
    : `/product/${encodeURIComponent(product.id)}`;

  const microIndex = typeof index === "number" ? String(index).padStart(2, "0") : null;

  return (
    <div className="product-card-root block">
      {/* Imagen — flota sobre la arena, sin tarjeta. Placeholder de carga #FFF7F5 */}
      <Link
        href={href}
        className="group block cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate focus-visible:ring-offset-2 focus-visible:ring-offset-zoa-sand"
      >
        <div className="product-card-img-wrap relative aspect-[3/4] overflow-hidden bg-zoa-surface">
          {/* Hairline interior sutil */}
          <span aria-hidden className="pointer-events-none absolute inset-0 z-10 border border-zoa-line" />

          {/* Imagen principal */}
          <div className="product-card-primary absolute inset-0 transition-opacity duration-500">
            <Image
              src={primaryImage}
              alt={product.name}
              fill
              sizes={sizes}
              priority={priority}
              className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
            />
          </div>

          {/* Segunda imagen en hover — solo apuntador fino (CSS) */}
          {hasHoverImage && (
            <div className="product-card-hover absolute inset-0 transition-opacity duration-500">
              <Image
                src={hoverImage}
                alt={`${product.name} — vista 2`}
                fill
                sizes={sizes}
                className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
              />
            </div>
          )}

          {/* Micro-índice editorial */}
          {microIndex && (
            <span
              aria-hidden
              className="absolute right-3 top-3 z-20 font-sans text-[10px] tracking-[0.2em] text-zoa-slate-60 tabular"
            >
              {microIndex}
            </span>
          )}

          {/* Badge AGOTADO (slate) / NUEVO (forest) — hairline, sin relleno */}
          {badge && (
            <span
              className={`absolute left-3 top-3 z-20 border px-2.5 py-1 font-sans text-[9px] uppercase tracking-[0.2em] ${
                isAgotado
                  ? "border-zoa-line-strong text-zoa-slate"
                  : "border-zoa-forest-35 text-zoa-forest"
              }`}
            >
              {badge}
            </span>
          )}

          {/* Marquesina "VER PRODUCTO" — solo CSS hover */}
          <div className="product-card-cta pointer-events-none absolute inset-x-0 bottom-0 z-20 translate-y-full border-t border-zoa-line bg-[rgba(234,233,229,0.94)] py-3 text-center transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0">
            <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-zoa-forest">
              Ver producto
            </span>
          </div>
        </div>
      </Link>

      {/* Info — todo Archivo, slate */}
      <div className="mt-3.5 space-y-1.5 px-0.5">
        <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-zoa-slate-60">
          {product.category}
        </p>

        <Link href={href} className="inline-block cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate">
          <h3 className="relative font-sans text-[15px] font-normal leading-snug text-zoa-slate after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-zoa-slate after:transition-transform after:duration-300 after:ease-[cubic-bezier(0.16,1,0.3,1)] hover:after:scale-x-100">
            {product.name}
          </h3>
        </Link>

        <div className="flex flex-wrap items-baseline gap-2">
          <p className="font-sans text-[15px] font-medium tracking-[0.01em] text-zoa-slate tabular">
            {formattedPrice}
          </p>
          {formattedOriginal && (
            <p className="font-sans text-[13px] tracking-[0.01em] text-zoa-slate-60 line-through tabular">
              {formattedOriginal}
            </p>
          )}
        </div>

        {/* Leyenda vino cursiva (Bodoni italic) */}
        {wineLegend && (
          <p className="font-display text-[13px] italic text-zoa-wine">
            {wineLegend}
          </p>
        )}

        {product.collection && (
          <p className="font-sans text-[10px] uppercase tracking-[0.15em] text-zoa-slate-60">
            {product.collection}
          </p>
        )}

        {/* Micro-fila de tallas — aparece al hover (solo pointer fino), no interactiva */}
        <div aria-hidden className="product-card-sizes pt-1.5">
          <div className="hairline-t flex items-center gap-2 pt-2">
            {SIZE_ORDER.map((size) => {
              const available = ((product.stock ?? {}) as Record<string, number>)[size] > 0;
              return (
                <span
                  key={size}
                  className={`font-sans text-[9px] uppercase tracking-[0.14em] ${
                    available ? "text-zoa-forest" : "text-zoa-slate-60 line-through opacity-40"
                  }`}
                >
                  {size}
                </span>
              );
            })}
          </div>
        </div>

        {/* Swatches de color — círculos (excepción semántica permitida) */}
        {variants.length > 1 && (
          <div className="flex gap-1.5 pt-1.5">
            {variants.map((v, i) => (
              <button
                key={v.id}
                onClick={(e) => { e.preventDefault(); setActiveVariant(i); }}
                title={v.color}
                aria-label={v.color}
                aria-pressed={activeVariant === i}
                className="relative shrink-0 cursor-pointer rounded-full transition-transform duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate focus-visible:ring-offset-1"
                style={{
                  backgroundColor: v.hex,
                  width: "1rem",
                  height: "1rem",
                  borderRadius: "50%",
                  border: "none",
                  padding: 0,
                  display: "block",
                }}
              >
                {activeVariant === i && (
                  <span style={{
                    position: "absolute", inset: "-3px",
                    borderRadius: "50%",
                    border: "1.5px solid var(--color-zoa-slate)",
                    pointerEvents: "none",
                  }} />
                )}
                <span style={{
                  position: "absolute", inset: 0,
                  borderRadius: "50%",
                  border: "1px solid rgba(43,60,66,0.25)",
                  pointerEvents: "none",
                }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
