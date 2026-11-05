# MEMORIA — Zoa Boutique

> Documento de continuidad para agentes y equipo. Registra estado, decisiones y pendientes entre sesiones.
> **Última actualización:** 2026-11-05 (revisión documental; snapshot ~11:00 America/Mexico_City).
> **Rama:** `main`; **HEAD = `2b338dd`** («Feature: promociones de temporada, cupones y accesibilidad», 2026-10-26). `origin/main` = `2b338dd`; working tree **sucio** por una sesión de código **en curso** (no commiteada). Esta actualización reconcilia la memoria que seguía en `722ddd7` con el HEAD actual.
> **Fuente de verdad:** el código y `design-system/zoa-boutique/MASTER.md` (v4.3). Este archivo y `AGENTS.md` dan continuidad; no duplican el design system ni el detalle de implementación.
> **Aviso:** lo marcado como **“en curso”** no está terminado ni verificado. No lo presentes como hecho hasta que se commitee y se ejecuten las verificaciones.

---

## 1. Resumen ejecutivo

- **Qué es:** Zoa Boutique, e-commerce de moda femenina mexicana (`zoa.mx`), con catálogo en Google Sheets, pagos con Mercado Pago, envíos con Skydropx y correos con Resend.
- **Repo:** `https://github.com/EduardoGonzalez26/Zoa-boutique` (rama `main`).
- **Deploy:** **Railway** (self-hosted). Carmeli, la marca hermana, va en **Vercel**; no compartir runtime ni configuración de deploy.
- **Estado committed (`2b338dd`):** frontend completo bajo «EDITORIAL ATELIER» v4.3, promociones de temporada, cupones de campaña, accesibilidad/legales y limpieza de assets. Verificación registrada en el commit: `tsc --noEmit`, `lint` y `build` **173/173**.
- **Estado del working tree (2026-11-05):** sesión de endurecimiento **en curso** (precio autoritativo para todos los pedidos, consentimiento persistido, idempotencia, geocode, auth de endpoints internos, sitemap/enlaces, `checkout/pending`, headers de seguridad, retiro de Checkout Pro). Sin commit y sin verificación final.
- **Relación con Carmeli:** marcas/tiendas separadas con **inventario compartido** (mismo Google Sheet/Apps Script); los pedidos se distinguen por prefijo (`ZOA-…`/`CARMELI-…`).

## 2. Stack y arquitectura

### Stack real (`package.json`)

| Capa | Tecnología |
|---|---|
| Framework | Next.js `16.1.6` (App Router) + React `19.2.3` + TypeScript `^5` |
| Estilos | Tailwind CSS `^4` + `@tailwindcss/postcss` (tokens en `app/globals.css`) |
| Animación | Framer Motion `^12.35.2` |
| Estado | Zustand `^5.0.11` (`persist` en carrito) |
| UI | `lucide-react` + kit propio `components/ui/` |
| Pagos | `mercadopago` `^2.12.0` + `@mercadopago/sdk-react` (Payment Brick) |
| Emails | `resend` + `@react-email/components` |
| Infra | **Railway** + `after()` de `next/server`; `@vercel/functions` sigue en `package.json` sin imports |

Scripts: `dev`, `build`, `start`, `lint`. No hay framework de tests.

### Estructura

