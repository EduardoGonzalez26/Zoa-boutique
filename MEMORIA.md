# MEMORIA — Zoa Boutique

> Documento de continuidad del proyecto para agentes y equipo. Registra estado, decisiones y pendientes entre sesiones.
> **Última actualización:** 2026-09-18 (sesión: remediación de seguridad de `.tmp-qa`, fix del chip de cupón en la bolsa, hardening `vipCode`, `npm run lint` en 0, **deploy migrado a Railway** y fix de la llave pública de MercadoPago: `waitUntil`→`after()` y env vacías toleradas con `||`).
> **Rama:** `main` ↔ `origin/main` (HEAD = `7f3ce9d`). El commit `c1c7c27` («Add: codigo secreto») fue **reescrito el 2026-09-18** (`git reset --soft HEAD~1` + `git rm -r --cached .tmp-qa` + commit + force-push con lease) para expulsar los 676 archivos de `.tmp-qa/`; el hash vigente es `8e0fe03` según `git log` (no reutilizar `c1c7c27`). El fix de cupón + hardening + lint + docs quedó en `7f3ce9d`. Working tree **con cambios sin commitear** al cierre de esta actualización: 8 archivos del fix de tarjeta MP (fallback cruzado de llave pública) y la migración a Railway (ver `git status` y §6). Acciones manuales pendientes en **§7**.
> Este archivo **no sustituye** al código ni al design system: si hay discrepancia, mandan `design-system/zoa-boutique/MASTER.md` y el código.

---

## 1. Resumen ejecutivo

- **Qué es:** Zoa Boutique — e-commerce de moda femenina mexicana (boutique editorial, `zoa.mx`), con catálogo administrado desde Google Sheets, pagos con Mercado Pago, envíos con Skydropx y correos transaccionales con Resend.
- **Repo:** `https://github.com/EduardoGonzalez26/Zoa-boutique` (rama `main`). **Deploy: Railway** (self-hosted; ya no Vercel).
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
| Infra | **Railway** (deploy self-hosted) + `after()` de `next/server` para tareas post-respuesta; `@vercel/functions` quedó sin imports tras la migración |

Scripts: `dev`, `build`, `start`, `lint`.

### Estructura
| Ruta | Contenido |
|---|---|
| `app/` | App Router: `page.tsx` (home 9 bloques), `tienda/`, `product/[id]/`, `blog/` + `blog/[slug]/`, `checkout/` (`page`, `success`, `failure`), legales (`privacidad`, `terminos`, `devoluciones`), `layout.tsx`, `template.tsx` (transición CSS pura), `globals.css`, `sitemap.ts`, `icon.svg`/`favicon.ico`/`icon.png` |
| `app/api/` | `checkout` (preference MP), `process-payment`, `webhooks/mercadopago`, `webhooks/payment-success`, `shipping-rates` (Skydropx), `validate-coupon`, `reviews`, `vendido`, `debug-sheet`, `debug-skydropx` |
| `components/` | Navbar, Footer, HeroSection, CartDrawer, TiendaClient, ProductCard, ProductGalleryClient, CTABanner, CollectionIndex, BlogCard, ReadingProgress, Marquee, NewsletterForm, WhatsAppButton, MercadoPago*, AddressAutocomplete, ProductSearch, ProductReviews + **kit** `ui/` (Button, Reveal, ImageReveal, SectionHeader, Overline, Chip, Accordion, EmptyState, `useMounted`) |
| `lib/` | `googleSheets.ts` (CMS), `mercadopago.ts`, `skydropx.ts` (OAuth2 + cotización + envío), `shipping.ts` (constantes de envío, fuente única: `SHIPPING_FLAT`/`FREE_SHIPPING_THRESHOLD`/`FREE_SHIPPING_CODE`), `blog.ts` (4 artículos estáticos), `types.ts` |
| `store/` | `cartStore.ts` (persist `zoa-cart`), `checkoutStore.ts` (quick buy + dirección) |
| `design-system/` | `zoa-boutique/MASTER.md` + `pages/{home,tienda,producto,checkout,blog}.md` |
| `public/` | `logozoa.svg` (wordmark 1485×460 ≈ 3.23:1), `bannerzoa.png`, `blog-*.png` |

