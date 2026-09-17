# Home — overrides v4

> Referencia: `MASTER.md` §6.1. Sin desviaciones estructurales; se documentan las particularidades verificadas de `app/page.tsx` y sus componentes.

## Estructura (9 bloques)

| # | Bloque | Componentes |
|---|---|---|
| 1 | Hero | `HeroSection`, `Button` (`primary`, `ghost-inverse`) |
| 2 | Marquee slate | `Marquee variant="slate"` |
| 3 | Intro editorial + métricas | `Overline`, `Reveal`, cifras Bodoni tabular |
| 4 | Destacado 8/4 | `ImageReveal`, `Overline`, `Button` (`link-arrow`, `outline`) |
| 5 | Índice de colecciones | `SectionHeader`, `CollectionIndex` |
| 6 | Carruseles 01–06 | `SectionHeader`, `.carousel-wrap`, `ProductCard` |
| 7 | Banda wine — Día de las Madres | `Overline tone="inverse"`, caja `hairline-inverse-35`, `Button variant="inverse"` |
| 8 | Promesas + cierre | `Reveal`, `Button variant="link-arrow"` |
| 9 | CTABanner slate | Global desde `layout.tsx` |

## Excepciones / reglas locales

- **Única banda wine de la página** (bloque 7); no añadir otra.
- Carrusel **02 "Lo más pedido"** ordenado con `stableRank(id)` (hash determinista, cache-friendly). No reintroducir `Math.random()`.
- **Hero**: velo plano slate al 30% + refuerzo al 55% enmascarado (misma tinta). No convertir en degradado multicolor.
- **Métricas**: cifras en Bodoni `clamp(2.5rem,6vw,5rem)` con `tabular`; separadas por hairlines, no por tarjetas.
- **CollectionIndex**: preview sticky solo pointer fino (`.pointer-fine-only`); en táctil la lista numerada es autosuficiente (sin info hover-only).
- CTAs del destacado: `link-arrow` + `outline`; CTAs del hero: `primary` + `ghost-inverse`; CTA de la banda wine: `inverse`.
