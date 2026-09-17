"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Menu, X, Search, ChevronDown, Instagram, Phone, ArrowRight } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { useState, useEffect, useRef, useSyncExternalStore } from "react";
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

const ANNOUNCEMENT = ["Envíos a todo México", "Pago seguro", "Nueva colección", "Cambios hasta 7 días"];

// Imagen destacada del mega menú (frame editorial de la colección — asset existente)
const MEGA_IMAGE =
  "https://res.cloudinary.com/dsx1gi6mt/video/upload/so_1,f_jpg/v1775747428/que_continu%CC%81en_caminando_202604090909_tsrvo7.jpg";

const EASE = [0.16, 1, 0.3, 1] as const;

// Nav item base — el color se inyecta con var(--nc) para responder a data-home / data-scrolled
const NAV_ITEM =
  "relative inline-flex cursor-pointer items-center gap-1.5 py-4 font-sans text-[11px] font-normal uppercase tracking-[0.22em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current";

const MEGA_LINK =
  "group flex cursor-pointer items-center justify-between border-b border-zoa-line py-3 font-sans text-[13px] text-zoa-slate transition-opacity duration-200 hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zoa-slate";

type OpenMenu = "collections" | "categories" | null;

/** Suscripción vacía: `useSyncExternalStore` la usa solo para leer el snapshot de cliente. */
const emptySubscribe = () => () => {};

/** `true` únicamente tras hidratar — evita mismatches con el carrito persistido. */
function useIsMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

/** Rombo hairline — separador editorial del marquee de anuncio. */
function HairlineDiamond({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`mx-4 inline-block h-1 w-1 shrink-0 rotate-45 border border-current opacity-60 ${className}`}
    />
  );
}

