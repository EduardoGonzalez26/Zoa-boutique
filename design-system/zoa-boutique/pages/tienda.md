# Tienda — overrides v4

> Referencia: `MASTER.md` §6.2. Sin desviaciones de ley (color, tipo, motion, layout); se documenta el comportamiento verificado de `TiendaClient.tsx`.

## Estructura

- Header editorial: breadcrumb hairline → `Overline` (categoría o "Catálogo completo") → H1 Display 1 → conteo tabular.
- Controles: select de **orden** client-side (`recomendado`, `precio-asc`, `precio-desc`, `novedades`), **densidad 2/3/4** (solo desktop; default 4) y botón "Filtrar" móvil con contador slate.
- **Sidebar desktop** `w-56` sticky `top-28` con scroll interno; **bottom sheet móvil** `max-h-[88svh]` con drag handle, scroll interno y bloque sticky "Ver N piezas" (CTA forest) + "Limpiar".
- Chips de filtros activos: `Chip variant="sand"` (categoría, colección, talla, color con swatch `leading`) y `Chip variant="outline"` (búsqueda). `EmptyState` con acción "Ver todo".
- Rejilla: `grid-cols-2` base; densidad 2 → `md:2 / xl:2`, 3 → `md:3 / xl:3`, 4 → `md:3 / xl:4`; `gap-x-4 md:gap-x-6`, `gap-y-12 md:gap-y-16`; `Reveal offset={idx % 8}` por card.

## Excepciones / notas

- No hay banda wine en esta página; el cierre slate es el CTABanner global.
- Los controles de talla (44px) y swatches de color no tienen primitiva en `components/ui/` todavía: viven en `TiendaClient`. Si otra página los reutiliza, deben extraerse al kit (regla §3 del MASTER).
- Params de URL intactos (`?q`, `?categoria`, `?coleccion`, `?talla`, `?color`); no añadir params obligatorios nuevos.
