"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";
import Image from "next/image";

interface ProductSearchProps {
  products: Product[];
  onClose?: () => void;
  variant?: "hero" | "navbar" | "inline";
  placeholder?: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(n);

export default function ProductSearch({
  products,
  onClose,
  variant = "inline",
  placeholder = "Buscar productos...",
}: ProductSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Auto-focus on mount for hero/navbar variants
  useEffect(() => {
    if (variant !== "inline") inputRef.current?.focus();
  }, [variant]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = useCallback(
    (q: string) => {
      setQuery(q);
      if (q.trim().length < 2) {
        setResults([]);
        setOpen(false);
        return;
      }
      const lower = q.toLowerCase();
      const filtered = products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(lower) ||
            p.category.toLowerCase().includes(lower) ||
            p.collection.toLowerCase().includes(lower) ||
            (p.sku ?? "").toLowerCase().includes(lower) ||
            (p.skus ?? []).some((s) => s.toLowerCase().includes(lower))
        )
        .slice(0, 6);
      setResults(filtered);
      setOpen(true);
    },
    [products]
  );

  const handleSelect = (product: Product) => {
    setOpen(false);
    setQuery("");
    onClose?.();
    router.push(`/product/${product.id}`);
  };

  const handleViewAll = () => {
    setOpen(false);
    setQuery("");
    onClose?.();
    router.push(`/tienda?q=${encodeURIComponent(query)}`);
  };

  const inputBase = "w-full bg-transparent font-sans text-sm text-[var(--color-charcoal)] placeholder:text-[var(--color-stone-400)] focus:outline-none";

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className={`flex items-center gap-2 border transition-colors ${
          variant === "hero"
            ? "border-white/30 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl"
            : "border-[var(--color-stone-200)] bg-white px-3 py-2.5 rounded-lg"
        }`}
      >
        <Search
          size={15}
          className={variant === "hero" ? "text-white/60 shrink-0" : "text-[var(--color-stone-400)] shrink-0"}
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={placeholder}
          className={`${inputBase} ${variant === "hero" ? "text-white placeholder:text-white/60" : ""}`}
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(""); setResults([]); setOpen(false); }}
            className="shrink-0 text-[var(--color-stone-400)] hover:text-[var(--color-charcoal)] transition-colors"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-[var(--color-stone-200)] rounded-xl shadow-2xl overflow-hidden">
          {results.length === 0 ? (
            <p className="px-4 py-4 text-sm font-sans text-[var(--color-stone-400)] text-center">
              Sin resultados para &ldquo;{query}&rdquo;
            </p>
          ) : (
            <>
              <ul>
                {results.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(p)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-stone-100)] transition-colors border-b border-[var(--color-stone-100)] last:border-0 text-left"
                    >
                      {p.images[0] && (
                        <div className="relative w-10 h-12 shrink-0 rounded overflow-hidden bg-[var(--color-stone-100)]">
                          <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="40px" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-sans text-[13px] text-[var(--color-charcoal)] leading-snug truncate">
                          {p.name}
                        </p>
                        <p className="text-[11px] text-[var(--color-stone-400)] mt-0.5">
                          {p.category}
                        </p>
                      </div>
                      <p className="font-sans text-sm text-[var(--color-charcoal)] shrink-0">
                        {fmt(p.price)}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={handleViewAll}
                className="w-full px-4 py-3 text-[11px] font-sans tracking-[0.15em] uppercase text-[var(--color-gold)] hover:bg-[var(--color-stone-100)] transition-colors text-center border-t border-[var(--color-stone-100)]"
              >
                Ver todos los resultados →
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