| Ruta | Contenido |
|---|---|
| `app/` | `page.tsx` (home: 8 bloques fijos + promo condicional), `tienda/`, `product/[id]/`, `blog/` + `blog/[slug]/`, `checkout/` (`page`, `success`, `failure`; `pending` en curso), legales (`privacidad`, `terminos`, `devoluciones`, `cookies`, `reembolsos`), `layout.tsx`, `template.tsx`, `globals.css`, `not-found.tsx`, `sitemap.ts` |
| `app/api/` | `process-payment`, `webhooks/mercadopago`, `webhooks/payment-success`, `validate-coupon`, `reviews`, `vendido`, `shipping-rates`, `debug-sheet`, `debug-skydropx`; en curso: `geocode`, `_lib/internal`; `checkout` (Checkout Pro) se retira en el working tree |
| `components/` | Navbar, Footer, HeroSection, CartDrawer, TiendaClient, ProductCard, ProductGalleryClient, CTABanner, CollectionIndex, BlogCard, ReadingProgress, Marquee, NewsletterForm, WhatsAppButton, MercadoPago*, AddressAutocomplete, ProductSearch, ProductReviews; `PromoBanner`; kit `ui/` (Button, Reveal, ImageReveal, SectionHeader, Overline, Chip, Accordion, EmptyState, `PromoCode`, `useFocusTrap`, `useMounted`) |
| `lib/` | `googleSheets.ts` (CMS + escrituras), `mercadopago.ts`, `mercadopagoPublicKey.ts`, `skydropx.ts`, `shipping.ts`, `pricing.ts`, `promotions.ts`, `blog.ts`, `types.ts` |
| `store/` | `cartStore.ts` (persist `zoa-cart`; cupón, `couponScope`, VIP), `checkoutStore.ts` |
| `design-system/` | `zoa-boutique/MASTER.md` + `pages/*.md` (fuente de verdad visual) |
| `public/` | `logozoa.svg`, `bannerzoa.png`, `blog-*.png`, favicons (ADR-12), `promos/{amor,madres,buenfin,navidad}.webp` |

### Flujo de datos

1. **Google Sheets = CMS.** Lectura CSV pública de `Oficial` (columnas A–T) en `lib/googleSheets.ts`; ISR 60 s. `NUM` es el ID; `SKU` es display. `getBestSellers()` cruza `Ventas` (gviz, ISR 300 s) con el catálogo.
2. **Escrituras:** Google Apps Script (`APPS_SCRIPT_URL`) para `deductStock` y `logSale`. Compartido con Carmeli.
3. **Promociones:** `lib/promotions.ts` describe las 4 campañas y resuelve la vigente en `America/Mexico_City`; módulo **server-only**. La home usa `getActivePromo()`.
4. **Precios:** `lib/pricing.ts` calcula subtotal, base elegible, descuento, envío y total. `lib/shipping.ts` es la fuente única de `SHIPPING_FLAT=150`, `FREE_SHIPPING_THRESHOLD=3000`, `FREE_SHIPPING_CODE="ENTREAMIGAS"`.
5. **Mercado Pago:** Payment Brick → `/api/process-payment`; webhook MP y `payment-success` para stock, venta, correo y Skydropx. Checkout Pro existía en HEAD; el working tree lo retira (en curso).
6. **Skydropx:** cotización y creación de envíos desde el backend, credenciales OAuth2.
7. **Resend:** recibo a clienta, aviso interno y reseñas.

### Variables de entorno

En `.env.local`/Railway; `.env*` gitignored.

**Requeridas (HEAD):** `GOOGLE_SHEET_ID` (obligatoria), `GOOGLE_SHEET_NAME` (default `Oficial`), `GOOGLE_SHEET_VENTAS` (default `Ventas`), `APPS_SCRIPT_URL`, `MERCADOPAGO_ACCESS_TOKEN`, `NEXT_PUBLIC_MP_PUBLIC_KEY` y `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` (misma Public Key válida `APP_USR-…`/`TEST-…`; `lib/mercadopagoPublicKey.ts` ignora Application IDs/UUID y vacíos), `NEXT_PUBLIC_BASE_URL` / `NEXT_PUBLIC_SITE_URL` (fallback `https://zoa.mx`), `SKYDROPX_API_KEY`/`SKYDROPX_API_SECRET`/`SKYDROPX_PICKUP_*`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (fallback `Zoa <hola@zoa.mx>`).

**Solo development:** `PROMO_PREVIEW=<slug>` y `PROMO_NOW=<ISO>` (se ignoran en production).

**En curso (working tree; confirmar antes de deploy):** `INTERNAL_API_SECRET` (debug/vendido), `INTERNAL_WEBHOOK_SECRET` (correo interno), `MERCADOPAGO_WEBHOOK_SECRET` (firma del webhook), `GEOCODE_USER_AGENT` (opcional, proxy Nominatim).

## 3. Design system

