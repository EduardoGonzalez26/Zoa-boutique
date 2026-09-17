"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X, ArrowRight } from "lucide-react";
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

  const isHero = variant === "hero";

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className={`flex items-center gap-2 border transition-colors duration-200 ${
          isHero
            ? "border-zoa-surface/50 bg-zoa-surface/10 px-4 py-3 backdrop-blur-sm focus-within:border-zoa-surface"
            : "border-zoa-line-strong px-3 py-2.5 focus-within:border-zoa-slate focus-within:ring-2 focus-within:ring-zoa-slate/15"
        }`}
      >
        <Search
          size={15}
          aria-hidden
          className={isHero ? "shrink-0 text-zoa-surface/70" : "shrink-0 text-zoa-slate-60"}
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={placeholder}
          aria-label="Buscar productos"
          className={`w-full bg-transparent font-sans text-sm focus:outline-none ${
            isHero
              ? "text-zoa-surface placeholder:text-zoa-surface/60"
              : "text-zoa-slate placeholder:text-zoa-slate-60"
          }`}
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(""); setResults([]); setOpen(false); }}
            aria-label="Limpiar búsqueda"
            className={`shrink-0 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 ${
              isHero
                ? "text-zoa-surface/70 hover:text-zoa-surface focus-visible:ring-zoa-surface"
                : "text-zoa-slate-60 hover:text-zoa-slate focus-visible:ring-zoa-slate"
            }`}
          >
            <X size={13} aria-hidden />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden border border-zoa-line bg-zoa-surface">
          {results.length === 0 ? (
            <p className="px-4 py-4 text-center font-sans text-sm text-zoa-slate-60">
              Sin resultados para &ldquo;{query}&rdquo;
            </p>
          ) : (
            <>
              <ul className="m-0 list-none p-0">
                {results.map((p) => (
                  <li key={p.id} className="list-none">
                    <button
                      type="button"
                      onClick={() => handleSelect(p)}
                      className="flex w-full cursor-pointer items-center gap-3 border-b border-zoa-line px-4 py-3 text-left transition-colors last:border-0 hover:bg-zoa-slate/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zoa-slate"
                    >
                      {p.images[0] && (
                        <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-xs bg-zoa-surface">
                          <Image src={p.images[0]} alt="" fill className="object-cover" sizes="40px" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-sans text-[13px] font-normal leading-snug text-zoa-slate">
                          {p.name}
                        </p>
                        <p className="mt-0.5 font-sans text-[11px] text-zoa-slate-60">
                          {p.category}
                        </p>
                      </div>
                      <p className="shrink-0 font-sans text-sm font-medium text-zoa-slate tabular-nums">
                        {fmt(p.price)}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={handleViewAll}
                className="group flex w-full cursor-pointer items-center justify-center gap-2 border-t border-zoa-line px-4 py-3 font-sans text-[10px] uppercase tracking-[0.18em] text-zoa-slate transition-colors hover:bg-zoa-slate/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zoa-slate"
              >
                Ver todos los resultados
                <ArrowRight size={13} aria-hidden className="transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
