"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Menu, X, Search, ChevronDown, Instagram, Phone } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import { useCartStore } from "@/store/cartStore";
import { useRouter, usePathname } from "next/navigation";
import Button from "@/components/ui/Button";
import useMounted from "@/components/ui/useMounted";
import type { BestSeller } from "@/lib/types";

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

// Enlaces del desplegable "Tienda" (fila superior y drawer móvil)
const SHOP_LINKS: { label: string; href: string; external?: boolean }[] = [
  { label: "Todos los productos",    href: "/tienda" },
  { label: "Blog",                   href: "/blog" },
  { label: "Cambios y devoluciones", href: "/devoluciones" },
  { label: "Rastrear envío",         href: "https://tracking.skydropx.com/es-MX/page/zoa", external: true },
];

const ANNOUNCEMENT = ["Envíos a todo México", "Pago seguro", "Nueva colección", "Cambios hasta 7 días"];

// Imagen destacada del mega menú (poster editorial de la colección — clip vigente)
const MEGA_IMAGE =
  "https://res.cloudinary.com/ppo6ze2s/video/upload/so_1,f_jpg,q_auto,w_1600/v1789510134/Two_models_walking_in_city_20260915160740.jpg";

const EASE = [0.16, 1, 0.3, 1] as const;

// Nav item base — el color se inyecta con var(--nc) para responder a data-home / data-scrolled.
// El hover (v4.1) deja la opacidad y pasa a color con var(--nc-hover): off-white/72 sobre
// video (home sin scroll) y forest cuando el nav es sólido.
const NAV_ITEM =
  "relative inline-flex cursor-pointer items-center gap-1.5 py-4 font-sans text-[11px] font-normal uppercase tracking-[0.22em] text-[color:var(--nc)] transition-colors duration-200 hover:text-[color:var(--nc-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current";

const MEGA_LINK =
  "group flex cursor-pointer items-center justify-between border-b border-zoa-line py-3 font-sans text-[13px] text-zoa-slate transition-colors duration-200 hover:text-zoa-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zoa-slate";

// v4.1 · Título de columna del mega menú / drawer: regla corta forest sobre Bodoni
const MENU_TITLE_RULE = "rule-forest mb-3";

type OpenMenu = "collections" | "categories" | "shop" | null;

/** Etiqueta accesible del panel para cada trigger (`aria-label` del region). */
const MENU_LABELS: Record<Exclude<OpenMenu, null>, string> = {
  collections: "Colecciones",
  categories: "Categorías",
  shop: "Tienda",
};

/** Orden de los triggers en la fila superior del nav desktop. */
const MENU_ORDER: Exclude<OpenMenu, null>[] = ["collections", "categories", "shop"];

/** Rombo hairline forest — separador editorial del marquee de anuncio (texto slate-60 intacto). */
function HairlineDiamond({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`mx-4 inline-block h-1 w-1 shrink-0 rotate-45 border border-zoa-forest opacity-60 ${className}`}
    />
  );
}