### Flujo de datos e integraciones
1. **Google Sheets = CMS.** Lectura del CSV público (pestaña `Oficial`, columnas A–T) en `lib/googleSheets.ts`; ISR `revalidate = 60`. `getProducts` / `getGroupedProducts` (agrupa por nombre → variantes de color + `skus`) / `getGroupedProductById`. El ID de producto es siempre `NUM` (col. A); `SKU` es solo display. `getBestSellers(limit)` cruza la pestaña `Ventas` (vía gviz, `revalidate = 300`) con el catálogo para el destacado del navbar; ante cualquier fallo devuelve `[]` y la UI cae al poster estático.
2. **Escrituras al Sheet vía Google Apps Script** (`APPS_SCRIPT_URL`): `deductStock` (post-pago) y `logSale` (pestaña «Ventas»).
3. **Mercado Pago:** Checkout Pro (`/api/checkout`) + Payment Brick en el drawer/checkout; webhooks MP y `payment-success` (`/api/webhooks/*`) disparan stock, venta, email y creación de envío Skydropx.
4. **Skydropx:** cotización (`/api/shipping-rates`) y creación de envíos desde el webhook; credenciales OAuth2.
5. **Correos:** Resend en webhooks/reseñas.

### Variables de entorno requeridas (definidas en `.env.local` / Railway; `.env*` gitignored)
`GOOGLE_SHEET_ID` (obligatoria; se eliminó hardcode en `2ce8246`), `GOOGLE_SHEET_NAME` (default `Oficial`), `GOOGLE_SHEET_VENTAS` (default `Ventas`; ver §7.10), `APPS_SCRIPT_URL`, `MERCADOPAGO_ACCESS_TOKEN`, `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` **y** `NEXT_PUBLIC_MP_PUBLIC_KEY` (ambas con el **mismo** valor válido `APP_USR-…`/`TEST-…`; el código hace fallback cruzado y `next.config.ts` inyecta ambas), `NEXT_PUBLIC_BASE_URL` / `NEXT_PUBLIC_SITE_URL` (`||` fallback `https://zoa.mx`; toleran valor vacío desde 2026-09-18), `SKYDROPX_API_KEY` / `SKYDROPX_API_SECRET` / `SKYDROPX_PICKUP_*`, `RESEND_API_KEY`.

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
- **Carrito/Checkout:** `CartDrawer` (vistas `cart`/`checkout`), cupones (`/api/validate-coupon`), VIP «PROBADOR» (depósito $300), envío $150 / gratis ≥ $3,000 (constantes únicas en `lib/shipping.ts`), **código secreto de envío gratis «ENTREAMIGAS»** (mismo campo de código promo; sin stacking con cupones/VIP; se resuelve en cliente y servidor), Payment Brick + Checkout Pro, `success`/`failure`.
- **Globales:** `Navbar` (logo SVG máscara, mega menú único full-bleed de 3 grupos, búsqueda, drawer móvil, navbar sólida con paneles, destacado **«Lo más vendido»**: crossfade de las 4 prendas más vendidas con enlace a PDP y avance cada 4 s), `Footer` (logo watermark, newsletter → WhatsApp), FAB WhatsApp, `CTABanner`, legales, `sitemap.ts`.

**Verificación de la sesión (2026-09-17, feature «Lo más vendido»):** `tsc --noEmit` ✅, `eslint` de los 4 archivos ✅, `npm run build` ✅ (151 páginas, ISR 1m) y QA con Chrome headless vía CDP sobre `npm run start` ✅ (4 slides, rotación 0→1 a los ~5.2 s, opacidades correctas, imágenes 320×426 cargan). Procesos de QA cerrados.

