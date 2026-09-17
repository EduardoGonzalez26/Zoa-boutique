# MEMORIA — Zoa Boutique

> Documento de continuidad del proyecto para agentes y equipo. Registra estado, decisiones y pendientes entre sesiones.
> **Última actualización:** 2026-09-17 (sesión: logo SVG + navbar sólida con paneles desplegados).
> **Rama:** `main` sincronizada con `origin/main` en `23f9a7d`. Working tree limpio salvo `.tmp-qa/` (untracked).
> Este archivo **no sustituye** al código ni al design system: si hay discrepancia, mandan `design-system/zoa-boutique/MASTER.md` y el código.

---

## 1. Resumen ejecutivo

- **Qué es:** Zoa Boutique — e-commerce de moda femenina mexicana (boutique editorial, `zoa.mx`), con catálogo administrado desde Google Sheets, pagos con Mercado Pago, envíos con Skydropx y correos transaccionales con Resend.
- **Repo:** `https://github.com/EduardoGonzalez26/Zoa-boutique` (rama `main`). Deploy objetivo: Vercel.
- **Estado:** producto funcional completo (frontend, carrito/checkout, APIs, CMS en Sheet). Frontend bajo design system «EDITORIAL ATELIER» **v4.3** (light-first). `tsc`/`build` verdes según MASTER v4.3.
- **UI/UX:** dirección editorial propia (paleta arena/pizarra/forest/wine, tipografías Archivo + Bodoni Moda, retícula de hairlines, motion tokenizado).

## 2. Stack y arquitectura

### Stack real (`package.json`)
| Capa | Tecnología |
|---|---|
| Framework | Next.js `16.1.6` (App Router) + React `19.2.3` + TypeScript `^5` |
| Estilos | Tailwind CSS `^4` + `@tailwindcss/postcss` (tokens en `app/globals.css`) |
| Animación | Framer Motion `^12.35.2` (motion tokenizado) |
| Estado | Zustand `^5.0.11` (con `persist` en carrito) |
| UI | `lucide-react` (iconos), kit propio `components/ui/` |
| Pagos | `mercadopago` `^2.12.0` + `@mercadopago/sdk-react` (Payment Brick / Checkout Pro) |
| Emails | `resend` + `@react-email/components` |
| Infra | `@vercel/functions` |

Scripts: `dev`, `build`, `start`, `lint`.

### Estructura
| Ruta | Contenido |
|---|---|
| `app/` | App Router: `page.tsx` (home 9 bloques), `tienda/`, `product/[id]/`, `blog/` + `blog/[slug]/`, `checkout/` (`page`, `success`, `failure`), legales (`privacidad`, `terminos`, `devoluciones`), `layout.tsx`, `template.tsx` (transición CSS pura), `globals.css`, `sitemap.ts`, `icon.svg`/`favicon.ico`/`icon.png` |
| `app/api/` | `checkout` (preference MP), `process-payment`, `webhooks/mercadopago`, `webhooks/payment-success`, `shipping-rates` (Skydropx), `validate-coupon`, `reviews`, `vendido`, `debug-sheet`, `debug-skydropx` |
| `components/` | Navbar, Footer, HeroSection, CartDrawer, TiendaClient, ProductCard, ProductGalleryClient, CTABanner, CollectionIndex, BlogCard, ReadingProgress, Marquee, NewsletterForm, WhatsAppButton, MercadoPago*, AddressAutocomplete, ProductSearch, ProductReviews + **kit** `ui/` (Button, Reveal, ImageReveal, SectionHeader, Overline, Chip, Accordion, EmptyState, `useMounted`) |
| `lib/` | `googleSheets.ts` (CMS), `mercadopago.ts`, `skydropx.ts` (OAuth2 + cotización + envío), `blog.ts` (4 artículos estáticos), `types.ts` |
| `store/` | `cartStore.ts` (persist `zoa-cart`), `checkoutStore.ts` (quick buy + dirección) |
| `design-system/` | `zoa-boutique/MASTER.md` + `pages/{home,tienda,producto,checkout,blog}.md` |
| `public/` | `logozoa.svg` (wordmark 1485×460 ≈ 3.23:1), `bannerzoa.png`, `blog-*.png` |

