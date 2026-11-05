# Zoa Boutique

E-commerce de moda femenina mexicana (`zoa.mx`): catálogo editorial, carrito, checkout con Mercado Pago, envíos con Skydropx y correos transaccionales con Resend. El catálogo se administra desde Google Sheets y el frontend sigue el design system **EDITORIAL ATELIER v4.3**.

- **Producción:** [zoa.mx](https://zoa.mx)
- **Deploy:** **Railway** (self-hosted). La marca hermana Carmeli vive en Vercel y comparte inventario con Zoa (mismo Sheet/Apps Script).
- **Documentación de continuidad:** [`MEMORIA.md`](./MEMORIA.md) (estado, ADRs, pendientes) y [`AGENTS.md`](./AGENTS.md) (reglas para agentes).
- **Design system:** [`design-system/zoa-boutique/MASTER.md`](./design-system/zoa-boutique/MASTER.md) + [`pages/`](./design-system/zoa-boutique/pages/).

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js `16.1.6` (App Router), React `19.2.3`, TypeScript |
| Estilos | Tailwind CSS `^4` + `@tailwindcss/postcss`; tokens en `app/globals.css` |
| Estado | Zustand `^5` (`persist` del carrito) |
| Animación | Framer Motion |
| Pagos | Mercado Pago: Payment Brick + SDK server-side |
| Envíos | Skydropx (OAuth2, cotización, guías y pickups) |
| Correos | Resend |
| UI | `lucide-react` + kit propio `components/ui/` |

No hay framework de tests. La verificación es `npx tsc --noEmit` + `npm run lint` + `npm run build`.

## Requisitos

- Node.js 20+ (el proyecto se desarrolla con Node 22)
- npm
- Acceso al Google Sheet del catálogo (pestaña `Oficial`) y al Apps Script de escrituras
- Credenciales de Mercado Pago, Skydropx y Resend para probar pagos/envíos/correos

## Setup local

```bash
npm install
cp .env.example .env.local   # plantilla sin valores reales; complétala localmente
npm run dev
```

Abre `http://localhost:3000`.

> `.env*` está gitignored. **Nunca** commitees `.env.local`, tokens, IDs de Sheet ni secretos.

### Variables de entorno

| Variable | Obligatoria | Uso |
|---|---|---|
| `GOOGLE_SHEET_ID` | Sí | ID del Sheet; el módulo falla si falta |
| `GOOGLE_SHEET_NAME` | No (`Oficial`) | Pestaña del catálogo |
| `GOOGLE_SHEET_VENTAS` | No (`Ventas`) | Pestaña del log de ventas para best sellers |
| `APPS_SCRIPT_URL` | Sí para escrituras | Apps Script: stock, ventas, cupones legacy y reseñas |
| `MERCADOPAGO_ACCESS_TOKEN` | Sí | Cobros server-side |
| `NEXT_PUBLIC_MP_PUBLIC_KEY` | Sí | Public Key del Brick (`APP_USR-…`/`TEST-…`) |
| `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` | Sí | Mismo valor que la anterior; `lib/mercadopagoPublicKey.ts` resuelve ambas |
| `NEXT_PUBLIC_BASE_URL` / `NEXT_PUBLIC_SITE_URL` | Recomendada | Metadata y URLs absolutas; fallback `https://zoa.mx` |
| `SKYDROPX_API_KEY` / `SKYDROPX_API_SECRET` | Sí para envíos | OAuth2 de Skydropx |
| `SKYDROPX_PICKUP_*` | Según operación | Dirección/ventana de recolección (`NAME`, `STREET`, `NUMBER`, `APARTMENT`, `COLONIA`, `CITY`, `STATE`, `ZIP`, `PHONE`, `TIME_FROM`, `TIME_TO`) |
| `RESEND_API_KEY` | Sí para correos | Envío de recibos/avisos |
| `RESEND_FROM_EMAIL` | Recomendada | Remitente de un dominio verificado; fallback `Zoa <hola@zoa.mx>` |
| `PROMO_PREVIEW` | Solo dev | Fuerza una campaña (`amor`/`madres`/`buenfin`/`navidad`) |
| `PROMO_NOW` | Solo dev | Simula el reloj (`ISO 8601`) en `America/Mexico_City` |

`PROMO_PREVIEW` y `PROMO_NOW` se ignoran en producción.

> **En curso (working tree, sin commit):** el endurecimiento añade `INTERNAL_API_SECRET`, `INTERNAL_WEBHOOK_SECRET`, `MERCADOPAGO_WEBHOOK_SECRET` y `GEOCODE_USER_AGENT`. Confirma el estado final en `AGENTS.md`/`MEMORIA.md` antes de desplegar.

### Mercado Pago

- Usa una **Public Key real**, no un Application ID (UUID). Un UUID en cualquiera de los dos nombres hace que el Brick no monte.
- Mantén `NEXT_PUBLIC_MP_PUBLIC_KEY` y `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` con el mismo valor.
- Los `NEXT_PUBLIC_*` se inlinean en build: **redeploy** después de cambiarlos.
- El servidor valida catálogo/stock/precio; no confíes en el total del cliente.

## Scripts

| Comando | Efecto |
|---|---|
| `npm run dev` | Servidor de desarrollo (Turbopack) |
| `npm run build` | Build de producción |
| `npm start` | Sirve el build |
| `npm run lint` | ESLint sin argumentos |
| `npx tsc --noEmit` | Typecheck |

Referencia de verificación del HEAD `2b338dd`: `tsc`, `lint` y `build` ✅ **173/173**. El working tree de endurecimiento (2026-11-05) aún no tiene verificación final.

## Estructura

```text
app/                 App Router: home, tienda, PDP, blog, checkout, legales
app/api/             Pagos, webhooks, envíos, cupones, reseñas, debug
components/          UI de dominio + kit components/ui/
lib/                 Sheet, Mercado Pago, Skydropx, envío, pricing, promociones, blog
store/               Carrito y checkout (Zustand)
design-system/       MASTER v4.3 + overrides por página
public/              Logo, banners, blog, favicons y promos/
```

- **Catálogo:** Google Sheets `Oficial` (A–T), lectura CSV pública con ISR 60 s. `NUM` es el ID; `SKU` es display.
- **Ventas:** Google Apps Script escribe en `Ventas`; best sellers se calculan desde ahí.
- **Precios:** `lib/pricing.ts` (subtotal, base elegible, descuento, envío, total) y `lib/shipping.ts` (envío $150 / gratis ≥ $3,000 / `ENTREAMIGAS`).
- **Promociones:** `lib/promotions.ts` es la fuente única (server-only).
- **Checkout:** Payment Brick → `/api/process-payment`; stock/venta/Skydropx en el servidor; correo con `after()`.
- **Webhooks:** `/api/webhooks/mercadopago` y `/api/webhooks/payment-success`.

## Promociones de temporada

La home muestra una banda wine **solo dentro de la ventana anual** de la campaña. La fuente única es `lib/promotions.ts`; `app/page.tsx` llama a `getActivePromo()` y renderiza `components/PromoBanner.tsx` después de Colecciones y antes de «Lo nuevo». Fuera de temporada no se renderiza nada.

| Campaña | Slug | Ventana (America/Mexico_City) | Código |
|---|---|---|---|
| Día del Amor y la Amistad | `amor` | 10–20 de febrero | `AMOR15` |
| Día de las Madres | `madres` | 5–15 de mayo | `MAMA15` |
| Buen Fin | `buenfin` | 13–17 de noviembre | `BUENFIN15` |
| Navidad y Año Nuevo | `navidad` | 20 de diciembre–1 de enero | `NAVIDAD15` |

- Todas: **15% OFF**, no acumulables, no aplican a piezas con descuento propio.
- Fechas inclusivas; `navidad` cruza el año y cubre el 1 de enero.
- `PROMO_PREVIEW`/`PROMO_NOW` permiten QA local; en producción se ignoran.
- Los códigos de campaña se validan en el servidor; los **cupones legacy siguen en Apps Script**.
- `couponScope` (`"all"`/`"eligible"`) distingue cupones generales de campañas que excluyen rebajadas.
- Imágenes: `public/promos/{slug}.webp` (hoy placeholders). Sustituir conservando el nombre y ajustar `image.positionMobile`/`positionDesktop` en `lib/promotions.ts`.

> **Estado:** la fase de UI está commiteada en `2b338dd`; el endurecimiento del backend (precio autoritativo para todos los pedidos, consentimiento persistido, idempotencia, geocode, auth interna) está **en curso en el working tree**, sin commit ni verificación final. Ver `MEMORIA.md` §4/§7.

## Deploy en Railway

1. Conecta el repo `EduardoGonzalez26/Zoa-boutique` (rama `main`).
2. Configura las variables de entorno del servicio (las mismas de la tabla; usa el dominio público en `NEXT_PUBLIC_BASE_URL`/`NEXT_PUBLIC_SITE_URL`).
3. Redeploya después de cambiar `NEXT_PUBLIC_*`.
4. Verifica `/`, `/tienda`, un pago de prueba y los webhooks (`/api/webhooks/mercadopago`, `/api/webhooks/payment-success`).
5. No uses `waitUntil`/`maxDuration` como en Vercel: Zoa usa `after()` de `next/server`.

## Legales y accesibilidad

- Legales: `/privacidad`, `/terminos`, `/devoluciones`, `/cookies`, `/reembolsos`.
- Skip link, focus trap en drawer/navbar, contraste AA, `PromoCode` accesible y `Marquee` que pausa al enfocar.
- El consentimiento del checkout debe quedar registrado en el log de venta (en curso; verificar Apps Script).

## Documentación

- [`MEMORIA.md`](./MEMORIA.md) — estado, ADRs y pendientes.
- [`AGENTS.md`](./AGENTS.md) — comandos, envs, flujos y traps.
- [`design-system/zoa-boutique/MASTER.md`](./design-system/zoa-boutique/MASTER.md) — ley visual v4.3.