**Verificación de la sesión (2026-09-18, código secreto «ENTREAMIGAS»):** `npx tsc --noEmit` ✅ exit 0; `npm run build` ✅ exit 0 (151 páginas, ISR 1m/1y); la feature no aportaba errores de lint. Estado commiteado originalmente en `c1c7c27`, reescrito el mismo día para expulsar `.tmp-qa/`; hash vigente `8e0fe03` según `git log`.

**Cierre de sesión (2026-09-18):** `npm run lint` ✅ en 0 (corregidos los 6 errores preexistentes y `.tmp-qa/**` ignorado en ESLint y git); fix del chip de cupón en `components/CartDrawer.tsx` (se renderiza con el `vipCode` persistido, la X de quitar cupón aparece tras recargar; sigue habiendo un solo cupón a la vez, anti-stacking) y `vipCode` null-safe en `app/api/webhooks/payment-success/route.ts`. Todo lo anterior quedó commiteado en `7f3ce9d`.

**Working tree 2026-09-18 (sin commitear, 8 archivos):** migración a **Railway** + fix de la tarjeta MP — `app/api/process-payment/route.ts` (`after()` de `next/server` en vez de `waitUntil`; el envío Skydropx se crea síncrono antes de responder; `maxDuration` marcado como Vercel-only ignorado en Railway), `app/api/checkout/route.ts`, `app/api/webhooks/mercadopago/route.ts`, `app/layout.tsx` (`??`→`||` en base URLs, tolera env vacía) y fallback cruzado de la llave pública en `next.config.ts`, `app/checkout/page.tsx`, `components/MercadoPagoWrapper.tsx` y `components/MercadoPagoBrick.tsx`. Detalle en §6; variables pendientes en Railway, §7.13.

## 5. Decisiones clave (ADR)