### Flujo de datos e integraciones
1. **Google Sheets = CMS.** Lectura del CSV público (pestaña `Oficial`, columnas A–T) en `lib/googleSheets.ts`; ISR `revalidate = 60`. `getProducts` / `getGroupedProducts` (agrupa por nombre → variantes de color + `skus`) / `getGroupedProductById`. El ID de producto es siempre `NUM` (col. A); `SKU` es solo display.
2. **Escrituras al Sheet vía Google Apps Script** (`APPS_SCRIPT_URL`): `deductStock` (post-pago) y `logSale` (pestaña «Ventas»).
3. **Mercado Pago:** Checkout Pro (`/api/checkout`) + Payment Brick en el drawer/checkout; webhooks MP y `payment-success` (`/api/webhooks/*`) disparan stock, venta, email y creación de envío Skydropx.
4. **Skydropx:** cotización (`/api/shipping-rates`) y creación de envíos desde el webhook; credenciales OAuth2.
5. **Correos:** Resend en webhooks/reseñas.

### Variables de entorno requeridas (definidas en `.env.local` / Vercel; `.env*` gitignored)
`GOOGLE_SHEET_ID` (obligatoria; se eliminó hardcode en `2ce8246`), `GOOGLE_SHEET_NAME` (default `Oficial`), `APPS_SCRIPT_URL`, `MERCADOPAGO_ACCESS_TOKEN`, `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` (expuesta vía `next.config.ts`), `NEXT_PUBLIC_BASE_URL` / `NEXT_PUBLIC_SITE_URL` (fallback `https://zoa.mx`), `SKYDROPX_API_KEY` / `SKYDROPX_API_SECRET` / `SKYDROPX_PICKUP_*`, `RESEND_API_KEY`.

## 3. Design system

- **Fuente de verdad:** `design-system/zoa-boutique/MASTER.md` — **v4.3 «EDITORIAL ATELIER»** (light-first, sin dark mode). Overrides por página en `design-system/zoa-boutique/pages/`. Fuente ejecutable: `app/globals.css` + `components/ui/`.
- **Paleta:** fondo arena `#EAE9E5`; texto/pizarra `#2B3C42`; **forest `#003628`** (acción + acento; **exactamente 1 banda full-bleed por página**); **wine `#420D0D`** (urgencia; máx. 1 banda/página); superficie off-white `#FFF7F5`. **Prohibido `#FFFFFF`** y la paleta v2 (navy `#0E4067`, oro `#EFB810`, Outfit, Work Sans…).
- **Tipografías:** **Archivo** (texto/UI, 300–600) + **Bodoni Moda** (display, 400/500 + italic), vía `next/font/google`.
- **Reglas duras:** hairlines 1px, radios 0–2px, sombra solo en drawer/modal, sin `rounded-full` decorativo, sin degradados multicolor; Cloudinary activo `ppo6ze2s` (prohibido `dsx1gi6mt`); cupo de banda forest (home = `Marquee`, internas = `CTABanner`).
- **Hidratación v4.3 (ley):** `useReducedMotion()` nunca directo en render; patrón `rm = mounted && reduceMotion` con `components/ui/useMounted.ts`; `app/template.tsx` es CSS puro; 0 warnings de hydration como invariante (§8 MASTER).

## 4. Estado actual (verificado en repo)

