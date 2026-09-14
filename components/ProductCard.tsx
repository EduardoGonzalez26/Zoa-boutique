"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
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

  const href = variants.length > 0
    ? `/product/${encodeURIComponent(variants[activeVariant]?.id ?? product.id)}`
    : `/product/${encodeURIComponent(product.id)}`;


  return (
    <div className="product-card-root block">
      {/* Image — wrapped in Link. Touch devices: direct navigation. Mouse: hover effects via CSS. */}
      <Link href={href} className="block cursor-pointer">
        <div className="relative aspect-[3/4] overflow-hidden bg-[var(--color-stone-100)] rounded-lg product-card-img-wrap">
          {/* Primary Image */}
          <div className="absolute inset-0 transition-opacity duration-500 product-card-primary">
            <Image
              src={primaryImage}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover"
            />
          </div>

          {/* Hover Image — only swaps on real pointer/hover device via CSS */}
          {hasHoverImage && (
            <div className="absolute inset-0 transition-opacity duration-500 product-card-hover">
              <Image
                src={hoverImage}
                alt={`${product.name} — vista 2`}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover"
              />
            </div>
          )}

          {/* AGOTADO overlay */}
          {isAgotado && (
            <>
              <div className="absolute inset-0 bg-white/50 z-10" />
              <span className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-md font-sans text-[9px] font-bold tracking-[0.2em] uppercase"
                style={{ backgroundColor: "#1c1c1c", color: "#ffffff" }}>
                Agotado
              </span>
            </>
          )}

          {/* Discount Badge — bottom right */}
          {discount && !isAgotado && (
            <span className="absolute bottom-3 right-3 z-10 px-2.5 py-1 rounded-md shadow-md font-sans text-[10px] font-semibold tracking-wider"
              style={{ backgroundColor: "#6B1B2E", color: "#FF8080" }}>
              {discount}% OFF
            </span>
          )}

          {/* CTA Overlay — pointer-events-none, CSS hover only (no JS state) */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 product-card-cta transition-opacity duration-300 z-20 pointer-events-none">
            <span className="px-6 py-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-sans tracking-[0.25em] uppercase rounded-md shadow-lg border border-white/20">
              VER PRODUCTO
            </span>
          </div>
        </div>
      </Link>

      {/* Info */}
      <div className="mt-3 space-y-1 px-1">
        <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--color-stone-400)] font-sans">
          {product.category}
        </p>
        <Link href={href}>
          <h3 className="font-serif text-base text-[var(--color-charcoal)] leading-snug hover:text-[var(--color-gold)] transition-colors duration-300">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-sans text-[15px] text-[var(--color-stone-600)] tracking-wide">
            {formattedPrice}
          </p>
          {formattedOriginal && (
            <p className="font-sans text-[13px] text-[var(--color-stone-400)] line-through tracking-wide">
              {formattedOriginal}
            </p>
          )}
        </div>

        {product.collection && (
          <p className="text-[9px] tracking-[0.15em] uppercase text-[var(--color-stone-400)] font-sans">
            {product.collection}
          </p>
        )}

        {/* Color Variant Swatches */}
        {variants.length > 1 && (
          <div className="flex gap-1.5 pt-1">
            {variants.map((v, i) => (
              <button
                key={v.id}
                onClick={(e) => { e.preventDefault(); setActiveVariant(i); }}
                title={v.color}
                aria-label={v.color}
                className="relative shrink-0 transition-transform duration-150 hover:scale-110 focus:outline-none cursor-pointer"
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
                    border: "1.5px solid var(--color-charcoal)",
                    pointerEvents: "none",
                  }} />
                )}
                <span style={{
                  position: "absolute", inset: 0,
                  borderRadius: "50%",
                  border: "1px solid rgba(0,0,0,0.12)",
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
