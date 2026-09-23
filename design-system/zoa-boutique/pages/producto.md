# Producto (PDP) — overrides v4.3

> Referencia: `MASTER.md` §6.3. Sin desviaciones de ley; se documentan las particularidades verificadas de `ProductGalleryClient.tsx` y `app/product/[id]/page.tsx`.

## Estructura

- Grid 12: galería 7 / panel de información 5 (sticky en desktop).
- **Móvil**: slider scroll-snap 4/5, flechas 44px, contador `01 / N`, indicadores hairline.
- **Desktop**: raíl de miniaturas sticky `top-28` (80px; activa con borde slate) + `ImageReveal` principal 4/5 con contador overlay y zoom hover 1.03.
- Panel: overline de categoría, H1 Display 2, precio, leyenda wine italic, SKU/marca/guía/compartir (44px), swatches (círculos semánticos, anillo activo **slate**), tallas 48px con diagonal en agotadas y **seleccionada con fondo forest + tinta off-white**, indicador de stock **"Disponible" en itálica Bodoni forest** (stock >2) / **"Últimas X piezas!" en itálica wine** (stock ≤2), CTA forest full-width + **`outline` forest "Comprar ahora"**, fila de confianza con **íconos forest**, `Accordion` (chevron que **se pinta forest al abrir**), reseñas, cross-sell scroll horizontal.
- **Barra sticky inferior móvil**: aparece con `scrollY > 420`, **hairline superior `forest-35`** y CTA forest; aplica `body.zoa-hide-fab` (retira el FAB de WhatsApp) y sincroniza `aria-hidden`/`tabIndex`. No cambiar el umbral ni el mecanismo.
- Modal guía de tallas: backdrop `slate/50` + blur, panel hairline `shadow-card` (excepción de sombra permitida), iframe del artículo de tallas.

## Excepciones / notas

- **Sin enlace flotante "Catálogo"**: retirado a propósito en v4; no reintroducir.
- `data-product-name` en el contenedor de página alimenta el mensaje contextual del FAB de WhatsApp; conservar.
- La columna de galería no usa `.container-zoa` en móvil (a sangre); en desktop usa `lg:px-10 xl:px-20` equivalente al gutter maestro.
- **Ritmo vertical del PDP**: el wrapper de `app/product/[id]/page.tsx` usa `pt-28 md:pt-36` (112/144 px) para despegar del navbar fijo (96/112 px de alto) la imagen principal y el techo del raíl de miniaturas —alineados entre sí por el mismo borde superior—; la columna de galería añade `pb-6 lg:pb-12` (24/48 px) de aire bajo la foto principal (móvil: antes del panel; desktop: cierre inferior de la galería). Sin cambios en el raíl `sticky top-28`, el panel `lg:top-28`, el umbral `scrollY > 420` ni el CLS.
- Los swatches de color y las miniaturas activas siguen en slate: el forest no entra en swatches ni en la retícula de la galería (regla §1.5 del MASTER).
- **Hidratación (v4.3)**: la barra sticky móvil desactiva su transición con `rm` (`style={rm ? { transition: "none" } : undefined}`); el primer render conserva la transición CSS idéntica al SSR y el apagado RM entra post-mount (§8.1 del MASTER).