- **Fuente de verdad:** `design-system/zoa-boutique/MASTER.md` **v4.3 «EDITORIAL ATELIER»** + `pages/`; ejecutable en `app/globals.css` y `components/ui/`.
- **Paleta:** arena `#EAE9E5`, slate `#2B3C42`, forest `#003628` (acción; 1 banda full-bleed/página), wine `#420D0D` (máx. 1 banda/página; la promo condicional), superficie `#FFF7F5`. Prohibido `#FFFFFF`.
- **Tipografías:** Archivo + Bodoni Moda.
- **A11y 2026-10-26:** `--color-zoa-slate-60` sube a alfa 0.75; `--color-zoa-line-strong` a 0.60; nuevo `--color-zoa-forest-55` para bordes de control; `--color-zoa-line-inverse-35` a 0.45. `PromoCode` copia con Clipboard API + fallback; `useFocusTrap` atrapa foco en drawer/navbar móvil; skip link en `layout.tsx`.
- **Regla de hidratación:** `useReducedMotion()` nunca directo en render; `rm = mounted && reduceMotion`; `template.tsx` CSS puro; 0 warnings como invariante.

## 4. Estado actual

### 4.1 Committed en `2b338dd` (2026-10-26)

**Promociones y precios**
- `lib/promotions.ts`: 4 campañas anuales (`amor`, `madres`, `buenfin`, `navidad`), 15% OFF, ventanas inclusivas en `America/Mexico_City`, `navidad` cruza el año; `PROMO_PREVIEW`/`PROMO_NOW` solo en development.
- `components/PromoBanner.tsx`: banda wine condicional en la home, después de Colecciones y antes de «Lo nuevo»; fuera de temporada no se renderiza. `components/ui/PromoCode.tsx` copia el código con feedback accesible.
- `lib/pricing.ts`: desglose de pedido (subtotal, base elegible, descuento, envío, total). En HEAD el servidor lo usa en `/api/process-payment` cuando hay **código de campaña**, releyendo catálogo y comparando total (±1 MXN).
- Checkout/carrito: `couponScope` (`"all"`/`"eligible"`) persistido; campañas excluyen piezas con `discount` propio; `/api/validate-coupon` resuelve campañas localmente y deja los cupones legacy en Apps Script; recibo con descuento.
- `public/promos/*.webp`: **placeholders** (mismo arte base, según MASTER/pages); sustituir por arte final conservando nombres y ajustar focal points.
- **Discrepancia documentada:** `design-system/zoa-boutique/pages/home.md` aún dice «Pendiente backend» para cupones/checkout, pero `2b338dd` ya implementa la validación de campaña en `lib/pricing.ts` + `process-payment`. **Fuente de verdad: el código**; actualizar esa página en la próxima sesión de diseño (no cambiar el código para que coincida con el doc).

**Accesibilidad y legales**
- `app/layout.tsx`: skip link «Saltar al contenido», `main#contenido` enfocable; `useFocusTrap` en `CartDrawer` y drawer móvil de `Navbar`.
- Contraste: tokens ajustados (WCAG AA), `Marquee` pausa al enfocar, `text-shadow` en navbar transparente, `PromoCode` con foco inverse.
- Nuevas páginas `app/cookies/page.tsx` y `app/reembolsos/page.tsx`; actualización de `privacidad`, `terminos`, `devoluciones`; enlaces en Footer; consentimiento obligatorio en checkout/drawer (checkbox + enlaces) y microcopy en newsletter/reseñas.
- `AddressAutocomplete`: búsqueda explícita con botón/Enter, fallback a captura manual; ya no bloquea el checkout si falla el servicio.

**Assets**
- Nuevos: `public/promos/{amor,madres,buenfin,navidad}.webp`.
- Eliminados: `public/{file,globe,next,vercel,window}.svg`, `zoa_logo_dark.png`, `zoa_logo_white.png`.
- OG image del layout: `/bannerzoa.png`.

**Verificación registrada en el commit/sesión:** `npx tsc --noEmit` ✅, `npm run lint` ✅, `npm run build` ✅ **173/173**. No se re-ejecutó la trilogía sobre el working tree en esta revisión documental.

### 4.2 Working tree en curso (2026-11-05, sin commit)

> Lista de intención, no de resultados. El agente de código puede seguir editando; `git status` manda.