export default function Navbar({ bestSellers = [] }: { bestSellers?: BestSeller[] }) {
  const { itemCount, openCart } = useCartStore();
  const router = useRouter();

  // Índice del destacado activo (crossfade de "Lo más vendido" en Colecciones)
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const [scrolled, setScrolled]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  // Retención del estado sólido durante la salida (~250 ms) de cada panel:
  // se encienden al cerrar y se apagan en el `onExitComplete` de su AnimatePresence.
  const [menuExiting, setMenuExiting] = useState(false);
  const [searchExiting, setSearchExiting] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const desktopNavRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  // `useMounted` (compartido) evita mismatches con el carrito persistido y con RM:
  // `false` en SSR y primer render del cliente.
  const isMounted = useMounted();
  const rm = isMounted && reduceMotion;

  // ── Cierres centralizados: cierran el panel y retienen el estado sólido de la
  // navbar durante su animación de salida (anti-flash sobre el video del hero) ──
  const closeMenu = useCallback(() => {
    if (openMenu === null) return;
    setMenuExiting(true);
    setOpenMenu(null);
  }, [openMenu]);

  const closeSearch = useCallback(() => {
    if (!searchOpen) return;
    setSearchExiting(true);
    setSearchOpen(false);
  }, [searchOpen]);

  // Reabrir a mitad de salida cancela la retención (el panel vuelve a estar presente)
  const showMenu = useCallback((key: Exclude<OpenMenu, null>) => {
    setMenuExiting(false);
    setOpenMenu(key);
    // El destacado siempre arranca en la prenda más vendida al abrir Colecciones
    if (key === "collections") setFeaturedIdx(0);
  }, []);

  // Crossfade del destacado: avanza cada 4 s solo con el panel abierto
  // (estático con reduced motion, una sola prenda o sin datos)
  useEffect(() => {
    if (openMenu !== "collections" || rm || bestSellers.length <= 1) return;
    const timer = setInterval(
      () => setFeaturedIdx((v) => (v + 1) % bestSellers.length),
      4000
    );
    return () => clearInterval(timer);
  }, [openMenu, rm, bestSellers.length]);

  const showSearch = useCallback(() => {
    setSearchExiting(false);
    setSearchOpen(true);
  }, []);

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
        closeSearch();
        closeMenu();
        setMobileOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeMenu, closeSearch]);

  // Click fuera del nav desktop cierra el mega menú
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (desktopNavRef.current && !desktopNavRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [closeMenu]);

  const count = isMounted ? itemCount() : 0;
  const pathname = usePathname();
  const isHome = pathname === "/" || pathname === "";
  // Un único booleano gobierna clases, --nc y --nc-hover (nunca divergen):
  // el estado sólido también aplica con un panel desplegado o aún en su salida.
  const panelOpen = openMenu !== null || searchOpen || menuExiting || searchExiting;
  const solidNav = scrolled || !isHome || panelOpen;
  const navColor = solidNav ? "var(--color-zoa-slate)" : "#FFF7F5";
  const navColorHover = solidNav ? "var(--color-zoa-forest)" : "rgba(255, 247, 245, 0.72)";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/tienda?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      closeSearch();
      setMobileOpen(false);
    }
  };

  const closeAll = () => {
    setMobileOpen(false);
    closeSearch();
    closeMenu();
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
        data-panel={panelOpen ? "true" : "false"}
        onMouseLeave={closeMenu}
        className={`zoa-navbar fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
          solidNav
            ? "border-b border-zoa-line bg-zoa-sand/95 backdrop-blur-md"
            : "border-b border-transparent bg-transparent"
        }`}
        style={{ "--nc": navColor, "--nc-hover": navColorHover } as React.CSSProperties}
      >
        {/* ── Progreso de scroll: 1px forest en el borde superior ── */}
        {rm ? (
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
            {rm ? (
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

          {/* Logo (wordmark ZOA® — SVG monocromo vía máscara) */}
          <div className="flex-none">
            <Link
              href="/"
              aria-label="Zoa — Inicio"
              className="block cursor-pointer text-[color:var(--nc)] transition-colors duration-300 hover:text-[color:var(--nc-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
            >
              <span aria-hidden className="zoa-logo h-[22px] w-[71px] lg:h-[26px] lg:w-[84px]" />
            </Link>
          </div>

          {/* Desktop nav */}
          <div className="min-w-0 flex-1 px-2 md:px-8">
            <nav ref={desktopNavRef} aria-label="Principal" className="hidden md:block">
              <ul className="m-0 flex list-none items-center justify-center gap-5 p-0 lg:gap-9">

                <li className="list-none">
                  <Link href="/" className={NAV_ITEM}>
                    <span className="link-underline">Inicio</span>
                  </Link>
                </li>

                {/* Colecciones · Categorías · Tienda → panel desplegable independiente */}
                {MENU_ORDER.map((key) => (
                  <li key={key} className="list-none">
                    <button
                      type="button"
                      aria-haspopup="true"
                      aria-expanded={openMenu === key}
                      aria-controls="mega-menu"
                      onClick={() => (openMenu === key ? closeMenu() : showMenu(key))}
                      onMouseEnter={() => showMenu(key)}
                      className={NAV_ITEM}
                    >
                      <span className="link-underline">{MENU_LABELS[key]}</span>
                      <ChevronDown
                        size={12}
                        strokeWidth={1.8}
                        aria-hidden
                        className={`transition-transform duration-300 ${openMenu === key ? "rotate-180" : ""}`}
                      />
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Iconos */}
          <div className="flex flex-none shrink-0 items-center gap-1 md:gap-2">
            <button
              type="button"
              onClick={() => {
                if (searchOpen) closeSearch();
                else showSearch();
                setMobileOpen(false);
              }}
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
                      className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center bg-zoa-forest px-1 font-sans text-[9px] font-medium leading-none text-zoa-surface tabular md:hidden"
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
              onClick={() => { setMobileOpen((v) => !v); closeSearch(); closeMenu(); }}
              aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={20} strokeWidth={1.4} /> : <Menu size={20} strokeWidth={1.4} />}
            </button>
          </div>
        </div>

        {/* ── Panel desplegable full-bleed (#FFF7F5) — un bloque por menú ── */}
        <AnimatePresence onExitComplete={() => setMenuExiting(false)}>
          {openMenu !== null && (
            <motion.div
              key="mega"
              id="mega-menu"
              role="region"
              aria-label={MENU_LABELS[openMenu]}
              initial={rm ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={rm ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="absolute inset-x-0 top-full hidden border-t border-zoa-line bg-zoa-surface md:block"
            >
              {/* key={openMenu} → el contenido cambia al instante entre triggers (sin salida) */}
              <motion.div
                key={openMenu}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.18, ease: EASE }}
                className="container-zoa py-10"
              >
                {openMenu === "collections" && (
                  <div className="grid grid-cols-1 gap-10 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_320px]">
                    {/* Listado 01–05 */}
                    <div>
                      <span aria-hidden className={MENU_TITLE_RULE} />
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

                    {/* Lo más vendido (crossfade) + CTA (solo xl) */}
                    <div className="hidden xl:block">
                      <span aria-hidden className={MENU_TITLE_RULE} />
                      <p className="font-display text-xl leading-none text-zoa-slate">
                        {bestSellers.length > 0 ? "Lo más vendido" : "Destacado"}
                      </p>
                      <div className="relative mt-5 aspect-[4/5] w-full overflow-hidden bg-zoa-sand">
                        {bestSellers.length > 0 ? (
                          bestSellers.map((product, i) => (
                            <Link
                              key={product.id}
                              href={`/product/${product.id}`}
                              onClick={closeAll}
                              tabIndex={i === featuredIdx ? 0 : -1}
                              aria-hidden={i !== featuredIdx}
                              className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                                i === featuredIdx ? "z-10 opacity-100" : "pointer-events-none opacity-0"
                              }`}
                            >
                              <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                sizes="320px"
                                className="object-cover object-center"
                              />
                            </Link>
                          ))
                        ) : (
                          <Image
                            src={MEGA_IMAGE}
                            alt="Colección Zoa"
                            fill
                            sizes="320px"
                            className="object-cover object-center"
                          />
                        )}
                      </div>
                      <Button variant="link-arrow" href="/tienda" onClick={closeAll} className="mt-5">
                        Ver la colección
                      </Button>
                    </div>
                  </div>
                )}

                {openMenu === "categories" && (
                  <div>
                    <span aria-hidden className={MENU_TITLE_RULE} />
                    <p className="font-display text-xl leading-none text-zoa-slate">Categorías</p>
                    <ul className="m-0 mt-5 grid list-none grid-cols-1 border-t border-zoa-line p-0 md:grid-cols-3">
                      <li className="list-none border-b border-zoa-line pr-6">
                        <Link href="/tienda" onClick={closeAll} className={MEGA_LINK}>
                          Ver todo
                        </Link>
                      </li>
                      {CATEGORIES.map((cat, i) => (
                        <li
                          key={cat}
                          className={`list-none border-b border-zoa-line ${(i + 1) % 3 !== 2 ? "pr-6" : ""}`}
                        >
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
                    <Button variant="link-arrow" href="/tienda" onClick={closeAll} className="mt-6">
                      Ver todos los productos
                    </Button>
                  </div>
                )}

                {openMenu === "shop" && (
                  <div className="grid grid-cols-1 gap-10 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_320px]">
                    {/* Enlaces de tienda en 2 columnas */}
                    <div>
                      <span aria-hidden className={MENU_TITLE_RULE} />
                      <p className="font-display text-xl leading-none text-zoa-slate">Tienda</p>
                      <ul className="m-0 mt-5 grid list-none grid-cols-1 border-t border-zoa-line p-0 sm:grid-cols-2 sm:gap-x-6">
                        {SHOP_LINKS.map((link) => (
                          <li key={link.href} className="list-none">
                            {link.external ? (
                              <a
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={closeAll}
                                className={MEGA_LINK}
                              >
                                {link.label}
                              </a>
                            ) : (
                              <Link href={link.href} onClick={closeAll} className={MEGA_LINK}>
                                {link.label}
                              </Link>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Atención personalizada (solo xl) */}
                    <div className="hidden xl:block">
                      <span aria-hidden className={MENU_TITLE_RULE} />
                      <p className="font-display text-xl leading-none text-zoa-slate">Atención personalizada</p>
                      <div className="mt-5 flex flex-col gap-3 font-sans text-[13px] text-zoa-slate">
                        <a
                          href="https://wa.me/525521068191"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={closeAll}
                          className="link-underline inline-flex w-fit items-center gap-2"
                        >
                          WhatsApp +52 55 2106 8191
                        </a>
                        <a
                          href="tel:5521068191"
                          onClick={closeAll}
                          className="link-underline inline-flex w-fit items-center gap-2"
                        >
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
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Panel de búsqueda (desktop y mobile) ── */}
        <AnimatePresence onExitComplete={() => setSearchExiting(false)}>
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
                    if (e.key === "Escape") { closeSearch(); setSearchQuery(""); }
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
                  onClick={() => { closeSearch(); setSearchQuery(""); }}
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
              initial={rm ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={rm ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="fixed inset-0 z-[60] flex flex-col bg-zoa-surface md:hidden"
            >
              {/* Barra superior */}
              <div className="hairline-b flex h-16 flex-none items-center justify-between px-5">
                <span aria-hidden className="zoa-logo h-[22px] w-[71px] text-zoa-slate" />
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
                variants={rm ? undefined : drawerList}
                initial={rm ? false : "hidden"}
                animate={rm ? undefined : "show"}
                className="flex-1 overflow-y-auto overscroll-contain"
              >
                {/* Búsqueda */}
                <motion.div variants={rm ? undefined : drawerItem} className="hairline-b px-5 py-5">
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

                {/* Enlace principal — 01 Inicio */}
                <ul className="m-0 list-none p-0">
                  <motion.li variants={rm ? undefined : drawerItem} className="hairline-b list-none">
                    <Link
                      href="/"
                      onClick={closeAll}
                      className="flex items-baseline gap-4 px-5 py-5 font-sans text-2xl font-light tracking-[-0.02em] text-zoa-slate transition-colors duration-200 hover:text-zoa-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zoa-forest"
                    >
                      <span className="font-sans text-[10px] tracking-[0.2em] text-zoa-forest tabular">01</span>
                      Inicio
                    </Link>
                  </motion.li>
                </ul>

                {/* Colecciones */}
                <motion.div variants={rm ? undefined : drawerItem} className="px-5 pt-8">
                  <span aria-hidden className={MENU_TITLE_RULE} />
                  <p className="font-display text-lg leading-none text-zoa-slate">Colecciones</p>
                  <ul className="m-0 mt-3 list-none border-t border-zoa-line p-0">
                    {COLLECTIONS.map((c, i) => (
                      <li key={c.slug} className="list-none border-b border-zoa-line">
                        <Link
                          href={`/tienda?coleccion=${encodeURIComponent(c.slug)}`}
                          onClick={closeAll}
                          className="flex min-h-11 items-center justify-between py-3 font-sans text-[14px] text-zoa-slate transition-colors duration-200 hover:text-zoa-forest"
                        >
                          {c.label}
                          <span className="font-sans text-[10px] tracking-[0.16em] text-zoa-forest tabular">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </motion.div>

                {/* Categorías */}
                <motion.div variants={rm ? undefined : drawerItem} className="px-5 pt-8">
                  <span aria-hidden className={MENU_TITLE_RULE} />
                  <p className="font-display text-lg leading-none text-zoa-slate">Categorías</p>
                  <ul className="m-0 mt-3 grid list-none grid-cols-2 border-t border-zoa-line p-0">
                    <li className="list-none border-b border-zoa-line pr-4">
                      <Link href="/tienda" onClick={closeAll} className="flex min-h-11 items-center py-3 font-sans text-[13px] text-zoa-slate transition-colors duration-200 hover:text-zoa-forest">
                        Ver todo
                      </Link>
                    </li>
                    {CATEGORIES.map((cat, i) => (
                      <li key={cat} className={`list-none border-b border-zoa-line ${i % 2 === 0 ? "pr-4" : ""}`}>
                        <Link
                          href={`/tienda?categoria=${encodeURIComponent(cat)}`}
                          onClick={closeAll}
                          className="flex min-h-11 items-center py-3 font-sans text-[13px] text-zoa-slate transition-colors duration-200 hover:text-zoa-forest"
                        >
                          {cat}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </motion.div>

                {/* Tienda */}
                <motion.div variants={rm ? undefined : drawerItem} className="px-5 pt-8">
                  <span aria-hidden className={MENU_TITLE_RULE} />
                  <p className="font-display text-lg leading-none text-zoa-slate">Tienda</p>
                  <ul className="m-0 mt-3 list-none border-t border-zoa-line p-0">
                    {SHOP_LINKS.map((link) => (
                      <li key={link.href} className="list-none border-b border-zoa-line">
                        {link.external ? (
                          <a
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={closeAll}
                            className="flex min-h-11 items-center py-3 font-sans text-[14px] text-zoa-slate transition-colors duration-200 hover:text-zoa-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zoa-forest"
                          >
                            {link.label}
                          </a>
                        ) : (
                          <Link
                            href={link.href}
                            onClick={closeAll}
                            className="flex min-h-11 items-center py-3 font-sans text-[14px] text-zoa-slate transition-colors duration-200 hover:text-zoa-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zoa-forest"
                          >
                            {link.label}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </motion.div>

                {/* Contacto y redes */}
                <motion.div variants={rm ? undefined : drawerItem} className="hairline-t mt-10 bg-zoa-sand/60 px-5 py-7">
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
