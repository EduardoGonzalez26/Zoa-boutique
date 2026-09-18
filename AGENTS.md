# AGENTS.md — Zoa Boutique

E-commerce Next.js 16 (App Router) + React 19 + TypeScript strict + Tailwind v4 + Zustand. Catalog CMS is a public Google Sheet; payments via MercadoPago; shipping via Skydropx; email via Resend. Deploy target: Railway (self-hosted; `origin` = `EduardoGonzalez26/Zoa-boutique`, branch `main`). UI copy and code comments are Spanish (MX). Dynamic route `params`/`searchParams` are Promises (Next 16).

**Read `MEMORIA.md` first** — session state, ADRs, pending work. For UI/design tasks also read `design-system/zoa-boutique/MASTER.md` (v4.3), the design source of truth.

## Commands
- `npm run dev` / `npm run build` / `npm start`
- `npm run lint` → bare `eslint` over the repo (no args)
- `npx tsc --noEmit` → typecheck (there is no `typecheck` script)
- No test framework. Verify changes with `npx tsc --noEmit` + `npm run lint` + `npm run build`.

## Data / env
- `.env*` is gitignored. `.env.local` defines Sheet, MercadoPago (token + both public-key names), Skydropx and Resend keys (values were not all valid — see the MercadoPago bullet); `NEXT_PUBLIC_BASE_URL` is unset locally and metadata falls back to `https://zoa.mx` via `||`.
- Env vars: `GOOGLE_SHEET_ID` (required — throws if missing), `GOOGLE_SHEET_NAME` (default `Oficial`), `GOOGLE_SHEET_VENTAS` (default `Ventas`), `APPS_SCRIPT_URL`, `MERCADOPAGO_ACCESS_TOKEN`, `NEXT_PUBLIC_MP_PUBLIC_KEY` + `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` (both, same value), `SKYDROPX_API_KEY`/`SKYDROPX_API_SECRET`/`SKYDROPX_PICKUP_*`, `RESEND_API_KEY`, `NEXT_PUBLIC_BASE_URL` (metadata; empty → `||` fallback `https://zoa.mx`), `NEXT_PUBLIC_SITE_URL` (fallback `https://zoa.mx`).
- MercadoPago public key has two names and both must hold the SAME valid key (`APP_USR-…` prod / `TEST-…` test — never an Application ID, never empty). Components read `NEXT_PUBLIC_MP_PUBLIC_KEY ?? NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`; `/checkout` reads the reverse; `next.config.ts` injects both names. A wrong value makes the Brick fail to render silently (this broke `/checkout` until 2026-09-18).
- Google Sheet `Oficial` columns A–T are hardcoded in `lib/googleSheets.ts`; `NUM` (col A) is the product ID, `SKU` is display-only. Reads use the public CSV export with ISR `revalidate = 60`. Writes go through Apps Script (`APPS_SCRIPT_URL`: `deductStock`, `logSale`, coupons, reviews).
- Best sellers read the `Ventas` tab via the gviz endpoint only — `/export?format=csv&sheet=` silently returns the first tab.
- Pages intentionally `catch → []` on Sheet failures, so a missing/broken Sheet renders an empty catalog instead of failing the build.

## Payment / checkout flows
- CartDrawer → Payment Brick (`MercadoPagoWrapper`, dynamic `ssr:false`) → `POST /api/process-payment`: deducts stock, logs sale and creates the Skydropx shipment synchronously, then returns 200; the email is sent in `after()` from `next/server` (works on Railway/self-hosted; `maxDuration = 60` is Vercel-only and ignored on Railway).
- `/checkout` page imports the Brick directly and calls the same `/api/process-payment`.
- Checkout Pro: `POST /api/checkout` → MercadoPago webhook `/api/webhooks/mercadopago` (fetches payment, `deductStock`, creates Skydropx shipment, non-fatal) → calls `/api/webhooks/payment-success` to send emails.
- `POST /api/vendido` is the physical-store sale path (stock + sale log, no payment/shipping).
- `components/MercadoPagoBrick.tsx` and `app/api/shipping-rates/route.ts` have no callers (dead code); don't copy their patterns.

## Shipping cost (single source of truth)
`lib/shipping.ts` is the only source: `SHIPPING_FLAT = 150`, `FREE_SHIPPING_THRESHOLD = 3000`, `FREE_SHIPPING_CODE = "ENTREAMIGAS"` (MXN). Import from it; never re-hardcode. Consumers:
- `store/cartStore.ts` — `shipping()` / `isFreeShipping()`; the code travels in `vipCode`, the same field as VIP code `PROBADOR` ($300 deposit, still separate).
- `components/CartDrawer.tsx` — resolves `ENTREAMIGAS` locally (no `/api/validate-coupon`, nothing sent to Apps Script), one code at a time (no stacking with coupons/VIP), shows 100% progress bar + "— envío gratis" chip.
- `app/checkout/page.tsx` — computes shipping and sends `vipCode: activeCode` to `/api/process-payment`.
- `app/api/checkout/route.ts` — Checkout Pro: `isFreeShipping` zeroes `shipments.cost` without triggering the VIP deposit branch.
- `app/api/webhooks/payment-success/route.ts` — receipt prints "Gratis".
Editorial copy still hardcodes `$150` / `≥ $3,000` — update by hand if the constants change: `components/ProductGalleryClient.tsx:677`, `components/Footer.tsx:190`, `app/page.tsx:98,179`.

## UI rules (MASTER v4.3)
- Tokens live in `app/globals.css` (`@theme static`); reuse `components/ui/` kit (Button, Reveal, ImageReveal, SectionHeader, Overline, Chip, Accordion, EmptyState, `useMounted`). No pure `#FFFFFF`; formulas: exactly 1 forest (`#003628`) full-bleed band per page, max 1 wine band.
- Hydration law: never call `useReducedMotion()` directly in render; use `const rm = mounted && reduceMotion` with `components/ui/useMounted.ts`. `app/template.tsx` must stay pure CSS. Zero hydration warnings is an invariant.
- MASTER scope rule: design work must not touch `app/api/**`, `lib/**`, `store/**`, `sitemap.ts`, `next.config.ts`, `package.json`, or add dependencies.

## Traps
- Debug routes are public in production: `/api/debug-sheet` and `/api/debug-skydropx?secret=zoa_debug` (hardcoded secret).
- Known broken links still pending: `/colecciones/*` and `/checkout/pending` (see `MEMORIA.md` §7).
- `.tmp-qa/` holds local Chrome QA artifacts: ignored by git and ESLint since 2026-09-18 (`.gitignore` + `globalIgnores`); its 676 files were purged from `main` by rewriting `c1c7c27` (force-push with lease). Manual follow-ups (dangling GitHub objects, credential rotation) in `MEMORIA.md` §7 (item 1).
- `next.config.ts` allows remote images only from `res.cloudinary.com` (plus Unsplash fallback).