| ID | Fecha | Decisión | Motivo / alternativas |
|---|---|---|---|
| **ADR-01** | 2026-09-17 | **Logo SVG monocromo vía CSS mask.** `public/logozoa.svg` se pinta con `.zoa-logo` (`background-color: currentColor` + `mask-image`), heredando `--nc`/`--nc-hover` en navbar y color explícito (slate/forest) en drawer/footer. Tamaños: 71×22 <lg / 84×26 ≥lg; watermark footer `.zoa-logo-footer` alto `clamp(4rem,9.6vw,8.8rem)` y ancho ×3.2283 (sin CLS). Reemplaza el wordmark Bodoni en texto. | Un solo asset recoloreable, sin duplicar versiones claro/oscuro ni tocar el DOM del logo. Descartado: dos assets fijos por contexto y logo como `<Image>`. |
| **ADR-02** | 2026-09-17 | **Navbar sólida obligatoria con panel desplegado + retención anti-flash.** Un panel (mega menú o búsqueda) siempre pinta la navbar sólida; el estado se retiene ~250 ms durante la salida vía `menuExiting`/`searchExiting` + `onExitComplete`. Cierres centralizados `closeMenu`/`closeSearch`. Un único booleano `solidNav = scrolled \|\| !isHome \|\| panelOpen` gobierna clases, `--nc` y `--nc-hover` (nunca divergen); atributo observable `data-panel` + reglas en `globals.css`. | Evita el flash/apagado prematuro sobre el video del hero al cerrar o cambiar de panel. Descartado: cambiar a transparente en `exit` (parpadeo) y desmontar sin animación. |
| **ADR-03** | 2026-09-17 | **Favicons regenerados desde el logo:** `app/icon.svg` nuevo (monocromo `#2B3C42`, variante dark `#FFF7F5`), `favicon.ico` e `icon.png` regenerados. | Coherencia de marca; los anteriores eran del scaffold. |
| **ADR-04** | 2026-09-17 (`c12e10a`) | **Política de hidratación v4.3 (heredada y vigente):** prohibido `useReducedMotion()` directo; patrón `rm = mounted && reduceMotion`; `template.tsx` CSS puro; datos de `localStorage` post-mount (`isMounted`); único `suppressHydrationWarning` justificado en `<html>`. | Eliminar warnings de mismatch de framer-motion/SSR. Alternativa descartada: `suppressHydrationWarning` como parche. |
| **ADR-05** | 2026-09-17 (`7318aaf`, v4.2) | **Reestructura navbar v4.2:** Blog y «Rastrear envío» viven dentro del grupo **Tienda** (no en la fila); mega menú único por grupo activo; hover forest solo con nav sólido; Cloudinary `ppo6ze2s` como cloud activo (incluido el poster del mega menú). | Simplificar la fila superior y unificar paneles. |
| **ADR-06** | 2026-09-14 (`2ce8246`) | **Google Sheets como CMS sin hardcode:** `GOOGLE_SHEET_ID` obligatoria por env (error explícito si falta); lectura por CSV público (evita la inferencia de tipos de gviz que nullifica SKUs); escrituras vía Apps Script. | Seguridad y robustez del parseo de datos. |
| **ADR-07** | 2026-09-17 (`c1c7c27`) | **Lectura de «Ventas» para best sellers:** la pestaña se lee con `gviz/tq?tqx=out:csv&sheet=Ventas` (el endpoint `/export?format=csv&sheet=` ignora pestañas que no son la primera y devuelve la `Oficial` en silencio; se valida el header "Fecha"+"Productos" y, si no coincide, se devuelve `[]`). Los ítems se parsean escaneando **todas** las celdas con regex `/^(.+?)\s*\(([^)]+)\)\s*x(\d+)/` (el layout real tiene 13 columnas y el Apps Script escribe los ítems en la última, no en la 11.ª del header), separados por `\|`; nombres normalizados (minúsculas, sin acentos). Se cruza contra `getGroupedProducts()`, se omiten prendas sin foto o fuera de catálogo, y `layout.tsx` (async) llama `getBestSellers(4).catch(() => [])` para que un fallo nunca tumbe el render: la UI cae al poster `two-models-walking`. | Robustez ante hojas compartidas/renombradas y cambios de layout del log; el fallback estático es obligatorio. Descartado: índice de columna fijo e `/export` con `sheet=`. |
| **ADR-08** | 2026-09-18 (`c1c7c27`) | **Código secreto de envío gratis «ENTREAMIGAS» + fuente única de constantes de envío en `lib/shipping.ts`:** se extraen `SHIPPING_FLAT = 150`, `FREE_SHIPPING_THRESHOLD = 3000` y `FREE_SHIPPING_CODE = "ENTREAMIGAS"` y los importan `store/cartStore.ts` (`isFreeShipping()`, `shipping()` = 0 con el código), `components/CartDrawer.tsx` (resuelve el código **localmente**, sin llamar a `/api/validate-coupon` ni a Apps Script; anti-stacking: un solo código a la vez; barra al 100% + chip «— envío gratis»), `app/checkout/page.tsx` (`activeCode`, cálculo de envío y `vipCode: activeCode` al API), `app/api/checkout/route.ts` (Checkout Pro: `isFreeShipping` sin activar la rama VIP) y `app/api/webhooks/payment-success/route.ts` (recibo muestra «Gratis»). El código viaja en el mismo campo `vipCode` que el VIP «PROBADOR». | La duplicación de `150`/`3000` en 5 sitios causaba drift entre cliente y servidor; centralizar garantiza totales consistentes. Descartado: validar el código en Apps Script (es una constante de UI, no un cupón) y permitir stacking con cupones de descuento. |

## 6. Historial reciente

