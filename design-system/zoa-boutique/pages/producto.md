# Producto (PDP) — overrides v4

> Referencia: `MASTER.md` §6.3. Sin desviaciones de ley; se documentan las particularidades verificadas de `ProductGalleryClient.tsx` y `app/product/[id]/page.tsx`.

## Estructura

- Grid 12: galería 7 / panel de información 5 (sticky en desktop).
- **Móvil**: slider scroll-snap 4/5, flechas 44px, contador `01 / N`, indicadores hairline.
- **Desktop**: raíl de miniaturas sticky `top-28` (80px; activa con borde slate) + `ImageReveal` principal 4/5 con contador overlay y zoom hover 1.03.
- Panel: overline de categoría, H1 Display 2, precio, leyenda wine italic, SKU/marca/guía/compartir (44px), swatches (círculos semánticos), tallas 48px con diagonal en agotadas, CTA forest full-width + `outline` "Comprar ahora", fila de confianza, `Accordion` (descripción abierta por defecto), reseñas, cross-sell scroll horizontal.
- **Barra sticky inferior móvil**: aparece con `scrollY > 420`; aplica `body.zoa-hide-fab` (retira el FAB de WhatsApp) y sincroniza `aria-hidden`/`tabIndex`. No cambiar el umbral ni el mecanismo.
- Modal guía de tallas: backdrop `slate/50` + blur, panel hairline `shadow-card` (excepción de sombra permitida), iframe del artículo de tallas.

## Excepciones / notas

- **Sin enlace flotante "Catálogo"**: retirado a propósito en v4; no reintroducir.
- `data-product-name` en el contenedor de página alimenta el mensaje contextual del FAB de WhatsApp; conservar.
- La columna de galería no usa `.container-zoa` en móvil (a sangre); en desktop usa `lg:px-10 xl:px-20` equivalente al gutter maestro.
