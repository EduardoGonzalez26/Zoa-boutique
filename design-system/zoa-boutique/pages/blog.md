# Blog — overrides v4

> Referencia: `MASTER.md` §6.5. Sin desviaciones de ley; se documenta el comportamiento verificado de `app/blog/**`, `BlogCard` y `ReadingProgress`.

## Índice (`app/blog/page.tsx`)

- Header editorial: breadcrumb → `Overline` "Zoa · Revista" → H1 Display 1 + `Button variant="link-arrow"` "Ir a la tienda".
- **Destacado 7/5**: `BlogCard featured` (imagen `ImageReveal` 4/3→16/10 a sangre en la columna 7, panel de texto 5) con overline + fecha + título Display 2 + `link-arrow`.
- Rejilla de 3 con hairlines (`Reveal offset={i}` por pieza); CTA final `Button variant="primary" size="lg"`.
- Estado vacío propio con `Overline` + statement (no usa `EmptyState`); no requiere cambio.

## Artículo (`app/blog/[slug]/page.tsx`)

- Portada a sangre `clamp(260px,42vw,520px)` sobre off-white.
- Cabecera: breadcrumb, `Overline` de categoría, H1 Display 1 (`max-w-4xl`).
- Cuerpo: **`max-w-[68ch]`**, 16px/1.85, lead en Bodoni; raíl de metadatos sticky `w-44` (publicado/lectura/autoría) + `link-arrow` "Volver al blog".
- HTML inyectado con overrides: h2/h3 Bodoni, `<em>` → `not-italic` (la itálica no decora el cuerpo), blockquote con borde hairline, links subrayados.
- **`ReadingProgress`**: barra 1px forest sticky `top-16 md:top-20`; con reduced-motion queda al 100% estática.
- CTA final `primary` + "Volver al blog" solo móvil; lecturas relacionadas en rejilla de 2 sobre banda con `hairline-t`; JSON-LD `BlogPosting` intacto.

## Reglas

- Sin banda wine en el blog; el cierre slate es el CTABanner global.
- Mantener `generateStaticParams`, metadata/OpenGraph y JSON-LD.
