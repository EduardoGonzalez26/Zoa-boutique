"use client";

import Link from "next/link";
import { ShoppingBag, Menu, X, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useCartStore } from "@/store/cartStore";
import { useRouter, usePathname } from "next/navigation";

const CATEGORIES = [
  "Blusas","Sweaters","Sacos","Chamarras",
  "Pantalones","Vestidos","Faldas","Chalecos","Mallones",
];

const COLLECTIONS = [
  { label: "Primavera / Verano", slug: "Primavera / Verano" },
  { label: "Otoño / Invierno",   slug: "Otoño / Invierno"  },
  { label: "Esenciales",         slug: "Esenciales"         },
  { label: "Outlet",             slug: "Outlet"             },
  { label: "Recomendados",       slug: "Recomendados"       },
];

const MARQUEE_TEXT = "ENVÍOS A TODO MÉXICO · ";
const MARQUEE_FULL = MARQUEE_TEXT.repeat(10);

const LINK_STYLE = {
  fontFamily: "var(--font-inter), sans-serif",
  fontSize: "9.5px",
  letterSpacing: "0.2em",
  textTransform: "uppercase" as const,
};

// --nc is set by CSS based on data-home / data-scrolled attributes
// This avoids any JS-driven flash: the color is always correct even before hydration
const NAV_COLOR = "var(--nc)";

