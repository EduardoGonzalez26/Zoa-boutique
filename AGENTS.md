# AGENTS.md — Zoa Boutique

E-commerce Next.js 16 (App Router) + React 19 + TypeScript strict + Tailwind v4 + Zustand. Catálogo desde Google Sheets, pagos con MercadoPago, envíos con Skydropx y correos con Resend. **Deploy: Railway** (`origin` = `EduardoGonzalez26/Zoa-boutique`, rama `main`). UI y comentarios en español (MX). `params`/`searchParams` son Promises (Next 16).

**Lee `MEMORIA.md` primero** — estado real, ADRs y pendientes. **HEAD = `2b338dd`**; el working tree puede tener una sesión de endurecimiento **en curso** (sin commit ni verificación final). No asumas que lo que ves está terminado. Para UI/design, lee `design-system/zoa-boutique/MASTER.md` (v4.3).

## Commands

- `npm run dev` / `npm run build` / `npm start`
- `npm run lint` → `eslint` sin argumentos
- `npx tsc --noEmit` → typecheck (no hay script `typecheck`)
- No hay tests. Verifica con `npx tsc --noEmit` + `npm run lint` + `npm run build`.
- Referencia verde del HEAD: **173/173** (commit `2b338dd`). El working tree actual no tiene verificación final registrada.

## Data / env

`.env*` está gitignored, con excepción de `.env.example` (plantilla sin valores reales, habilitada con `!.env.example` en el working tree). `.env.local` define Sheet, MercadoPago (token + ambos nombres de public key), Skydropx y Resend; `NEXT_PUBLIC_BASE_URL` cae a `https://zoa.mx` con `||`.

### Requeridas

- `GOOGLE_SHEET_ID` — obligatoria; el módulo falla si falta. No hay fallback hardcodeado.
- `GOOGLE_SHEET_NAME` — default `Oficial`; `GOOGLE_SHEET_VENTAS` — default `Ventas`.
- `APPS_SCRIPT_URL` — stock, ventas, cupones legacy y reseñas. Compartido con Carmeli.
- `MERCADOPAGO_ACCESS_TOKEN`.
- `NEXT_PUBLIC_MP_PUBLIC_KEY` **y** `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` — resueltas por `lib/mercadopagoPublicKey.ts`; solo acepta `APP_USR-…`/`TEST-…`, ignora Application IDs (UUID) y vacíos. Mantén ambas con la misma llave válida y redeploya (se inlinean en build).
- `NEXT_PUBLIC_BASE_URL` / `NEXT_PUBLIC_SITE_URL` — metadata/URLs; fallback `https://zoa.mx`.
- `SKYDROPX_API_KEY` / `SKYDROPX_API_SECRET` / `SKYDROPX_PICKUP_*`.
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL` — remitente de un dominio verificado en Resend; fallback `Zoa <hola@zoa.mx>`.

### Solo development

- `PROMO_PREVIEW=<amor|madres|buenfin|navidad>` — fuerza campaña.
- `PROMO_NOW=<ISO 8601>` — simula el reloj de `America/Mexico_City`.

En production se ignoran.

### En curso (working tree; confirmar antes de deploy)

- `INTERNAL_API_SECRET` — header `x-internal-secret` para `/api/vendido`, `/api/debug-sheet` y `/api/debug-skydropx`.
- `INTERNAL_WEBHOOK_SECRET` — header `x-internal-secret` para `/api/webhooks/payment-success`.
- `MERCADOPAGO_WEBHOOK_SECRET` — verificación de firma del webhook, si el código final la exige.
- `GEOCODE_USER_AGENT` — opcional; User-Agent del proxy Nominatim (`/api/geocode`).

Sin estos secretos, el working tree falla cerrado en producción (404/401/503). No los omitas.

## Pricing / promotions (fuente única)

- `lib/promotions.ts` — **server-only**; no importar desde `"use client"`. Define 4 campañas (`amor`, `madres`, `buenfin`, `navidad`), 15% OFF, ventanas inclusivas en `America/Mexico_City`; `navidad` cruza el año. `getActivePromo()`, `getPromoByCode()`, `isPromoActive()`. `PROMO_PREVIEW`/`PROMO_NOW` solo en development.
- `lib/pricing.ts` — **server-safe y puro**; `getOrderBreakdown(items, opts)` calcula subtotal, base elegible, descuento, envío y total. `VIP_CODE="PROBADOR"`, `VIP_DEPOSIT_AMOUNT=300`. No dupliques la fórmula en el cliente: el carrito replica la regla para mostrar, pero el servidor manda.
- `lib/shipping.ts` — única fuente de `SHIPPING_FLAT=150`, `FREE_SHIPPING_THRESHOLD=3000`, `FREE_SHIPPING_CODE="ENTREAMIGAS"`. No re-hardcodees.
- **Campañas:** se resuelven localmente en `/api/validate-coupon` y en `process-payment`; devuelven `scope: "eligible"` y excluyen piezas con `product.discount`.
- **Cupones legacy:** siguen viviendo en **Google Apps Script** (`action: "validateCoupon"`). No los migres al cliente. El servidor debe validar el descuento; nunca confíes en `couponDiscount` del payload.
- **`couponScope`:** `"all"` | `"eligible"` en `store/cartStore.ts`, persistido; las campañas usan `"eligible"`. No lo hardcodees en componentes.
- **Estado HEAD vs working tree:** en `2b338dd` el servidor recalcula solo cuando hay código de campaña. El working tree extiende la validación a **todos** los pedidos (catálogo/stock frescos, 409 por total). **No está commiteado ni verificado**; no lo describas como cerrado.
- **Discrepancia:** `design-system/zoa-boutique/pages/home.md` aún dice «Pendiente backend»; el código de `2b338dd` ya valida campañas en checkout. Fuente de verdad: el código; actualizar la página cuando se toque diseño.
- **Checkout Pro:** existía en HEAD (`app/api/checkout`); el working tree lo elimina. Confirma el flujo final antes de tocar webhooks/back URLs.

## Payment / checkout flows

- CartDrawer → Payment Brick (`MercadoPagoWrapper`, dynamic `ssr:false`) → `POST /api/process-payment`: valida, descuenta stock, registra venta y crea el envío Skydropx de forma síncrona; el correo sale en `after()` (Railway/self-hosted). `maxDuration=60` es Vercel-only e ignorado en Railway.
- `/checkout` importa el Brick directamente y usa el mismo `/api/process-payment`.
- Webhook MP (`/api/webhooks/mercadopago`): en HEAD descuenta stock en cada evento aprobado; el working tree añade `orderId`, marca, dedupe y `pending_fulfillment`.
- `POST /api/vendido` es venta física (stock + log, sin pago/envío); en el working tree exige `INTERNAL_API_SECRET`.
- `components/MercadoPagoBrick.tsx` y `app/api/shipping-rates/route.ts` no tienen consumidores claros; no copies sus patrones.

## Shipping cost

`lib/shipping.ts` es la única fuente. Consumidores: `store/cartStore.ts`, `components/CartDrawer.tsx`, `app/checkout/page.tsx`, `app/api/process-payment/route.ts` (vía `lib/pricing.ts`) y `app/api/webhooks/payment-success/route.ts`. El copy editorial aún puede hardcodear `$150`/`≥$3,000`; actualízalo a mano si cambian las constantes.

## UI rules (MASTER v4.3)

- Tokens en `app/globals.css` (`@theme static`); reutiliza `components/ui/` (Button, Reveal, ImageReveal, SectionHeader, Overline, Chip, Accordion, EmptyState, `PromoCode`, `useFocusTrap`, `useMounted`).
- Sin `#FFFFFF`; exactamente **1 banda forest** (`#003628`) full-bleed por página; máximo **1 wine** (la promo condicional de la home). La home usa Marquee forest y CTABanner slate.
- A11y: contraste AA (tokens 2026-10-26), skip link, focus trap, `PromoCode` con `aria-live`, `Marquee` pausa al enfocar. Mantén foco visible y touch targets ≥44 px.
- Hidratación: nunca `useReducedMotion()` directo en render; `rm = mounted && reduceMotion`; `template.tsx` CSS puro; 0 warnings es invariante.
- Regla de alcance del MASTER: diseño no toca `app/api/**`, `lib/**`, `store/**`, `sitemap.ts`, `next.config.ts`, `package.json` ni añade dependencias.