**Frontend — implementado:**
- **Home** (`app/page.tsx`): hero doble video Cloudinary con crossfade, marquee forest, intro con métricas, destacado 8/4, índice de colecciones con preview, 6 carruseles de producto, banda wine (Día de las Madres), promesas, CTABanner global slate.
- **Tienda** (`/tienda`): `TiendaClient` con filtros por query params (`q`, `categoria`, `coleccion`, `talla`, `color`), orden client-side, densidad 2/3/4, sidebar desktop + bottom sheet móvil, `EmptyState`.
- **PDP** (`/product/[id]`): galería (slider móvil / thumbs sticky desktop), variantes de color, guía de tallas (modal), reseñas, cross-sell, barra sticky móvil + `body.zoa-hide-fab`, `generateStaticParams` + metadata/OG.
- **Blog** (`/blog`, `/blog/[slug]`): 4 artículos estáticos (`lib/blog.ts`), `ReadingProgress`, JSON-LD.
- **Carrito/Checkout:** `CartDrawer` (vistas `cart`/`checkout`), cupones (`/api/validate-coupon`), VIP «PROBADOR» (depósito $300), envío $150 / gratis ≥ $3,000, Payment Brick + Checkout Pro, `success`/`failure`.
- **Globales:** `Navbar` (logo SVG máscara, mega menú único full-bleed de 3 grupos, búsqueda, drawer móvil, navbar sólida con paneles), `Footer` (logo watermark, newsletter → WhatsApp), FAB WhatsApp, `CTABanner`, legales, `sitemap.ts`.

**Pendiente de verificación en esta sesión:** no se ejecutó build/test aquí; la última referencia conocida (MASTER v4.3) reporta `tsc`/`build` verdes.

## 5. Decisiones clave (ADR)

| ID | Fecha | Decisión | Motivo / alternativas |
|---|---|---|---|
| **ADR-01** | 2026-09-17 | **Logo SVG monocromo vía CSS mask.** `public/logozoa.svg` se pinta con `.zoa-logo` (`background-color: currentColor` + `mask-image`), heredando `--nc`/`--nc-hover` en navbar y color explícito (slate/forest) en drawer/footer. Tamaños: 71×22 <lg / 84×26 ≥lg; watermark footer `.zoa-logo-footer` alto `clamp(4rem,9.6vw,8.8rem)` y ancho ×3.2283 (sin CLS). Reemplaza el wordmark Bodoni en texto. | Un solo asset recoloreable, sin duplicar versiones claro/oscuro ni tocar el DOM del logo. Descartado: dos assets fijos por contexto y logo como `<Image>`. |
| **ADR-02** | 2026-09-17 | **Navbar sólida obligatoria con panel desplegado + retención anti-flash.** Un panel (mega menú o búsqueda) siempre pinta la navbar sólida; el estado se retiene ~250 ms durante la salida vía `menuExiting`/`searchExiting` + `onExitComplete`. Cierres centralizados `closeMenu`/`closeSearch`. Un único booleano `solidNav = scrolled \|\| !isHome \|\| panelOpen` gobierna clases, `--nc` y `--nc-hover` (nunca divergen); atributo observable `data-panel` + reglas en `globals.css`. | Evita el flash/apagado prematuro sobre el video del hero al cerrar o cambiar de panel. Descartado: cambiar a transparente en `exit` (parpadeo) y desmontar sin animación. |
| **ADR-03** | 2026-09-17 | **Favicons regenerados desde el logo:** `app/icon.svg` nuevo (monocromo `#2B3C42`, variante dark `#FFF7F5`), `favicon.ico` e `icon.png` regenerados. | Coherencia de marca; los anteriores eran del scaffold. |
| **ADR-04** | 2026-09-17 (`c12e10a`) | **Política de hidratación v4.3 (heredada y vigente):** prohibido `useReducedMotion()` directo; patrón `rm = mounted && reduceMotion`; `template.tsx` CSS puro; datos de `localStorage` post-mount (`isMounted`); único `suppressHydrationWarning` justificado en `<html>`. | Eliminar warnings de mismatch de framer-motion/SSR. Alternativa descartada: `suppressHydrationWarning` como parche. |
| **ADR-05** | 2026-09-17 (`7318aaf`, v4.2) | **Reestructura navbar v4.2:** Blog y «Rastrear envío» viven dentro del grupo **Tienda** (no en la fila); mega menú único por grupo activo; hover forest solo con nav sólido; Cloudinary `ppo6ze2s` como cloud activo (incluido el poster del mega menú). | Simplificar la fila superior y unificar paneles. |
| **ADR-06** | 2026-09-14 (`2ce8246`) | **Google Sheets como CMS sin hardcode:** `GOOGLE_SHEET_ID` obligatoria por env (error explícito si falta); lectura por CSV público (evita la inferencia de tipos de gviz que nullifica SKUs); escrituras vía Apps Script. | Seguridad y robustez del parseo de datos. |