export default function Navbar() {
  const { itemCount, openCart } = useCartStore();
  const router = useRouter();

  const [scrolled, setScrolled]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const desktopNavRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const isMounted = useIsMounted();

  // ── Barra de progreso de scroll (transform, sin re-render por frame) ──
  const { scrollYProgress } = useScroll();
  const scrollProgress = useSpring(scrollYProgress, { stiffness: 180, damping: 30, restDelta: 0.001 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 100);
  }, [searchOpen]);

  // Escape cierra búsqueda, menú móvil y mega menú
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setMobileOpen(false);
        setOpenMenu(null);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Click fuera del nav desktop cierra el mega menú
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (desktopNavRef.current && !desktopNavRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const count = isMounted ? itemCount() : 0;
  const pathname = usePathname();
  const isHome = pathname === "/" || pathname === "";
  const solidNav = scrolled || !isHome;
  const navColor = isHome && !scrolled ? "#FFF7F5" : "var(--color-zoa-slate)";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/tienda?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setSearchOpen(false);
      setMobileOpen(false);
    }
  };

  const closeAll = () => {
    setMobileOpen(false);
    setSearchOpen(false);
    setOpenMenu(null);
  };

  const drawerList = {
    hidden: {},
    show: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
  };
  const drawerItem = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
  };

  return (
    <>
      <header
        data-home={isHome ? "true" : "false"}
        data-scrolled={scrolled ? "true" : "false"}
        onMouseLeave={() => setOpenMenu(null)}
        className={`zoa-navbar fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
          solidNav
            ? "border-b border-zoa-line bg-zoa-sand/95 backdrop-blur-md"
            : "border-b border-transparent bg-transparent"
        }`}
        style={{ "--nc": navColor } as React.CSSProperties}
      >
        {/* ── Progreso de scroll: 1px forest en el borde superior ── */}
        {reduceMotion ? (
          <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-zoa-forest/35" />
        ) : (
          <motion.span
            aria-hidden
            style={{ scaleX: scrollProgress }}
            className="absolute inset-x-0 top-0 z-10 h-px origin-left bg-zoa-forest"
          />
        )}

        {/* ── Barra de anuncio (arena + slate + hairline; colapsa al scroll) ── */}
        <div
          aria-hidden="true"
          className={`overflow-hidden bg-zoa-sand transition-[height,opacity] duration-300 ${
            scrolled ? "h-0 opacity-0" : "h-8 opacity-100 border-b border-zoa-line"
          }`}
        >
          <div className="flex h-8 items-center text-zoa-slate-60">
            {reduceMotion ? (
              <p className="w-full text-center font-sans text-[10px] uppercase tracking-[0.25em]">
                {ANNOUNCEMENT.join(" · ")}
              </p>
            ) : (
              <div className="marquee-wrap w-full" style={{ "--marquee-duration": "38s" } as React.CSSProperties}>
                <div className="marquee-track">
                  {/* Dos copias idénticas → bucle perfecto a -50% */}
                  {[0, 1].map((copy) => (
                    <div key={copy} className="flex items-center whitespace-nowrap pr-8">
                      {ANNOUNCEMENT.map((msg, i) => (
                        <span key={`${copy}-${i}`} className="flex items-center">
                          <span className="font-sans text-[10px] uppercase tracking-[0.25em]">{msg}</span>
                          <HairlineDiamond />
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Fila principal ── */}
        <div className="container-zoa flex h-16 items-center md:h-20">

          {/* Wordmark */}
          <div className="flex-none">
            <Link
              href="/"
              aria-label="Zoa — Inicio"
              className="cursor-pointer font-display text-[clamp(22px,2.4vw,30px)] leading-none tracking-[0.14em] transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
              style={{ color: "var(--nc)" }}
            >
              ZOA<sup className="align-super text-[0.4em] tracking-normal opacity-70">®</sup>
            </Link>
          </div>

          {/* Desktop nav */}
          <div className="min-w-0 flex-1 px-2 md:px-8">
            <nav ref={desktopNavRef} aria-label="Principal" className="hidden md:block">
              <ul className="m-0 flex list-none items-center justify-center gap-7 p-0 lg:gap-9">

                <li className="list-none">
                  <Link href="/" className={NAV_ITEM} style={{ color: "var(--nc)" }}>
                    <span className="link-underline">Inicio</span>
                  </Link>
                </li>

                {/* Colecciones → mega menú */}
                <li className="list-none">
                  <button
                    type="button"
                    aria-haspopup="true"
                    aria-expanded={openMenu === "collections"}
                    aria-controls="mega-menu"
                    onClick={() => setOpenMenu((v) => (v === "collections" ? null : "collections"))}
                    onMouseEnter={() => setOpenMenu("collections")}
                    className={NAV_ITEM}
                    style={{ color: "var(--nc)" }}
                  >
                    <span className="link-underline">Colecciones</span>
                    <ChevronDown
                      size={12}
                      strokeWidth={1.8}
                      aria-hidden
                      className={`transition-transform duration-300 ${openMenu !== null ? "rotate-180" : ""}`}
                    />
                  </button>
                </li>

                {/* Categorías → mega menú */}
                <li className="list-none">
                  <button
                    type="button"
                    aria-haspopup="true"
                    aria-expanded={openMenu === "categories"}
                    aria-controls="mega-menu"
                    onClick={() => setOpenMenu((v) => (v === "categories" ? null : "categories"))}
                    onMouseEnter={() => setOpenMenu("categories")}
                    className={NAV_ITEM}
                    style={{ color: "var(--nc)" }}
                  >
                    <span className="link-underline">Categorías</span>
                    <ChevronDown
                      size={12}
                      strokeWidth={1.8}
                      aria-hidden
                      className={`transition-transform duration-300 ${openMenu !== null ? "rotate-180" : ""}`}
                    />
                  </button>
                </li>

                <li className="list-none">
                  <Link href="/blog" className={NAV_ITEM} style={{ color: "var(--nc)" }}>
                    <span className="link-underline">Blog</span>
                  </Link>
                </li>

                <li className="list-none">
                  <a
                    href="https://tracking.skydropx.com/es-MX/page/zoa"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={NAV_ITEM}
                    style={{ color: "var(--nc)" }}
                  >
                    <span className="link-underline">Rastrear envío</span>
                  </a>
                </li>
              </ul>
            </nav>
          </div>

          {/* Iconos */}
          <div className="flex flex-none shrink-0 items-center gap-1 md:gap-2">
            <button
              type="button"
              onClick={() => { setSearchOpen((v) => !v); setMobileOpen(false); }}
              aria-label="Buscar"
              aria-expanded={searchOpen}
              className="flex h-11 w-11 cursor-pointer items-center justify-center transition-opacity duration-200 hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
              style={{ color: "var(--nc)" }}
            >
              <Search size={18} strokeWidth={1.4} />
            </button>

            <button
              type="button"
              onClick={() => { setMobileOpen(false); openCart(); }}
              aria-label={`Abrir bolsa${count > 0 ? ` — ${count} ${count === 1 ? "pieza" : "piezas"}` : ""}`}
              className="relative flex h-11 cursor-pointer items-center gap-2 px-2 transition-opacity duration-200 hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current md:px-3"
              style={{ color: "var(--nc)" }}
            >
              <span className="relative">
                <ShoppingBag size={20} strokeWidth={1.4} aria-hidden />
                <AnimatePresence>
                  {isMounted && count > 0 && (
                    <motion.span
                      key="badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center bg-zoa-slate px-1 font-sans text-[9px] font-medium leading-none text-zoa-surface tabular md:hidden"
                    >
                      {count > 99 ? "99+" : count}
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
              <span className="link-underline hidden font-sans text-[10px] font-medium uppercase tracking-[0.18em] tabular md:inline">
                Bolsa ({count})
              </span>
            </button>

            <button
              type="button"
              className="flex h-11 w-11 cursor-pointer items-center justify-center transition-opacity duration-200 hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current md:hidden"
              style={{ color: "var(--nc)" }}
              onClick={() => { setMobileOpen((v) => !v); setSearchOpen(false); setOpenMenu(null); }}
              aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={20} strokeWidth={1.4} /> : <Menu size={20} strokeWidth={1.4} />}
            </button>
          </div>
        </div>

        {/* ── Mega menú full-bleed (#FFF7F5) — 4 columnas ── */}
        <AnimatePresence>
          {openMenu !== null && (
            <motion.div
              key="mega"
              id="mega-menu"
              initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="absolute inset-x-0 top-full hidden border-t border-zoa-line bg-zoa-surface md:block"
            >
              <div className="container-zoa grid grid-cols-1 gap-10 py-10 md:grid-cols-3 xl:grid-cols-4">
                {/* Colecciones */}
                <div>
                  <p className="font-display text-xl leading-none text-zoa-slate">Colecciones</p>
                  <ul className="m-0 mt-5 list-none border-t border-zoa-line p-0">
                    {COLLECTIONS.map((c, i) => (
                      <li key={c.slug} className="list-none">
                        <Link
                          href={`/tienda?coleccion=${encodeURIComponent(c.slug)}`}
                          onClick={closeAll}
                          className={MEGA_LINK}
                        >
                          {c.label}
                          <span className="font-sans text-[10px] tracking-[0.16em] text-zoa-slate-60 tabular">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Categorías */}
                <div>
                  <p className="font-display text-xl leading-none text-zoa-slate">Categorías</p>
                  <ul className="m-0 mt-5 grid list-none grid-cols-2 border-t border-zoa-line p-0">
                    <li className="list-none border-b border-zoa-line pr-4">
                      <Link href="/tienda" onClick={closeAll} className={MEGA_LINK}>
                        Ver todo
                      </Link>
                    </li>
                    {CATEGORIES.map((cat, i) => (
                      <li key={cat} className={`list-none border-b border-zoa-line ${i % 2 === 0 ? "pr-4" : ""}`}>
                        <Link
                          href={`/tienda?categoria=${encodeURIComponent(cat)}`}
                          onClick={closeAll}
                          className={MEGA_LINK}
                        >
                          {cat}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Tienda / enlaces */}
                <div>
                  <p className="font-display text-xl leading-none text-zoa-slate">Tienda</p>
                  <ul className="m-0 mt-5 list-none border-t border-zoa-line p-0">
                    <li className="list-none">
                      <Link href="/tienda" onClick={closeAll} className={MEGA_LINK}>
                        Todos los productos
                      </Link>
                    </li>
                    <li className="list-none">
                      <Link href="/blog" onClick={closeAll} className={MEGA_LINK}>
                        Blog
                      </Link>
                    </li>
                    <li className="list-none">
                      <Link href="/devoluciones" onClick={closeAll} className={MEGA_LINK}>
                        Cambios y devoluciones
                      </Link>
                    </li>
                    <li className="list-none">
                      <a
                        href="https://tracking.skydropx.com/es-MX/page/zoa"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={closeAll}
                        className={MEGA_LINK}
                      >
                        Rastrear envío
                      </a>
                    </li>
                  </ul>
                </div>

                {/* Destacado editorial + CTA */}
                <div className="hidden xl:block">
                  <p className="font-display text-xl leading-none text-zoa-slate">Destacado</p>
                  <div className="relative mt-5 aspect-[4/5] w-full overflow-hidden bg-zoa-sand">
                    <Image
                      src={MEGA_IMAGE}
                      alt="Colección Zoa"
                      fill
                      sizes="320px"
                      className="object-cover object-center"
                    />
                  </div>
                  <Link
                    href="/tienda"
                    onClick={closeAll}
                    className="group mt-5 inline-flex cursor-pointer items-center gap-2 border-b border-zoa-slate pb-1 font-sans text-[10px] uppercase tracking-[0.18em] text-zoa-slate transition-opacity duration-200 hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate"
                  >
                    Ver la colección
                    <ArrowRight size={12} aria-hidden className="transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Panel de búsqueda (desktop y mobile) ── */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="overflow-hidden border-t border-zoa-line bg-zoa-sand/95 backdrop-blur-md"
            >
              <form
                onSubmit={handleSearch}
                className="container-zoa flex items-center gap-3 py-5"
              >
                <Search size={16} className="shrink-0 text-zoa-slate-60" aria-hidden />
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") { setSearchOpen(false); setSearchQuery(""); }
                  }}
                  placeholder="Buscar blusas, vestidos, sweaters…"
                  aria-label="Buscar productos"
                  className="min-h-11 flex-1 bg-transparent font-sans text-sm text-zoa-slate placeholder:text-zoa-slate-60 focus:outline-none"
                />
                <button
                  type="submit"
                  className="min-h-11 cursor-pointer border border-zoa-line-strong px-6 font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-zoa-slate transition-colors duration-200 hover:bg-zoa-slate/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate"
                >
                  Buscar
                </button>
                <button
                  type="button"
                  onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                  aria-label="Cerrar búsqueda"
                  className="flex h-11 w-11 cursor-pointer items-center justify-center text-zoa-slate-60 transition-colors duration-200 hover:text-zoa-slate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate"
                >
                  <X size={16} />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Drawer móvil full-screen (#FFF7F5) ── */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="fixed inset-0 z-[60] flex flex-col bg-zoa-surface md:hidden"
            >
              {/* Barra superior */}
              <div className="hairline-b flex h-16 flex-none items-center justify-between px-5">
                <span className="font-display text-xl leading-none tracking-[0.14em] text-zoa-slate">
                  ZOA
                </span>
                <button
                  type="button"
                  onClick={closeAll}
                  aria-label="Cerrar menú"
                  className="flex h-11 w-11 cursor-pointer items-center justify-center text-zoa-slate transition-opacity duration-200 hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate"
                >
                  <X size={20} strokeWidth={1.4} />
                </button>
              </div>

              {/* Contenido scrollable */}
              <motion.div
                variants={reduceMotion ? undefined : drawerList}
                initial={reduceMotion ? false : "hidden"}
                animate={reduceMotion ? undefined : "show"}
                className="flex-1 overflow-y-auto overscroll-contain"
              >
                {/* Búsqueda */}
                <motion.div variants={reduceMotion ? undefined : drawerItem} className="hairline-b px-5 py-5">
                  <form onSubmit={handleSearch} className="flex items-center gap-2 border border-zoa-line-strong px-3 py-2">
                    <Search size={14} className="shrink-0 text-zoa-slate-60" aria-hidden />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar"
                      aria-label="Buscar productos"
                      className="min-h-11 flex-1 bg-transparent font-sans text-xs text-zoa-slate placeholder:text-zoa-slate-60 focus:outline-none"
                    />
                    <button
                      type="submit"
                      aria-label="Buscar"
                      className="min-h-11 cursor-pointer border border-zoa-line-strong px-4 font-sans text-[9px] font-medium uppercase tracking-[0.18em] text-zoa-slate"
                    >
                      Ir
                    </button>
                  </form>
                </motion.div>

                {/* Enlaces principales — 01…04 */}
                <ul className="m-0 list-none p-0">
                  {[
                    { href: "/", label: "Inicio", external: false },
                    { href: "/tienda", label: "Tienda", external: false },
                    { href: "/blog", label: "Blog", external: false },
                    { href: "https://tracking.skydropx.com/es-MX/page/zoa", label: "Rastrear envío", external: true },
                  ].map((link, i) => (
                    <motion.li
                      key={link.href}
                      variants={reduceMotion ? undefined : drawerItem}
                      className="hairline-b list-none"
                    >
                      {link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={closeAll}
                          className="flex items-baseline gap-4 px-5 py-5 font-sans text-2xl font-light tracking-[-0.02em] text-zoa-slate transition-opacity duration-200 hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zoa-slate"
                        >
                          <span className="font-sans text-[10px] tracking-[0.2em] text-zoa-slate-60 tabular">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          onClick={closeAll}
                          className="flex items-baseline gap-4 px-5 py-5 font-sans text-2xl font-light tracking-[-0.02em] text-zoa-slate transition-opacity duration-200 hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zoa-slate"
                        >
                          <span className="font-sans text-[10px] tracking-[0.2em] text-zoa-slate-60 tabular">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          {link.label}
                        </Link>
                      )}
                    </motion.li>
                  ))}
                </ul>

                {/* Colecciones */}
                <motion.div variants={reduceMotion ? undefined : drawerItem} className="px-5 pt-8">
                  <p className="font-display text-lg leading-none text-zoa-slate">Colecciones</p>
                  <ul className="m-0 mt-3 list-none border-t border-zoa-line p-0">
                    {COLLECTIONS.map((c, i) => (
                      <li key={c.slug} className="list-none border-b border-zoa-line">
                        <Link
                          href={`/tienda?coleccion=${encodeURIComponent(c.slug)}`}
                          onClick={closeAll}
                          className="flex min-h-11 items-center justify-between py-3 font-sans text-[14px] text-zoa-slate"
                        >
                          {c.label}
                          <span className="font-sans text-[10px] tracking-[0.16em] text-zoa-slate-60 tabular">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </motion.div>

                {/* Categorías */}
                <motion.div variants={reduceMotion ? undefined : drawerItem} className="px-5 pt-8">
                  <p className="font-display text-lg leading-none text-zoa-slate">Categorías</p>
                  <ul className="m-0 mt-3 grid list-none grid-cols-2 border-t border-zoa-line p-0">
                    <li className="list-none border-b border-zoa-line pr-4">
                      <Link href="/tienda" onClick={closeAll} className="flex min-h-11 items-center py-3 font-sans text-[13px] text-zoa-slate">
                        Ver todo
                      </Link>
                    </li>
                    {CATEGORIES.map((cat, i) => (
                      <li key={cat} className={`list-none border-b border-zoa-line ${i % 2 === 0 ? "pr-4" : ""}`}>
                        <Link
                          href={`/tienda?categoria=${encodeURIComponent(cat)}`}
                          onClick={closeAll}
                          className="flex min-h-11 items-center py-3 font-sans text-[13px] text-zoa-slate"
                        >
                          {cat}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </motion.div>

                {/* Contacto y redes */}
                <motion.div variants={reduceMotion ? undefined : drawerItem} className="hairline-t mt-10 bg-zoa-sand/60 px-5 py-7">
                  <p className="overline">Atención personalizada</p>
                  <div className="mt-4 flex flex-col gap-3 font-sans text-[13px] text-zoa-slate">
                    <a
                      href="https://wa.me/525521068191"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={closeAll}
                      className="link-underline inline-flex w-fit items-center gap-2"
                    >
                      WhatsApp +52 55 2106 8191
                    </a>
                    <a href="tel:5521068191" className="link-underline inline-flex w-fit items-center gap-2">
                      <Phone size={13} strokeWidth={1.4} aria-hidden />
                      55 2106 8191
                    </a>
                    <a
                      href="https://instagram.com/zoa.mx"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={closeAll}
                      className="link-underline inline-flex w-fit items-center gap-2"
                    >
                      <Instagram size={13} strokeWidth={1.4} aria-hidden />
                      @zoa.mx
                    </a>
                  </div>
                  <p className="mt-6 font-sans text-[10px] uppercase tracking-[0.2em] text-zoa-slate-60">
                    Envíos a todo México
                  </p>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