- **Precio autoritativo para todos los pedidos:** catálogo/stock frescos (`getProducts({ fresh: true })`), validación de tallas/cantidades/stock, recálculo con `lib/pricing.ts`, 409 si el total del cliente difiere > 1 MXN; cupones legacy validados en servidor; VIP y envío gratis integrados en el desglose.
- **Consentimiento persistido:** `SaleConsent` viaja a `process-payment`, metadata de MP y `logSale`; el Apps Script debe tener columnas para `consent`, `orderId`, `brand`, `subtotal`, `discount`, `shipping`.
- **Idempotencia:** `orderId` (`ZOA-<paymentId>`) + marca en `deductStock`/`logSale`; estado `pending_fulfillment` si falla stock/log; webhook con dedupe en memoria + consulta a `Ventas`; **depende de deduplicación atómica en Apps Script**.
- **Geocode:** nuevo `app/api/geocode/route.ts` (proxy Nominatim, rate limit, caché, User-Agent); se corrigió el texto de cookies para decir “proxy interno”.
- **Hardening:** `app/api/_lib/internal.ts`; `INTERNAL_API_SECRET` en debug/vendido; `INTERNAL_WEBHOOK_SECRET` en `payment-success`; verificación de firma MP; `next.config.ts` con `poweredByHeader:false`, `X-Frame-Options`, `frame-ancestors`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS.
- **Rutas/enlaces:** `sitemap.ts` elimina `/colecciones/*` y añade `/cookies` y `/reembolsos`; `lib/blog.ts` migra enlaces a `/tienda?coleccion=…`; `app/checkout/pending/` nuevo; Footer ya usaba `/tienda?coleccion=…` desde `2b338dd`.
- **Retiro de Checkout Pro:** `app/api/checkout/route.ts` aparece eliminado; confirmar que el flujo queda Brick-only y que no quedan `back_urls` ni referencias en docs.
- **Best sellers:** filtra pedidos `ZOA-…`/`ZOA-TIENDA-…` y excluye estados no computables; fallback a la hoja completa si no hay filas nuevas.
- **Pendiente de verificación:** `tsc`, lint, build, pruebas de webhook duplicado, Apps Script actualizado, envs en Railway, QA de geocode y de headers.

## 5. Decisiones clave (ADR)