## Traps / seguridad

- **Endpoint de geocode:** en HEAD no existía `/api/geocode` aunque `AddressAutocomplete` lo llamaba. El working tree lo añade; verifica rate limit, User-Agent y fallback manual antes de confiar.
- **Consentimiento:** en HEAD el checkbox existe y el POST incluía `consent`, pero el API lo ignoraba. El working tree lo persiste; exige columnas nuevas en Apps Script. No lo llames “cumplido” hasta verificar el log.
- **Idempotencia:** el dedupe en memoria no cubre varias instancias. La barrera atómica debe estar en Apps Script por `orderId`; sin eso, un reintento del webhook puede descontar stock dos veces.
- **Debug routes:** en HEAD `/api/debug-sheet` estaba abierto y `/api/debug-skydropx` usaba un secreto hardcodeado en el código. El working tree exige `INTERNAL_API_SECRET`; configura el env y verifica 404/401 en producción. No reintroduzcas POST en un GET.
- **MP Public Key:** un Application ID (UUID) en cualquiera de los dos nombres rompe el Brick en silencio. Corrige ambos y redeploya.
- **Resend:** el remitente debe ser de un dominio verificado. `hola@zoa.mx` falló con 403 el 2026-09-18; define `RESEND_FROM_EMAIL` si el dominio no está verificado. No asumas verificación por el fallback.
- **Enlaces:** `/colecciones/*` y `/checkout/pending` fueron deuda en HEAD; el working tree migra enlaces y añade la página. Verifica que no queden URLs inválidas en sitemap/blog/footer.
- **`CARMELI-` en `Ventas`:** la hoja es compartida; en HEAD los pedidos de Carmeli se contaban en best sellers. El working tree filtra `ZOA-…`; verifica con datos reales antes de confiar en el ranking.
- **`.tmp-qa/`:** artefactos locales de Chrome; gitignored y `globalIgnores` en ESLint. No versionar. No commitear `.env.local` ni `npm-cache/`.
- **`next.config.ts`:** solo permite imágenes de `res.cloudinary.com` (+ Unsplash fallback). No añadas hosts sin justificarlo.