| Hash | Fecha | Mensaje | Nota |
|---|---|---|---|
| — (working tree) | 2026-09-18 | Deploy: Railway + migración `waitUntil`→`after()` | **Sin commitear** (ver `git status`; 8 archivos junto con la fila siguiente): el deploy objetivo pasa de Vercel a **Railway** (self-hosted); `app/api/process-payment/route.ts` sustituye `waitUntil` de `@vercel/functions` por `after()` de `next/server` — el envío Skydropx ahora se crea síncrono antes de responder y el email sale en `after()`; `maxDuration = 60` se conserva marcado como Vercel-only ignorado en Railway. `@vercel/functions` queda sin imports en `app/` (sigue en `package.json`). |
| — (working tree) | 2026-09-18 | Fix: la tarjeta MP no renderizaba en `/checkout` + fallback cruzado de llave pública + `\|\|` en env vacías | **Sin commitear** (ver `git status`): `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` tenía un Application ID inválido en vez de la public key `APP_USR-…`, por lo que el Brick no montaba; el código ahora hace fallback cruzado entre `NEXT_PUBLIC_MP_PUBLIC_KEY` y `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` (`next.config.ts`, `app/checkout/page.tsx`, `components/MercadoPagoWrapper.tsx`, `components/MercadoPagoBrick.tsx`); `??`→`\|\|` para tolerar variables vacías (`NEXT_PUBLIC_BASE_URL` en `app/layout.tsx` y `app/api/checkout/route.ts`; `NEXT_PUBLIC_SITE_URL` en `app/api/webhooks/mercadopago/route.ts`). |
| `7f3ce9d` | 2026-09-18 | Fix: quitar cupon aplicado, hardening vipCode, lint limpio y docs | 10 archivos: fix del chip de cupón (`components/CartDrawer.tsx`), `vipCode` null-safe (`app/api/webhooks/payment-success/route.ts`), lint en 0 (`lib/skydropx.ts`, `app/api/debug-skydropx/route.ts`, `app/api/process-payment/route.ts`, `app/api/reviews/route.ts`), ignore de `.tmp-qa` (`eslint.config.mjs`, `.gitignore`) y docs (`AGENTS.md`, `MEMORIA.md`). HEAD y `origin/main`. |
| — (reescritura de historia) | 2026-09-18 | Rewrite: expulsar `.tmp-qa/` de `main` | `c1c7c27` reescrito localmente (`git reset --soft HEAD~1` + `git rm -r --cached .tmp-qa` + commit + force-push con lease); los 676 archivos del perfil Chrome salen del árbol de `main`. Acciones manuales restantes: purga de objetos colgantes en GitHub (solo si el repo es público) y rotación de credenciales — §7.1. |
| `8e0fe03` (original `c1c7c27`) | 2026-09-18 | Add: codigo secreto — **reescrito el mismo día** | El hash original `c1c7c27` fue **reescrito** con `git reset --soft HEAD~1` + `git rm -r --cached .tmp-qa` + commit + force-push con lease para expulsar `.tmp-qa/`; el hash vigente es `8e0fe03` según `git log` (originalmente estaba en `origin/main`). Ya sin `.tmp-qa/`, el commit son ~13 archivos de app/docs: `lib/shipping.ts` (nuevo), `store/cartStore.ts`, `components/CartDrawer.tsx`, `app/checkout/page.tsx`, `app/api/checkout/route.ts`, `app/api/webhooks/payment-success/route.ts` (código secreto «ENTREAMIGAS», ADR-08) + `lib/googleSheets.ts`, `lib/types.ts`, `app/layout.tsx`, `components/Navbar.tsx` («Lo más vendido», ADR-07) + `MASTER.md`, `MEMORIA.md` y `AGENTS.md`. El original incluía 676 archivos de `.tmp-qa/` (675 de `chrome-profile/` + `chrome.log`) con artefactos sensibles (Cookies, Login Data, History, Session Storage) — ver §7.1. |
| `8e0fe03` (original `c1c7c27`) | 2026-09-17 | Feature: «Lo más vendido» en el destacado del mega menú de Colecciones | **Commiteada en el commit de «ENTREAMIGAS»** (original `c1c7c27`, reescrito el 2026-09-18; hash vigente `8e0fe03`). 5 archivos: `lib/types.ts` (`BestSeller`), `lib/googleSheets.ts` (`fetchVentasRows`/`normalizeName`/`countSoldUnits`/`getBestSellers` + `GOOGLE_SHEET_VENTAS`), `app/layout.tsx` (async + prop), `components/Navbar.tsx` (crossfade 4 s, reduced motion, fallback al poster) y `MASTER.md` §6.0. Top 4 en vivo: `90` Pantalón de Vestir Recto (14 u), `51` Blusa Satinada Cuello Halter (11 u), `52` Vestido Midi Punto Negro (3 u), `77` Blusa Crop de Popelín con Cuello Solapa (3 u). |
| `23f9a7d` | 2026-09-17 | Feature: Logo SVG (navbar/footer) y navbar solida con paneles desplegados | 7 archivos (`app/favicon.ico`, `app/globals.css`, `app/icon.png`, `app/icon.svg`, `components/Footer.tsx`, `components/Navbar.tsx`, `MASTER.md`). Integra el logo vía `.zoa-logo` + navbar sólida + ADR-02/03. |
| `c12e10a` | 2026-09-17 | Feature: Arrgelar padding en botones del hero | 39 archivos: **añade `public/logozoa.svg`**, el fix de hidratación v4.3 (`useMounted.ts`, `template.tsx` CSS), MASTER/pages y el fix de padding del hero. El mensaje no refleja todo el contenido. |
| `7318aaf` | 2026-09-17 | Update: New version Zoa Boutique V3 | Rediseño «EDITORIAL ATELIER»: MASTER v4 + overrides, kit `components/ui/`, Home/Tienda/PDP/Blog/Checkout rediseñados (47 archivos, +4712/−1842). |
| `2ce8246` | 2026-09-14 | fix: remove hardcoded Google Sheets ID, require GOOGLE_SHEET_ID env var | ADR-06. |
| `d46a04e` | 2026-09-14 | Initial commit | Base del proyecto. |

