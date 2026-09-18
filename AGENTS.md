# AGENTS.md — Zoa Boutique

E-commerce Next.js 16 (App Router) + React 19 + TypeScript strict + Tailwind v4 + Zustand. Catalog CMS is a public Google Sheet; payments via MercadoPago; shipping via Skydropx; email via Resend. Deploy target: Vercel (`origin` = `EduardoGonzalez26/Zoa-boutique`, branch `main`). UI copy and code comments are Spanish (MX). Dynamic route `params`/`searchParams` are Promises (Next 16).

**Read `MEMORIA.md` first** — session state, ADRs, pending work. For UI/design tasks also read `design-system/zoa-boutique/MASTER.md` (v4.3), the design source of truth.

## Commands
- `npm run dev` / `npm run build` / `npm start`
- `npm run lint` → bare `eslint` over the repo (no args)
- `npx tsc --noEmit` → typecheck (there is no `typecheck` script)
- No test framework. Verify changes with `npx tsc --noEmit` + `npm run lint` + `npm run build`.

## Data / env
- `.env*` is gitignored. `.env.local` currently only defines `GOOGLE_SHEET_ID`, so payment/shipping/email flows cannot run locally until the other keys are added.
- Env vars: `GOOGLE_SHEET_ID` (required — throws if missing), `GOOGLE_SHEET_NAME` (default `Oficial`), `GOOGLE_SHEET_VENTAS` (default `Ventas`), `APPS_SCRIPT_URL`, `MERCADOPAGO_ACCESS_TOKEN`, `SKYDROPX_API_KEY`/`SKYDROPX_API_SECRET`/`SKYDROPX_PICKUP_*`, `RESEND_API_KEY`, `NEXT_PUBLIC_BASE_URL` (metadata), `NEXT_PUBLIC_SITE_URL` (fallback `https://zoa.mx`).
- MercadoPago public-key naming is split and both must be set: `/checkout` page + `next.config.ts` read `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`; `components/MercadoPagoWrapper.tsx` and `MercadoPagoBrick.tsx` read `NEXT_PUBLIC_MP_PUBLIC_KEY`. Missing one breaks only one flow silently.
- Google Sheet `Oficial` columns A–T are hardcoded in `lib/googleSheets.ts`; `NUM` (col A) is the product ID, `SKU` is display-only. Reads use the public CSV export with ISR `revalidate = 60`. Writes go through Apps Script (`APPS_SCRIPT_URL`: `deductStock`, `logSale`, coupons, reviews).
- Best sellers read the `Ventas` tab via the gviz endpoint only — `/export?format=csv&sheet=` silently returns the first tab.
- Pages intentionally `catch → []` on Sheet failures, so a missing/broken Sheet renders an empty catalog instead of failing the build.

## Payment / checkout flows
- CartDrawer → Payment Brick (`MercadoPagoWrapper`, dynamic `ssr:false`) → `POST /api/process-payment`: deducts stock and logs sale, then Skydropx shipment + email run in `waitUntil` (`maxDuration = 60`).
- `/checkout` page imports the Brick directly and calls the same `/api/process-payment`.
- Checkout Pro: `POST /api/checkout` → MercadoPago webhook `/api/webhooks/mercadopago` (fetches payment, `deductStock`, creates Skydropx shipment, non-fatal) → calls `/api/webhooks/payment-success` to send emails.
- `POST /api/vendido` is the physical-store sale path (stock + sale log, no payment/shipping).
- `components/MercadoPagoBrick.tsx` and `app/api/shipping-rates/route.ts` have no callers (dead code); don't copy their patterns.

## Shipping cost (no single source of truth)
Flat $150 MXN, free ≥ $3,000; VIP code `PROBADOR` = $300 deposit. Hardcoded and duplicated — update all sites when changing:
- `store/cartStore.ts:12` (mirrors `150`/`3000`)
- `app/api/checkout/route.ts:16` (sent to MercadoPago as `shipments.cost`)
- `app/checkout/page.tsx:49`
- `app/api/webhooks/payment-success/route.ts:112`
- `components/CartDrawer.tsx:17` (threshold only)

## UI rules (MASTER v4.3)
- Tokens live in `app/globals.css` (`@theme static`); reuse `components/ui/` kit (Button, Reveal, ImageReveal, SectionHeader, Overline, Chip, Accordion, EmptyState, `useMounted`). No pure `#FFFFFF`; formulas: exactly 1 forest (`#003628`) full-bleed band per page, max 1 wine band.
- Hydration law: never call `useReducedMotion()` directly in render; use `const rm = mounted && reduceMotion` with `components/ui/useMounted.ts`. `app/template.tsx` must stay pure CSS. Zero hydration warnings is an invariant.
- MASTER scope rule: design work must not touch `app/api/**`, `lib/**`, `store/**`, `sitemap.ts`, `next.config.ts`, `package.json`, or add dependencies.

## Traps
- Debug routes are public in production: `/api/debug-sheet` and `/api/debug-skydropx?secret=zoa_debug` (hardcoded secret).
- Known broken links still pending: `/colecciones/*` and `/checkout/pending` (see `MEMORIA.md` §7).
- `.tmp-qa/` holds untracked Chrome QA artifacts; leave it out of commits unless asked.
- `next.config.ts` allows remote images only from `res.cloudinary.com` (plus Unsplash fallback).