| ID | Fecha | Decisión | Motivo / estado |
|---|---|---|---|
| **ADR-01** | 2026-09-17 | **Logo SVG monocromo vía CSS mask** (`public/logozoa.svg`, `.zoa-logo`), recoloreable con `currentColor`; tamaños 71×22/84×26 y watermark footer. | Un asset, sin duplicar versiones; descartado logo como `<Image>` o dos assets fijos. |
| **ADR-02** | 2026-09-17 | **Navbar sólida con panel desplegado + retención anti-flash** (`menuExiting`/`searchExiting`, `solidNav` único, `data-panel`). | Evita flash al cerrar/cambiar paneles; descartado cambiar a transparente en `exit`. |
| **ADR-03** | 2026-09-17 | **Favicons desde el logo** (`app/icon.svg`, ICO/PNG). | Coherencia de marca; superseded por ADR-09/ADR-12. |
| **ADR-04** | 2026-09-17 | **Política de hidratación v4.3:** `rm = mounted && reduceMotion`, `template.tsx` CSS puro, datos de `localStorage` post-mount, un solo `suppressHydrationWarning`. | Elimina mismatches; alternativa `suppressHydrationWarning` global descartada. |
| **ADR-05** | 2026-09-17 | **Reestructura navbar v4.2:** Blog y «Rastrear envío» dentro de Tienda; un mega menú por grupo; Cloudinary `ppo6ze2s`. | Simplifica la fila y unifica paneles. |
| **ADR-06** | 2026-09-14 | **Google Sheets como CMS sin hardcode:** `GOOGLE_SHEET_ID` obligatoria; CSV público; escrituras vía Apps Script. | Seguridad y parseo robusto; se eliminó el ID hardcodeado en `2ce8246`. |
| **ADR-07** | 2026-09-17 | **Best sellers desde `Ventas`:** gviz (`/export?…&sheet=` devuelve la primera pestaña en silencio), parseo de todas las celdas, fallback `[]`. | Robustez ante hojas renombradas; el fallback estático es obligatorio. |
| **ADR-08** | 2026-09-18 | **`ENTREAMIGAS` + fuente única de envío en `lib/shipping.ts`:** `SHIPPING_FLAT=150`, `FREE_SHIPPING_THRESHOLD=3000`, código en `vipCode`; sin stacking. | Evita drift cliente/servidor; descartado validar el código en Apps Script. |
| **ADR-09** | 2026-09-18 | **Favicon optimizado desde raster + retiro de `app/icon.svg`.** | El SVG de 4.7 MB rompía Turbopack y era inviable; superseded por ADR-12. |
| **ADR-10** | 2026-09-23 | **`.page-enter` con `fill-mode: backwards` (nunca `both`/`forwards`).** | Un transform residual crea containing block y desancla `position:fixed`; regresión corregida. |
| **ADR-11** | 2026-09-25 | **404 global en `app/not-found.tsx`** (Server Component estático, hereda root layout; metadata sí aplica en Next 16.1.6; `noindex` lo inyecta Next). | `global-not-found.js` es experimental; el root `not-found.tsx` cubre todo sin configuración. |
| **ADR-12** | 2026-09-29 | **Favicon v2 adaptativo:** `public/favicon_zoa.svg` reconstruido (slate/off-white por `prefers-color-scheme`), `favicon.ico`/`icon.png` sin fondo y apple-touch con fondo off-white; `app/` sin metadata files de iconos. | Recupera dark mode y nitidez; Chrome prefiere el `.ico` si ambos se declaran, por eso solo se declara el SVG. |
| **ADR-13** | 2026-11-05 (**en curso**) | **Precio autoritativo en servidor para todo pedido pagado:** el servidor relee catálogo/stock, recalcula con `lib/pricing.ts` y rechaza 409 si el total del cliente difiere > 1 MXN. El cliente solo muestra; no decide precio/descuento. | Cierra manipulación y drift. En HEAD solo aplica cuando hay código de campaña; el working tree lo extiende a todos los pedidos. **No cerrado:** falta commit, pruebas de VIP/legacy/envío/redondeo y QA. |
| **ADR-14** | 2026-11-05 (**en curso**) | **Idempotencia de stock/webhook por `orderId` + marca:** `deductStock`/`logSale` reciben `orderId` (`ZOA-<paymentId>`/`ZOA-TIENDA-…`) y `brand`; se registra `pending_fulfillment` si falla una escritura; el webhook deduplica antes de actuar. | Evita doble descuento por reintentos MP o doble ejecución Brick/webhook. **No cerrado:** la barrera atómica debe vivir en Apps Script (o almacén compartido); el dedupe en memoria no cubre varias instancias. |
| **ADR-15** | 2026-11-05 | **Marcas separadas con inventario compartido:** Zoa y Carmeli tienen tiendas, dominios, deploy y comunicación separados, pero un solo Sheet/Apps Script. | Una sola verdad de stock evita sobreventa; obliga a prefijos de pedido, `brand` en escrituras y reportes por marca. Carmeli no debe usar `ENTREAMIGAS`. |
| **ADR-16** | 2026-11-05 | **Deploy split:** Zoa en **Railway**; Carmeli en **Vercel**. | Zoa usa `after()` de `next/server`; Carmeli puede usar `waitUntil`/`maxDuration`. Variables, webhooks y dominios se configuran por separado; no copiar patrones de deploy entre repos. |

## 6. Historial reciente