## 7. Pendientes / TODOs

1. **`.tmp-qa/` — REMEDIADO (2026-09-18).** Los 676 archivos (675 de `chrome-profile/` + `chrome.log`) con artefactos sensibles del perfil Chrome (Cookies, Login Data, History, Session Storage) ya **no están en el árbol de `main`**: `c1c7c27` fue reescrito localmente (`git reset --soft HEAD~1` + `git rm -r --cached .tmp-qa` + commit + force-push con lease) y el hash vigente es `8e0fe03` según `git log`. `.tmp-qa/` queda ignorado en git (`.gitignore`) y en ESLint (`globalIgnores`). Quedan 2 acciones **manuales** no automatizables: (a) purgar los objetos colgantes de GitHub vía soporte **solo si el repo es público** (el force-push no los elimina en servidores de terceros); (b) **rotar credenciales/sesiones** de las cuentas usadas en ese perfil (Google, MercadoPago, Vercel, Railway, GitHub, Skydropx, Resend) por precaución. No volver a commitear `.tmp-qa/`.
2. **Rutas `/colecciones/*` inexistentes:** `Footer.tsx`, `app/sitemap.ts` y enlaces dentro de los artículos de `lib/blog.ts` apuntan a `/colecciones/<slug>`, pero **no existe `app/colecciones/`** (404 y URLs inválidas en el sitemap). Unificar a `/tienda?coleccion=<slug>` o crear las rutas.
3. **`/checkout/pending` referenciada pero inexistente:** `app/api/checkout/route.ts` declara `back_urls.pending` → `/checkout/pending`, y no hay página `app/checkout/pending/`. Añadirla o redirigir a `failure`.
4. **`README.md`**: sigue siendo el boilerplate de `create-next-app`; pendiente documentación real del proyecto.
5. **Assets sin referencias (candidatos a limpieza, verificado 0 usos):** `public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` y los logos legacy de raíz `zoa_logo_dark.png` / `zoa_logo_white.png` (trackeados).
6. **Rutas debug expuestas:** `app/api/debug-sheet` y `app/api/debug-skydropx` accesibles en producción; evaluar protección o retiro.
7. **Verificación:** ejecutar `tsc`/`build`/QA de hidratación («0 warnings», §8.6 MASTER) tras cualquier cambio; última referencia verde: build 2026-09-18 con «ENTREAMIGAS» (151 páginas). **Pendiente:** registrar `npx tsc --noEmit` + `npm run lint` + `npm run build` de los cambios de Railway/MP en working tree (§4).
8. **«Lo más vendido» — RESUELTO:** commiteada y pusheada junto con el código secreto (ADR-07 y ADR-08) en `c1c7c27`, hoy reescrito el 2026-09-18; hash vigente `8e0fe03`.
9. **Pedidos `CARMELI-` en la hoja `Ventas`:** otro proyecto/cuenta comparte la hoja y sus pedidos **sí se cuentan hoy**. Decidir si `getBestSellers` debe filtrar solo `ZOA-`/`TIENDA-` o mantener el conteo global.
10. **`GOOGLE_SHEET_VENTAS` — RESUELTO (2026-09-18):** documentada en la lista de env vars (§2; default `Ventas`, se lee en `lib/googleSheets.ts`).
11. **Lint — RESUELTO (2026-09-18):** corregidos los 6 errores preexistentes (`no-explicit-any` en `app/api/debug-skydropx/route.ts`, `app/api/process-payment/route.ts` y `lib/skydropx.ts`; `baseUrl` sin uso en `app/api/reviews/route.ts`) y `.tmp-qa/**` se ignora en `eslint.config.mjs` (`globalIgnores`) y en `.gitignore`. `npm run lint` ✅ en 0. Commiteado en `7f3ce9d`.
12. **`vipCode` null-safe en `payment-success` — RESUELTO (2026-09-18):** `vipCode?: string` + `(vipCode ?? "").trim()` en `buildCustomerEmail` y `vipCode = ""` por defecto al desestructurar el body de `app/api/webhooks/payment-success/route.ts` (endpoint público). Commiteado en `7f3ce9d`.
13. **Railway — variables de entorno (pendiente del usuario):** en el panel de Railway, definir `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` con la **misma** public key válida `APP_USR-…` que `NEXT_PUBLIC_MP_PUBLIC_KEY` (en local una de las dos tenía un Application ID inválido → la tarjeta no renderizaba en `/checkout`) y `NEXT_PUBLIC_BASE_URL` con el dominio público (**ya no vacía**; el código cae a `https://zoa.mx` con `||`). Revisar también `NEXT_PUBLIC_SITE_URL`. Tras cambiarlas hay que **redeployar** (los `NEXT_PUBLIC_*` se inlinean en build).
14. **`@vercel/functions` sin usos:** tras la migración de `process-payment` a `after()`, la dependencia ya no se importa en `app/`/`components/`/`lib/` pero sigue en `package.json`; retirarla en una limpieza futura (verificado 2026-09-18).

## 8. Fuentes de verdad

1. **Design system:** `design-system/zoa-boutique/MASTER.md` (v4.3) + `design-system/zoa-boutique/pages/*.md`.
2. **Código ejecutable:** `app/globals.css` (tokens/utilidades) y `components/ui/` (kit obligatorio para superficies nuevas).
3. **Datos de catálogo:** Google Sheet, pestaña `Oficial` (columnas A–T) vía `lib/googleSheets.ts`; pestaña `Ventas` (log del Apps Script) solo para `getBestSellers`.
4. **Repo remoto / deploy:** `origin` = GitHub `EduardoGonzalez26/Zoa-boutique` (rama `main`); deploy en **Railway** (self-hosted; sin `waitUntil`/`maxDuration` de Vercel).
5. **Este archivo:** contexto de continuidad entre sesiones; se actualiza al cierre de cada sesión con estado, ADRs y pendientes.