## 6. Historial reciente

| Hash | Fecha | Mensaje | Nota |
|---|---|---|---|
| `23f9a7d` | 2026-09-17 | Feature: Logo SVG (navbar/footer) y navbar solida con paneles desplegados | 7 archivos (`app/favicon.ico`, `app/globals.css`, `app/icon.png`, `app/icon.svg`, `components/Footer.tsx`, `components/Navbar.tsx`, `MASTER.md`). Integra el logo vía `.zoa-logo` + navbar sólida + ADR-02/03. |
| `c12e10a` | 2026-09-17 | Feature: Arrgelar padding en botones del hero | 39 archivos: **añade `public/logozoa.svg`**, el fix de hidratación v4.3 (`useMounted.ts`, `template.tsx` CSS), MASTER/pages y el fix de padding del hero. El mensaje no refleja todo el contenido. |
| `7318aaf` | 2026-09-17 | Update: New version Zoa Boutique V3 | Rediseño «EDITORIAL ATELIER»: MASTER v4 + overrides, kit `components/ui/`, Home/Tienda/PDP/Blog/Checkout rediseñados (47 archivos, +4712/−1842). |
| `2ce8246` | 2026-09-14 | fix: remove hardcoded Google Sheets ID, require GOOGLE_SHEET_ID env var | ADR-06. |
| `d46a04e` | 2026-09-14 | Initial commit | Base del proyecto. |

## 7. Pendientes / TODOs

1. **`.tmp-qa/` untracked** (`chrome.log`, `chrome-profile/`): artefactos temporales de QA. Decidir si borrar o añadir `.tmp-qa/` a `.gitignore`.
2. **Rutas `/colecciones/*` inexistentes:** `Footer.tsx`, `app/sitemap.ts` y enlaces dentro de los artículos de `lib/blog.ts` apuntan a `/colecciones/<slug>`, pero **no existe `app/colecciones/`** (404 y URLs inválidas en el sitemap). Unificar a `/tienda?coleccion=<slug>` o crear las rutas.
3. **`/checkout/pending` referenciada pero inexistente:** `app/api/checkout/route.ts` declara `back_urls.pending` → `/checkout/pending`, y no hay página `app/checkout/pending/`. Añadirla o redirigir a `failure`.
4. **`README.md`**: sigue siendo el boilerplate de `create-next-app`; pendiente documentación real del proyecto.
5. **Assets sin referencias (candidatos a limpieza, verificado 0 usos):** `public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` y los logos legacy de raíz `zoa_logo_dark.png` / `zoa_logo_white.png` (trackeados).
6. **Rutas debug expuestas:** `app/api/debug-sheet` y `app/api/debug-skydropx` accesibles en producción; evaluar protección o retiro.
7. **Verificación:** ejecutar `tsc`/`build`/QA de hidratación («0 warnings», §8.6 MASTER) tras cualquier cambio; última referencia verde es v4.3.

## 8. Fuentes de verdad

1. **Design system:** `design-system/zoa-boutique/MASTER.md` (v4.3) + `design-system/zoa-boutique/pages/*.md`.
2. **Código ejecutable:** `app/globals.css` (tokens/utilidades) y `components/ui/` (kit obligatorio para superficies nuevas).
3. **Datos de catálogo:** Google Sheet, pestaña `Oficial` (columnas A–T), vía `lib/googleSheets.ts`.
4. **Repo remoto:** `origin` = GitHub `EduardoGonzalez26/Zoa-boutique` (rama `main`).
5. **Este archivo:** contexto de continuidad entre sesiones; se actualiza al cierre de cada sesión con estado, ADRs y pendientes.
