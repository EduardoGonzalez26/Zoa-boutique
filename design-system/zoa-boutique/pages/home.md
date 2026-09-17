# Home — overrides v4.3

> Referencia: `MASTER.md` §6.1. Sin desviaciones estructurales; se documentan las particularidades verificadas de `app/page.tsx`, `HeroSection.tsx` y sus componentes.

## Estructura (9 bloques)

| # | Bloque | Componentes |
|---|---|---|
| 1 | Hero | `HeroSection`, `Button` (`primary`, `ghost-inverse`) |
| 2 | Marquee **forest** | `Marquee variant="forest"` |
| 3 | Intro editorial + métricas | `Overline`, `Reveal`, cifras Bodoni tabular **forest** |
| 4 | Destacado 8/4 | `ImageReveal`, `Overline`, `Button` (`link-arrow`, `outline`) |
| 5 | Índice de colecciones | `SectionHeader`, `CollectionIndex` |
| 6 | Carruseles 01–06 | `SectionHeader`, `.carousel-wrap`, `ProductCard` |
| 7 | Banda wine — Día de las Madres | `Overline tone="inverse"`, caja `hairline-inverse-35`, `Button variant="inverse"` |
| 8 | Promesas + cierre | `Reveal`, íconos **forest**, `Button variant="link-arrow"` |
| 9 | CTABanner **slate** | Global desde `layout.tsx` (la banda forest de la home es el marquee) |

## Excepciones / reglas locales

- **Cupo forest**: la única banda full-bleed forest de la home es el `Marquee` (bloque 2); por eso el `CTABanner` de esta página queda slate. No añadir otra banda forest.
- **Única banda wine de la página** (bloque 7); no añadir otra.
- Carrusel **02 "Lo más pedido"** ordenado con `stableRank(id)` (hash determinista, cache-friendly). No reintroducir `Math.random()`.
- **Hero (v4.2)**: doble video Cloudinary del cloud `ppo6ze2s` en secuencia con crossfade — `q_auto:good,w_1440,c_limit` y `w_960` móvil (`<768px`), posters `so_1,f_jpg,q_auto,w_1600`; secuencia por `ended` → `play()` del siguiente → fundido de 400ms al evento `playing` (commit a 450ms y después pausa+rebobina del saliente); armado del siguiente al 50% (`timeupdate` → `preload="auto"`); pausa con pestaña oculta o hero <20% visible; fallback al poster por clip con `onError`; sin `loop`; reduced-motion = solo poster del clip 0.
- **Hero — escala y medidas**: sección `h-[86vh] max-h-[940px] min-h-[640px]`; H1 `clamp(2.75rem, min(11vw, 13.5vh), 9.5rem)`; contenedor `pt-[clamp(4.5rem,11vh,8rem)]` + `pb-16 md:pb-24`; CTAs `mb-2 md:mb-0`; barra puente con filas `min-h-11 py-2` en móvil y `sm:min-h-14` (antes min-h-14 siempre).
- **Velos del hero**: plano slate al 30% + refuerzo al 55% enmascarado (misma tinta). No convertir en degradado multicolor.
- **Foco sobre video**: el CTA `primary` del hero sobreescribe el anillo a off-white (`focus-visible:ring-zoa-surface!`); nunca forest sobre video.
- **Métricas**: cifras en Bodoni `clamp(2.5rem,6vw,5rem)` con `tabular` y color **forest**; separadas por hairlines, no por tarjetas.
- **Carruseles container-bound**: `.carousel-wrap` va **dentro de `.container-zoa`** (hereda max-width 1600 y gutter), sin spacers ni `scroll-padding-left`; scroller `tabIndex={0}`, `role="region"` y `aria-label="<título> — desplazable horizontalmente"`; snap `x proximity` (CSS). Motivo: con spacers desbordaba en viewports >1600px.
- **CollectionIndex**: preview sticky solo pointer fino (`.pointer-fine-only`); en táctil la lista numerada es autosuficiente (sin info hover-only). Numerales forest; fila activa con barra 2px + numeral Bodoni itálica forest.
- CTAs del destacado: `link-arrow` + `outline` (ambos forest); CTAs del hero: `primary` + `ghost-inverse`; CTA de la banda wine: `inverse`.
- **Hidratación (v4.3)**: `HeroSection` y `Marquee` usan el patrón `rm = mounted && reduceMotion` (`components/ui/useMounted.ts`, §8.1 del MASTER). SSR y primer render del cliente sirven el video/marquee (mismo markup); las variantes estáticas RM (poster del clip 0 / marquee centrado estático) entran solo post-mount. No volver a leer `useReducedMotion` directo en `initial`/`style`/rama de render.
