# Tienda — overrides v4.2

> Referencia: `MASTER.md` §6.2. Sin desviaciones de ley (color, tipo, motion, layout); se documenta el comportamiento verificado de `TiendaClient.tsx`.

## Estructura

- Header editorial: breadcrumb hairline → `Overline` (categoría o "Catálogo completo") → H1 Display 1 → conteo tabular con **cifra forest**.
- Controles: select de **orden** client-side (`recomendado`, `precio-asc`, `precio-desc`, `novedades`) con foco forest; **densidad 2/3/4** (solo desktop; default 4; estado activo en slate, sin cambios); botón "Filtrar" móvil con **borde `forest-35`, texto forest y contador forest**.
- **Sidebar desktop** `w-56` sticky `top-28` con scroll interno; **bottom sheet móvil** `max-h-[88svh]` con **drag handle 1px forest**, scroll interno y bloque sticky "Ver N piezas" (CTA forest) + "Limpiar" (outline slate).
- **Estados activos en forest** (v4.1–v4.2): filas de filtro con **barra de 2px (`w-0.5 h-3.5`)** + texto forest; **talla seleccionada con fondo forest + tinta off-white**; chips de filtros activos con **`Chip variant="forest"`** (categoría, colección, talla, color con swatch `leading`, búsqueda). "Limpiar todo" y "Limpiar filtros" siguen en slate.
- `EmptyState` con acción "Ver todo" (CTA `outline` forest, inversión al hover).
- Rejilla: `grid-cols-2` base; densidad 2 → `md:2 / xl:2`, 3 → `md:3 / xl:3`, 4 → `md:3 / xl:4`; `gap-x-4 md:gap-x-6`, `gap-y-12 md:gap-y-16`; `Reveal offset={idx % 8}` por card.

## Excepciones / notas

- No hay banda wine en esta página; el cierre de las páginas internas es el **CTABanner global, que aquí es forest** (única banda forest de la vista).
- Los controles de talla (44px) y swatches de color no tienen primitiva en `components/ui/` todavía: viven en `TiendaClient`. Si otra página los reutiliza, deben extraerse al kit (regla §3 del MASTER).
- Params de URL intactos (`?q`, `?categoria`, `?coleccion`, `?talla`, `?color`); no añadir params obligatorios nuevos.
- El drag handle del bottom sheet es forest **pleno** (`bg-zoa-forest`), distinto del `forest-35` del `CartDrawer`.