| Hash | Fecha | Mensaje | Nota |
|---|---|---|---|
| `2b338dd` | 2026-10-26 | Feature: promociones de temporada, cupones y accesibilidad | **HEAD actual.** 49 archivos, +2046/−522. Promociones (`lib/promotions.ts`, `PromoBanner`, `PromoCode`), pricing (`lib/pricing.ts`), campañas en checkout (`couponScope`, validación server-side, recibo con descuento), a11y/legales (`cookies`, `reembolsos`, skip link, focus trap, contraste), assets (`public/promos/*` y limpieza legacy). **Verificación del commit:** tsc/lint/build ✅ **173/173**. |
| `722ddd7` | 2026-09-29 | Fix: favicon adaptativo v2 | Favicon SVG claro/oscuro + fallbacks ICO/Apple; ADR-12. Build 167/167. |
| `2ac07f8` | 2026-09-25 | Fix: Reply-To de correos a clientas y buzones internos reales | Buzones reales (`carmen@carmeli.mx`, `carmeli6521@gmail.com`, `jgegmz@gmail.com`); `replyTo` en `payment-success`. |
| `f9e8a08` | 2026-09-25 | Feature: página 404 global | `app/not-found.tsx`, `pages/404.md`; ADR-11. Build 169/169. |
| `516f090` | 2026-09-23 | Feature: hovers, doble hairline, logo adaptativo, márgenes PDP y page-enter | Correcciones UI; ADR-10. |
| `81a633f` | 2026-09-18 | Fix: resolver Public Key MP tolerando Application IDs | `lib/mercadopagoPublicKey.ts`; ignora UUID y vacíos. |
| `f45ecff` | 2026-09-18 | Deploy: Railway + migración `waitUntil`→`after()` | `process-payment` usa `after()`; Skydropx síncrono. |
| `7f3ce9d` | 2026-09-18 | Fix: cupón aplicado, `vipCode` null-safe y lint | Chip de cupón, hardening y lint en 0. |
| `8e0fe03` | 2026-09-18 | Código secreto `ENTREAMIGAS` + best sellers | ADR-07/ADR-08; historia reescrita para expulsar `.tmp-qa/`. |
| `2ce8246` | 2026-09-14 | fix: remove hardcoded Google Sheets ID | ADR-06. |

> El commit **docs-only** de esta actualización no está hecho (por instrucción de la sesión). `HEAD` sigue siendo `2b338dd`.

## 7. Pendientes / TODOs

> **Leyenda:** ✅ resuelto en `2b338dd`; ⏳ en curso en el working tree (sin commit ni verificación); ⬜ pendiente.

### P0 — antes de considerar cerrada la sesión de código

1. ⏳ **Cerrar el working tree de endurecimiento:** commitear y verificar precio autoritativo, consentimiento, idempotencia, geocode, auth interna, sitemap/enlaces y `checkout/pending`. No documentar como hecho hasta entonces.
2. ⏳ **Verificación final:** `npx tsc --noEmit`, `npm run lint`, `npm run build` y pruebas de webhook duplicado. La referencia verde es **173/173** de `2b338dd`; el working tree no tiene verificación final registrada.
3. ⏳ **Idempotencia real:** `findSaleStatusByOrderId` + dedupe en memoria no bastan con varias instancias. Exigir deduplicación atómica por `orderId` en Apps Script y probar concurrencia/reintento. Si Apps Script no está actualizado, el riesgo de doble stock persiste.
4. ⏳ **Consentimiento persistido:** confirmar columnas del Apps Script (`consent`, `orderId`, `brand`, `subtotal`, `discount`, `shipping`) y que `SaleConsent` llega al log/MP. En HEAD solo se enviaba en el POST y el API lo ignoraba.
5. ⏳ **`/api/geocode`:** en HEAD **no existía** aunque `AddressAutocomplete` lo llamaba; el working tree añade el proxy. Verificar rate limit, User-Agent, fallback manual y que el texto de `/cookies` coincide con el código.
6. ⏳ **`/checkout/pending`:** en HEAD no existía; el working tree añade la página. Verificar retornos de Mercado Pago y enlaces antiguos.
7. ⏳ **Sitemap/enlaces:** en HEAD `sitemap.ts` y `lib/blog.ts` aún usaban `/colecciones/*`; el working tree los migra a `/tienda?coleccion=…` y añade legales. Verificar slugs reales y que no queden URLs inválidas.
8. ⏳ **Retiro de Checkout Pro:** `app/api/checkout/route.ts` está eliminado en el working tree. Confirmar que el flujo Brick-only es intencional; si no, restaurar y actualizar docs.
9. ⬜ **Resend — dominio/remitente:** el usuario indica **Resend verificado**. El código sigue con fallback `Zoa <hola@zoa.mx>`; define `RESEND_FROM_EMAIL` en Railway con un remitente del dominio verificado y prueba recibo + aviso interno. No asumir que `zoa.mx` está verificado solo por el fallback.
10. ⬜ **MP Public Key:** en local/Railway uno de los dos nombres contiene un **Application ID (UUID)** en lugar de una Public Key `APP_USR-…`/`TEST-…`. `lib/mercadopagoPublicKey.ts` lo tolera, pero hay que corregir ambos nombres, redeployar y probar el Brick.
11. ⏳ **Endpoints internos:** en HEAD `/api/debug-sheet` estaba abierto y `/api/debug-skydropx` usaba un secreto hardcodeado en el código. El working tree exige `x-internal-secret` (`INTERNAL_API_SECRET`) y `INTERNAL_WEBHOOK_SECRET` para el correo. Configurar envs en Railway y verificar 404/401 en producción; `debug-skydropx` ya no debe ejecutar POST.
12. ⏳ **Headers de seguridad:** `next.config.ts` añade `poweredByHeader:false`, `X-Frame-Options`, `frame-ancestors`, HSTS, etc. Verificar que el Brick de MP sigue cargando (no hay CSP completa a propósito).