export default function Navbar() {
  const { itemCount, openCart } = useCartStore();
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);
  const [scrolled, setScrolled]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 100);
  }, [searchOpen]);

  const count = isMounted ? itemCount() : 0;
  const pathname = usePathname();
  const isHome = pathname === "/" || pathname === "";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/tienda?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setSearchOpen(false);
      setMobileOpen(false);
    }
  };

  return (
    <>
      <header
        data-home={isHome ? "true" : "false"}
        data-scrolled={scrolled ? "true" : "false"}
        className={`zoa-navbar fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-[var(--color-cream)]/95 backdrop-blur-md shadow-sm border-b border-[var(--color-stone-100)]"
            : "bg-transparent"
        }`}
        style={{ '--nc': isHome && !scrolled ? '#ffffff' : 'var(--color-charcoal)' } as React.CSSProperties}
      >
        <div className="h-14 md:h-16 max-w-7xl mx-auto flex items-center px-4 md:px-8 lg:px-12">

          {/* ── Logo ── */}
          <div className="flex-none">
            <Link href="/" className="cursor-pointer" style={{
              fontFamily: "var(--font-marcellus), 'Palatino', serif",
              fontSize: "clamp(17px, 2vw, 23px)",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: NAV_COLOR,
              fontWeight: 700,
              lineHeight: 1,
              transition: "color 0.4s",
            }}>
              Zoa<sup style={{fontSize:"0.42em",verticalAlign:"super",opacity:0.6,letterSpacing:0}}>®</sup>
            </Link>
          </div>

          {/* ── Centre ── */}
          <div className="flex-1 min-w-0 flex items-center justify-center px-2 md:px-6">

            {/* Mobile marquee (hidden when search open) */}
            {!searchOpen && (
              <div className="md:hidden overflow-hidden w-full" aria-hidden="true"
                style={{ maskImage: "linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)" }}>
                <motion.span className="inline-block whitespace-nowrap"
                  style={{ ...LINK_STYLE, color: NAV_COLOR, opacity: 0.55 }}
                  animate={{ x: ["0%", "-50%"] }}
                  transition={{ duration: 18, ease: "linear", repeat: Infinity }}>
                  {MARQUEE_FULL}{MARQUEE_FULL}
                </motion.span>
              </div>
            )}

            {/* Mobile search bar */}
            {searchOpen && (
              <motion.form
                initial={{ opacity: 0, scaleX: 0.8 }}
                animate={{ opacity: 1, scaleX: 1 }}
                className="md:hidden w-full flex items-center gap-2 border border-[var(--color-stone-300)] rounded-lg px-3 py-1.5 bg-white/90"
                onSubmit={handleSearch}
              >
                <Search size={13} className="text-[var(--color-stone-400)] shrink-0" />
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar"
                  className="flex-1 text-xs font-sans text-[var(--color-charcoal)] bg-transparent focus:outline-none placeholder:text-[var(--color-stone-400)]"
                />
                <button type="button" onClick={() => { setSearchOpen(false); setSearchQuery(""); }}>
                  <X size={13} className="text-[var(--color-stone-400)]" />
                </button>
              </motion.form>
            )}

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-6 lg:gap-8">

              {/* Marquee */}
              <div className="hidden xl:block overflow-hidden w-64 lg:w-80" aria-hidden="true"
                style={{ maskImage: "linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%)" }}>
                <motion.span className="inline-block whitespace-nowrap"
                  style={{ ...LINK_STYLE, color: NAV_COLOR, opacity: 0.45, transition: "color 0.4s" }}
                  animate={{ x: ["0%", "-50%"] }}
                  transition={{ duration: 24, ease: "linear", repeat: Infinity }}>
                  {MARQUEE_FULL}{MARQUEE_FULL}
                </motion.span>
              </div>

              {/* Inicio */}
              <li className="relative group cursor-pointer py-4 list-none">
                <Link href="/" className="flex items-center gap-1 whitespace-nowrap"
                  style={{ ...LINK_STYLE, color: NAV_COLOR, transition: "color 0.4s" }}>
                  Inicio
                </Link>
                <span className="absolute bottom-3 left-0 w-0 h-px bg-[var(--color-gold)] group-hover:w-full transition-all duration-300" />
              </li>

              {/* ── Colecciones dropdown ─────────────────────────────── */}
              <li className="relative group cursor-pointer py-4 list-none">
                <span className="flex items-center gap-1" style={{ ...LINK_STYLE, color: NAV_COLOR, transition: "color 0.4s" }}>
                  Colecciones ▾
                </span>
                <ul className="absolute top-full left-0 hidden group-hover:flex flex-col bg-white text-black min-w-[200px] shadow-lg rounded-md p-2 z-50 list-none m-0">
                  {COLLECTIONS.map((c) => (
                    <li key={c.slug} className="p-2 hover:bg-gray-100 list-none">
                      <Link href={`/tienda?coleccion=${encodeURIComponent(c.slug)}`}>{c.label}</Link>
                    </li>
                  ))}
                </ul>
              </li>

              {/* ── Categorías dropdown ──────────────────────────────── */}
              <li className="relative group cursor-pointer py-4 list-none">
                <span className="flex items-center gap-1" style={{ ...LINK_STYLE, color: NAV_COLOR, transition: "color 0.4s" }}>
                  Categorías ▾
                </span>
                <ul className="absolute top-full left-0 hidden group-hover:flex flex-col bg-white text-black min-w-[200px] shadow-lg rounded-md p-2 z-50 list-none m-0">
                  <li className="p-2 hover:bg-gray-100 list-none"><Link href="/tienda">Ver todo</Link></li>
                  {CATEGORIES.map((cat) => (
                    <li key={cat} className="p-2 hover:bg-gray-100 list-none">
                      <Link href={`/tienda?categoria=${encodeURIComponent(cat)}`}>{cat}</Link>
                    </li>
                  ))}
                </ul>
              </li>

              {/* Blog */}
              <li className="relative group cursor-pointer py-4 list-none">
                <Link href="/blog" className="flex items-center gap-1 whitespace-nowrap"
                  style={{ ...LINK_STYLE, color: NAV_COLOR, transition: "color 0.4s" }}>
                  Blog
                </Link>
                <span className="absolute bottom-3 left-0 w-0 h-px bg-[var(--color-gold)] group-hover:w-full transition-all duration-300" />
              </li>

              {/* Rastrear envío */}
              <li className="relative group cursor-pointer py-4 list-none">
                <a href="https://tracking.skydropx.com/es-MX/page/zoa" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 whitespace-nowrap"
                  style={{ ...LINK_STYLE, color: NAV_COLOR, transition: "color 0.4s" }}>
                  Rastrear envío
                </a>
                <span className="absolute bottom-3 left-0 w-0 h-px bg-[var(--color-gold)] group-hover:w-full transition-all duration-300" />
              </li>
            </nav>
          </div>

          {/* ── Right icons ── */}
          <div className="flex-none shrink-0 flex items-center">
            {/* Desktop search icon */}
            <button
              onClick={() => setSearchOpen((v) => !v)}
              className="cursor-pointer p-2.5 rounded-lg hover:opacity-70 transition-opacity hidden md:block"
              style={{ color: NAV_COLOR, transition: "color 0.4s" }}
              aria-label="Buscar"
            >
              <Search size={18} strokeWidth={1.4} />
            </button>

            <button onClick={openCart} aria-label="Abrir carrito"
              className="cursor-pointer relative p-2.5 rounded-lg hover:opacity-70 transition-opacity"
              style={{ color: NAV_COLOR, transition: "color 0.4s" }}>
              <ShoppingBag size={20} strokeWidth={1.4} />
              <AnimatePresence>
                {isMounted && count > 0 && (
                  <motion.span key="badge"
                    initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-[var(--color-gold)] text-[var(--color-cream)] text-[9px] font-sans flex items-center justify-center leading-none">
                    {count > 99 ? "99+" : count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Mobile search icon */}
            <button
              onClick={() => { setSearchOpen((v) => !v); setMobileOpen(false); }}
              className="cursor-pointer md:hidden p-2.5 rounded-lg hover:opacity-70 transition-opacity"
              style={{ color: NAV_COLOR, transition: "color 0.4s" }}
              aria-label="Buscar"
            >
              <Search size={18} strokeWidth={1.4} />
            </button>

            <button
              className="cursor-pointer md:hidden p-2.5 rounded-lg hover:opacity-70 transition-opacity"
              style={{ color: NAV_COLOR, transition: "color 0.4s" }}
              onClick={() => { setMobileOpen((v) => !v); setSearchOpen(false); }}
              aria-label="Menú">
              {mobileOpen ? <X size={20} strokeWidth={1.4} /> : <Menu size={20} strokeWidth={1.4} />}
            </button>
          </div>
        </div>

        {/* ── Desktop Search Bar (slide down) ── */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="hidden md:block overflow-hidden border-t border-[var(--color-stone-100)] bg-[var(--color-cream)]/95 backdrop-blur-md"
            >
              <form onSubmit={handleSearch} className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-3">
                <Search size={16} className="text-[var(--color-stone-400)] shrink-0" />
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar"
                  className="flex-1 font-sans text-sm text-[var(--color-charcoal)] bg-transparent focus:outline-none placeholder:text-[var(--color-stone-400)]"
                />
                <button
                  type="submit"
                  className="px-5 py-2 bg-[var(--color-charcoal)] text-[var(--color-cream)] text-[10px] font-sans tracking-[0.2em] uppercase rounded-md hover:bg-[var(--color-gold)] transition-colors"
                >
                  Buscar
                </button>
                <button type="button" onClick={() => { setSearchOpen(false); setSearchQuery(""); }}>
                  <X size={16} className="text-[var(--color-stone-400)] hover:text-[var(--color-charcoal)] transition-colors" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Mobile Drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-x-0 top-14 z-40 bg-[var(--color-cream)] border-b border-[var(--color-stone-100)] shadow-lg md:hidden overflow-y-auto max-h-[80vh] rounded-b-xl">
            <div className="px-5 py-5 space-y-5">

              {/* Mobile search inside drawer */}
              <form onSubmit={handleSearch} className="flex items-center gap-2 border border-[var(--color-stone-200)] rounded-lg px-3 py-2.5 bg-white">
                <Search size={14} className="text-[var(--color-stone-400)] shrink-0" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar"
                  className="flex-1 text-xs font-sans text-[var(--color-charcoal)] bg-transparent focus:outline-none placeholder:text-[var(--color-stone-400)]"
                />
              </form>

              <Link href="/" onClick={() => setMobileOpen(false)}
                className="block py-2 font-sans text-xs tracking-[0.22em] uppercase text-[var(--color-charcoal)] border-b border-[var(--color-stone-100)]">
                Inicio
              </Link>
              <div>
                <p className="text-[9px] tracking-[0.3em] uppercase text-[var(--color-stone-400)] mb-2">Colecciones</p>
                <div className="grid grid-cols-2 gap-1">
                  {COLLECTIONS.map((c) => (
                    <Link key={c.slug} href={`/tienda?coleccion=${encodeURIComponent(c.slug)}`} onClick={() => setMobileOpen(false)}
                      className="py-1.5 text-xs text-[var(--color-stone-600)] hover:text-[var(--color-gold)] transition-colors cursor-pointer">
                      {c.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[9px] tracking-[0.3em] uppercase text-[var(--color-stone-400)] mb-2">Categorías</p>
                <div className="flex flex-wrap gap-1.5">
                  <Link href="/tienda" onClick={() => setMobileOpen(false)}
                    className="cursor-pointer px-3 py-1.5 border border-[var(--color-gold)] rounded-md text-[9px] tracking-[0.15em] uppercase text-[var(--color-gold)]">
                    Todos
                  </Link>
                  {CATEGORIES.map((cat) => (
                    <Link key={cat} href={`/tienda?categoria=${encodeURIComponent(cat)}`} onClick={() => setMobileOpen(false)}
                      className="cursor-pointer px-3 py-1.5 border border-[var(--color-stone-200)] rounded-md text-[9px] tracking-[0.15em] uppercase text-[var(--color-stone-600)]">
                      {cat}
                    </Link>
                  ))}
                </div>
              </div>

              <Link href="/blog" onClick={() => setMobileOpen(false)}
                className="block py-2 font-sans text-xs tracking-[0.22em] uppercase text-[var(--color-charcoal)] border-b border-[var(--color-stone-100)]">
                Blog
              </Link>

              <a href="https://tracking.skydropx.com/es-MX/page/zoa" target="_blank" rel="noopener noreferrer"
                onClick={() => setMobileOpen(false)}
                className="block py-2 font-sans text-xs tracking-[0.22em] uppercase text-[var(--color-charcoal)] border-b border-[var(--color-stone-100)]">
                Rastrear envío
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