### P1 — deuda y seguimiento

13. ⏳ **Best sellers y pedidos `CARMELI-`:** en HEAD los pedidos de Carmeli se contaban en Zoa. El working tree filtra `ZOA-…`/`ZOA-TIENDA-…` y estados no computables; verificar con datos reales y decidir el fallback cuando no haya filas Zoa.
14. ⏳ **Imágenes de campaña:** `public/promos/*.webp` son placeholders; sustituir por arte final (21:9 desktop / 4:5 móvil) y ajustar `positionMobile`/`positionDesktop`.
15. ⬜ **`README.md`:** reemplazado en esta sesión por documentación real (sin commit). Mantenerlo sincronizado con envs/scripts/deploy.
16. ⏳ **`MEMORIA.md`/`AGENTS.md`:** actualizados en esta sesión (sin commit). Reconciliar cuando el agente de código cierre y commitee.
17. ⬜ **`@vercel/functions`:** sin imports en Zoa desde `f45ecff`, pero sigue en `package.json`; retirar en limpieza futura.
18. ⬜ **Drift del nav al alternar logo (2026-09-23):** ~6.5 px en `lg`; decidir snap vs reservar ancho. No bloquea.
19. ⬜ **Sticky del panel desktop del PDP:** recorrido sticky mínimo; evaluar wrapper/offset sin romper CLS.
20. ⬜ **Doble sufijo en `<title>`:** varias páginas fijan el sufijo a mano y el layout aplica `template: "%s | Zoa"`; usar `title.absolute` o quitar el sufijo manual.
21. ⬜ **`.tmp-qa/`:** sigue gitignored; las capturas QA son locales. No versionar. Las acciones manuales de purga/rotación de credenciales de §7.1 histórica siguen vigentes.
22. ✅ **Assets legacy:** los 7 archivos sin referencias se eliminaron en `2b338dd`.
23. ✅ **Lint de HEAD:** `npm run lint` ✅ en `2b338dd`; el working tree debe re-verificarse.
24. ✅ **Favicon:** ADR-12; pendiente solo un export vectorial real si se quiere nitidez infinita.
25. ✅ **404 global:** `f9e8a08`; documentado en ADR-11.

## 8. Fuentes de verdad

1. **Design system:** `design-system/zoa-boutique/MASTER.md` (v4.3) + `pages/*.md`.
2. **Código ejecutable:** `app/globals.css`, `components/ui/`, `lib/`.
3. **Datos:** Google Sheet `Oficial` (A–T) vía `lib/googleSheets.ts`; `Ventas` para best sellers.
4. **Promociones:** `lib/promotions.ts` (contrato) y `design-system/zoa-boutique/pages/home.md`/`checkout.md` (UI).
5. **Precios/envío:** `lib/pricing.ts` y `lib/shipping.ts`.
6. **Repo/deploy:** `origin` = GitHub `EduardoGonzalez26/Zoa-boutique`; **Railway**.
7. **Continuidad:** este archivo y `AGENTS.md`; para Carmeli, `../carmeli-boutique/MEMORIA.md`.
