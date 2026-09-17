# ZOA BOUTIQUE — DESIGN SYSTEM v4 (MASTER)

> **Este documento sustituye a v3.** El refactor v4 «EDITORIAL ATELIER» ya está implementado en código (fases A y B; `tsc`/`build` verdes).
> Fuente ejecutable: `app/globals.css` (tokens y utilidades) + `components/ui/` (kit). Si hay discrepancia entre este documento y el código, manda el código y este archivo se corrige.
> Tema por defecto: **CLARO** (light-first, sin dark mode toggle).
> Alcance: SOLO frontend. Prohibido tocar `app/api/**`, `lib/**`, `store/**`, `sitemap.ts`, `next.config.ts`, `package.json`. Cero dependencias nuevas.

---

## 0. Posicionamiento

Boutique de moda femenina mexicana, editorial y segura. Ley visual v4:

- Fondo global **arena** `#EAE9E5`; los productos **flotan** sobre él (sin tarjetas blancas).
- Todo el texto, íconos y hairlines en **gris pizarra** `#2B3C42` ("falso negro").
- **Bandas full-bleed de tinta** para dar profundidad tonal: **slate** (cierre global, hero, marquee) y **wine** (campañas; **máx. 1 por página**), con texto off-white.
- **Verde bosque** `#003628`: acción principal y señales de progreso/FAB (ver §1.4).
- **Borgoña** `#420D0D`: texto de urgencia/error y banda de campaña.
- **Off-white** `#FFF7F5`: superficies elevadas, tinta inversa sobre banda y botón `inverse`.
- Tipografía: **Archivo** (neo-grotesca tipo Helvetica) + **Bodoni Moda** (display). Escala dramática, dirección de arte por secciones.
- Retícula editorial de **hairlines de 1px**, radios **0–2px**, sombra solo en drawer/modal, movimiento tokenizado.

**Cambios v3 → v4 (resumen):** se autorizan bandas slate/wine con tinta off-white; nace el botón `inverse`; forest se extiende a barras de progreso y FAB; escala tipográfica XL; kit UI centralizado en `components/ui/` con uso obligatorio; motion tokenizado (`--ease-out-expo`/`--ease-std` · 240/700/950ms); contenedor 1600px y ritmo `clamp(5rem, 9vw, 9rem)`; overrides por página en `design-system/zoa-boutique/pages/`.

**Paleta v2 (ELIMINADA, no debe quedar rastro):** navy `#0E4067`, oro `#EFB810`, crema `#FAF8F5`, carbón `#1C1917`, oro apagado `#C9A96E`, Outfit, Work Sans.

---

## 1. Ley de color v4

### 1.1 Marca (exactos, invariables)

| Token | Hex | Uso permitido |
|---|---|---|
| `--color-zoa-sand` | `#EAE9E5` | **Fondo global**. Todo el sitio; los productos flotan encima |
| `--color-zoa-slate` | `#2B3C42` | **Todo el texto**, íconos, hairlines de 1px. También **fondo de banda full-bleed** (hero, marquee slate, CTABanner) con tinta off-white |
| `--color-zoa-forest` | `#003628` | **Acción principal**: fondo del botón primario ("Añadir a la bolsa", pagar). Excepciones 1px/FAB en §1.4. Texto `#FFF7F5` |
| `--color-zoa-wine` | `#420D0D` | Texto de urgencia/error en itálica Bodoni. **Fondo de banda full-bleed** (máx. 1 por página) con tinta off-white |
| `--color-zoa-surface` | `#FFF7F5` | Tinta inversa sobre bandas oscuras, fondo del botón `inverse`, footer, mega menú/drawer full-screen, placeholders de carga de imagen y thumbs del carrito |

### 1.2 Derivados permitidos (arena)

| Token | Valor | Uso |
|---|---|---|
| `--color-zoa-slate-900` | `#1E2A2F` | Hover/pressed sobre superficies pizarra; color de marca del Payment Brick |
| `--color-zoa-slate-60` | `rgba(43,60,66,0.62)` | Texto secundario/muted y metadatos. El copy esencial va en slate pleno |
| `--color-zoa-line` | `rgba(43,60,66,0.16)` | Hairline estándar (divisores de 1px) |
| `--color-zoa-line-strong` | `rgba(43,60,66,0.35)` | Hairline interactivo (bordes de input/botón outline) |
| `--color-zoa-forest-dark` | `#00251B` | Hover del botón verde y del FAB |
| `--color-zoa-success` | `#003628` | Confirmaciones (texto o borde; cupón válido, dirección validada) |
| `--color-zoa-error` | `#420D0D` | Errores de formulario (borde/texto, sin fondo) |

### 1.3 Derivados alfa inversos (nuevos en v4, para bandas slate/wine)

| Token | Valor | Uso |
|---|---|---|
| `--color-zoa-line-inverse` | `rgba(255,247,245,0.16)` | Hairline inverso sobre banda |
| `--color-zoa-line-inverse-35` | `rgba(255,247,245,0.35)` | Hairline inverso fuerte / borde de caja de cupón |
| `--color-zoa-slate-inverse-60` | `rgba(255,247,245,0.62)` | Texto muted inverso (overlines, copy secundario sobre banda) |

Utilidades: `.hairline`, `.hairline-t/-b/-l/-r` (arena) y `.hairline-inverse`, `.hairline-inverse-t/-b/-l/-r` (bandas).

### 1.4 Reglas de banda y excepciones forest

- **Slate full-bleed**: hero (fondo), marquee `variant="slate"` y **CTABanner global** (una vez por página, en `layout.tsx`). Texto off-white / muted inverso; CTA `inverse` o `ghost-inverse`.
- **Wine full-bleed**: **máximo 1 por página** (home: "Día de las Madres"). Nunca dos bandas wine en la misma vista.
- Sobre banda oscura: hairlines `.hairline-inverse*`, overline `tone="inverse"`, CTA `Button variant="inverse"` (fondo off-white + texto slate; hover fondo sand) o `ghost-inverse` (borde off-white/60) sobre imagen.
- **Velo del hero**: capas alfa del MISMO slate (`rgba(43,60,66,0.30)` + `rgba(43,60,66,0.55)` enmascarada). Es la única forma de "gradiente" permitida: alfa de un solo color o máscara de legibilidad.
- **Excepciones forest** (fuera de botones/CTA):
  1. Barra de progreso de scroll del navbar (1px en el borde superior; con reduced-motion queda `forest/35` estático).
  2. Barra de progreso de envío gratis del carrito (1px, anchura animada).
  3. Barra de progreso de lectura del blog (1px).
  4. FAB de WhatsApp (superficie 52px, ícono off-white).
- **Prohibido**: forest como texto, como indicador de filtro activo o como relleno de chips/superficies grandes. El indicador de filtro activo es slate.

### 1.5 Contraste (verificado WCAG AA)

- Slate sobre arena = **9.5:1** (lectura perfecta).
- Slate sobre off-white = **10.9:1**.
- Off-white sobre slate = **10.9:1**.
- Off-white sobre forest = **12.8:1**.
- Wine sobre arena = **13.4:1**.
- Off-white sobre wine ≈ **15.3:1**.
- Muted inverso (`slate-inverse-60`) ≈ **5.3:1** sobre slate y ≈ **6.5:1** sobre wine.
- PROHIBIDO: verde como texto o superficie grande; blanco puro `#FFFFFF` en cualquier forma; degradados multicolor; vino como fondo fuera de su banda full-bleed única.

---

## 2. Tipografía v4

Cargadas con `next/font/google` en `app/layout.tsx`:

- **Texto/UI: Archivo** (300, 400, 500, 600) → `--font-archivo` → `--font-sans`.
- **Display: Bodoni Moda** (400, 500 + italic) → `--font-bodoni` → `--font-display`.

### 2.1 Escala real (verificada en código)

| Rol | Fuente | Tamaño | Interlínea / tracking | Dónde |
|---|---|---|---|---|
| Hero XL | Archivo 300 | `clamp(3rem, 11vw, 9.5rem)` | `0.86` / `-0.035em`, UPPERCASE | H1 del hero (`HeroSection.tsx`) |
| Display 1 | Bodoni 400 | `clamp(2.25rem, 5.5vw, 4.75rem)` | `0.98` / `-0.02em` | H1 tienda/blog, H2 de sección (`SectionHeader`), CTABanner, statement de home, banda wine |
| Display 2 | Bodoni 400 | `clamp(1.75rem, 3.4vw, 2.9rem)` | `1.04` / `-0.02em` | H1 de PDP, `EmptyState`, destacado de home, cierres editoriales |
| Display 3 | Bodoni 400 | `clamp(1.5rem, 2.6vw, 2rem)` | `1.12` | H2 dentro del cuerpo de artículo |
| Cifras | Bodoni 400 | `clamp(2.5rem, 6vw, 5rem)` | `0.9` / `-0.02em`, `tabular` | Métricas de la intro de home |
| Lead | Archivo 400 | `clamp(1rem, 1.35vw, 1.3rem)` | `1.6` | Copys de hero/CTABanner/home |
| Overline | Archivo 500 | `10px` | `1.2` / `0.32em`, UPPERCASE | `.overline` / `.overline-on-dark` (`Overline.tsx`) |
| Micro-label | Archivo 400 | `10px` | `1.3` / `0.22em`, UPPERCASE | `.micro-label`; metadatos, precios en card, columnas del footer |
| Nav / anuncio | Archivo 400 | `11px` / `10px` | `0.22em` / `0.25em`, UPPERCASE | Navbar y marquee de anuncio |
| Botones | Archivo 500 | `11px` | `0.18em`, UPPERCASE | `Button` (link-arrow: `10px`) |
| Body editorial | Archivo 400 | `15px` | `1.7` | Copy de secciones y cards |
| Body de lectura | Archivo 400 | `16px` | `1.85` | Cuerpo de artículo de blog |
| Muted / meta | Archivo 400 | `13px` | `1.7` | `--color-zoa-slate-60` |
| Precio | Archivo 500 | `15px` (PDP hasta `28px`) | `0.01em`, `tabular` | Cards y PDP |
| Wordmark footer | Bodoni 400 | `clamp(5rem, 12vw, 11rem)` | `0.8` / `slate/[0.08]` | Elemento gráfico del footer |

### 2.2 Regla de itálica Bodoni (limitada)

- **Permitido en Bodoni italic**: leyendas de urgencia/error en vino (`−30% · Precios especiales`, `Últimas tallas`, `Elige una talla`, `Te faltan $X`, "Tu bolsa está vacía", "Tu bolsa sigue intacta"); citas `<blockquote>` del blog; y **una** palabra de énfasis en statements editoriales (home: "carácter"), sin color.
- En el resto de la UI la Bodoni va en redonda. La `CollectionIndex` enfatiza el número activo cambiando a Bodoni **no-itálica**, no con cursiva.
- PROHIBIDO: Outfit, Work Sans, Marcellus, Inter y cualquier `font-serif` legacy. PROHIBIDO itálicas decorativas fuera de los casos anteriores.

### 2.3 Patrón editorial de sección

```
<Overline index="01">Nueva llegada</Overline>   ← Archivo 10px / 0.32em / slate-60
<h2> Lo nuevo </h2>                             ← Bodoni Display 1, izquierda, balance
<Button variant="link-arrow">Ver todo</Button>  ← Archivo 10px uppercase + flecha
──────────────────────────────────────────────  ← hairline inferior (SectionHeader)
```

---

## 3. Kit UI v4 (`components/ui/`) — uso obligatorio

**Regla dura:** toda página o componente nuevo usa el kit. Prohibido re-escribir clases sueltas de botón, overline, reveal o header de sección en las páginas. Si falta una variante, se añade al kit en `components/ui/`, no se duplica.

| Componente | Variantes / props clave | Especificación |
|---|---|---|
| **`Button`** | `primary`, `outline`, `ghost-inverse`, `inverse`, `link-arrow`; `size` `md` (h-12 px-7) / `lg` (h-14 px-9); `href`/`external`/`onClick`/`type`/`disabled`/`icon`; `tone` para `link-arrow` | Radio 2px, Archivo 11px/500/0.18em, `active:translate-y-px`, focus ring 2px offset 2. `inverse` = fondo off-white + texto slate + hover sand (CTA sobre banda oscura) |
| **`Reveal`** | `as`, `delay`, `y` (28), `offset` (stagger 70ms, máx. 8), `once` | Entrada al viewport: opacity 0→1, y 28→0, 700ms `--ease-out-expo`, `margin:"-80px"` |
| **`ImageReveal`** | `src`, `alt`, `sizes` (**obligatorio**), `priority`, `className`, `imgClassName`, `delay`, `offset`, `decorative` | `.img-reveal`: `clip-path` `inset(10% 0 0 0)`→`0` + zoom 1.06→1, 950ms expo. Fondo off-white mientras carga |
| **`SectionHeader`** | `index`, `overline`, `title`, `action {label,href}`, `tone`, `children` | Overline numerada + título Display 1 + acción `link-arrow`; cierra con `hairline-b` (o `hairline-inverse-b`) |
| **`Overline`** | `index` ("01 — "), `tone` `default`/`inverse`, `as` | 10px/500/0.32em. Base de toda la jerarquía editorial |
| **`Chip`** | `sand`, `outline`, `inverse`; `onRemove`, `leading` | 10px/0.16em, radio 2px, px-3 py-2. Con `onRemove` es botón removible con X y touch target ≥44px |
| **`Accordion`** | `items {id,label,content}`, `defaultOpenId`, `single`, `tone` | Hairlines, `aria-expanded`/`aria-controls`, chevron 300ms, altura animada 320ms expo; apertura instantánea con reduced-motion |
| **`EmptyState`** | `overline` (def. "Sin resultados"), `title`, `description`, `action {label,href,onClick}`, `tone` | Overline + título Display 2 + CTA outline con flecha; `py-20 md:py-28`, `hairline-t` |

Componentes de dominio que consumen el kit: `HeroSection`, `Navbar`, `ProductCard`, `TiendaClient`, `ProductGalleryClient`, `CartDrawer`, `CTABanner`, `Footer`, `CollectionIndex`, `BlogCard`, `ReadingProgress`, `Marquee`, `NewsletterForm`, `WhatsAppButton`.

---

## 4. Motion v4

Tokens en `app/globals.css`: `--ease-out-expo: cubic-bezier(0.16,1,0.3,1)`, `--ease-std: cubic-bezier(0.4,0,0.2,1)`, `--dur-hover: 240ms`, `--dur-enter: 700ms`, `--dur-reveal: 950ms`. Se conserva `--ease-out-quint: cubic-bezier(0.22,1,0.36,1)` solo para `.link-underline` (herencia v3).

| Patrón | Valores canónicos |
|---|---|
| Reveal de entrada (`Reveal`) | `opacity 0→1` · `y 28→0` · **700ms** · expo · viewport `once`, margen -80px |
| Stagger | **70ms** por paso; `offset` se limita a **8** (máx. 560ms) |
| Reveal de imagen (`.img-reveal` / `ImageReveal`) | `clip-path inset(10% 0 0 0) → inset(0)` + escala **1.06→1** · **950ms** · expo |
| Transición de página (`app/template.tsx`) | `opacity 0→1` · `y 8→0` · 420ms · expo |
| Hover estándar | **240ms** · `--ease-std` (color de botón, opacidad, retirada del FAB) |
| Subrayado `.link-underline` | `scaleX 0→1` · 240ms · `--ease-out-quint` |
| Zoom de imagen de card | `scale(1.03–1.04)` · 650–700ms · expo, contenedor `overflow-hidden` |
| Marquee | 40s lineal infinito (anuncio del navbar 38s), pausa al hover |
| Botones | color/opacidad; `active: translateY(1px)`. Sin escalado elástico |

- **Obligatorio** `prefers-reduced-motion`: `app/globals.css` neutraliza animaciones/transiciones, marquee, `.img-reveal`; los componentes (`Reveal`, `ImageReveal`, `Accordion`, `HeroSection`, `Navbar`, `ReadingProgress`, `CartDrawer`) tienen fallback estático.
- PROHIBIDO: parallax, scroll-jacking, loops infinitos (salvo marquee) y animaciones fuera de estos tokens.

---

## 5. Layout v4

- **Contenedor maestro `.container-zoa`**: `max-width: 1600px` (`--container-zoa`), `margin-inline:auto`, padding lateral `1.25rem` / `md:2.5rem` / `xl:5rem` (px-5 / md:px-10 / xl:px-20).
- **Ritmo vertical**: `py-[var(--space-section)]` / `pt-[var(--space-section)]` con `--space-section: clamp(5rem, 9vw, 9rem)` → **80px a 144px** (escala nominal 80/112/144, equivalente a `py-20 md:py-28 lg:py-36`). `EmptyState` usa `py-20 md:py-28`.
- **Hairlines de 1px obligatorios** para estructurar la retícula: `.hairline*` en arena, `.hairline-inverse*` sobre bandas.
- **Radios 0–2px** (`--radius-xs/sm/md/lg = 2px`). Círculos solo con valor semántico (swatches de color). PROHIBIDO `rounded-full` decorativo, `rounded-xl/2xl`.
- **Sombra**: solo `--shadow-card: 0 1px 2px rgba(43,60,66,.05)` en `CartDrawer` y modales (guía de tallas, reseñas). Nada difuso.
- **Productos flotan**: imágenes directamente sobre arena; placeholder de carga off-white; borde interior hairline opcional.
- **Carrusel nativo** `.carousel-wrap`: scroll horizontal con snap `x proximity`, spacers que replican el gutter (`w-5 / md:w-10 / xl:w-20`), scrollbar oculta.
- Utilidades vigentes: `.overline`, `.overline-on-dark`, `.micro-label`, `.link-underline`, `.img-reveal`, `.marquee-wrap/.marquee-track`, `.tabular`, `.text-balance`, `.no-scrollbar`, `.vertical-rl`, `.pointer-fine-only`, `.pointer-coarse-only`, `.carousel-wrap/.carousel-item`, `body.zoa-hide-fab`.
- Selección `rgba(43,60,66,.15)`; scrollbar 6px slate/arena; `html { font-size: 16px }`; anti-zoom iOS (inputs 16px <1024px) y overrides del Payment Brick en `globals.css`.

---

## 6. Inventario de superficies v4

### 6.1 Home — 9 bloques (`app/page.tsx`)

| # | Bloque | Estructura | Notas |
|---|---|---|---|
| 1 | **Hero** | 86vh; video Cloudinary + 2 velos alfa slate; H1 Hero XL; raíl vertical "01 — Colección 2026"; barra puente de 3 columnas | CTA `primary` "Ver productos" + `ghost-inverse`; indicador de scroll hairline |
| 2 | **Marquee slate** | Banda fina full-bleed | `Marquee variant="slate"` |
| 3 | **Intro editorial** | Overline "La casa" + statement Display 1 (una itálica) + lead + 3 métricas Bodoni tabular | Métricas: 100+ piezas · 3–5 días · $3,000; hairlines verticales |
| 4 | **Destacado** | Grid 12: imagen 8 / panel 4; `ImageReveal` 3/4→16/11→5/4 | CTA `link-arrow` "Ver la pieza" + `outline` "Toda la colección" |
| 5 | **Índice de colecciones** | `SectionHeader` + `CollectionIndex`: lista 7 / preview sticky 5 (`pointer-fine-only`) | Preview 520px con etiqueta activa; en táctil la lista es autosuficiente |
| 6 | **Carruseles 01–06** | `SectionHeader` numerado + `.carousel-wrap` con `ProductCard` | 01 Lo nuevo · 02 Lo más pedido · 03–06 categorías/temporada; mismo filtro/slice que v3 |
| 7 | **Banda wine · Día de las Madres** | Full-bleed; grid 12: texto 7 / imagen 5; caja de cupón `hairline-inverse-35` | **Única banda wine de la home**; CTA `inverse` size lg |
| 8 | **Promesas de servicio** | 3 columnas hairline + cierre editorial | `link-arrow` "Leer el blog" |
| 9 | **CTABanner slate** | Global desde `layout.tsx` (§6.6) | Cierre editorial antes del footer |

### 6.2 Tienda (`TiendaClient.tsx`)

- Header editorial: breadcrumb hairline, `Overline`, H1 Display 1 (categoría o "Todos los productos"), conteo tabular.
- Controles: **orden** client-side (recomendado, precio ↑/↓, novedades), **densidad 2/3/4** (solo desktop; default 4 → `grid-cols-2` base, `md:3`, `xl:4`), botón "Filtrar" móvil con contador.
- **Sidebar desktop** `w-56`, sticky `top-28`; **bottom sheet móvil** `max-h-[88svh]` con drag handle hairline, scroll interno y bloque sticky de confirmación (CTA forest "Ver N piezas" + "Limpiar").
- Chips de filtros activos (`Chip` sand/outline) + "Limpiar todo"; `EmptyState` si no hay resultados.
- Grid: `gap-x-4 md:gap-x-6`, `gap-y-12 md:gap-y-16`; cada card con `Reveal offset={idx % 8}`; animación `layout` al filtrar.
- Sin banda wine. Params `?q/?categoria/?coleccion/?talla/?color` intactos.

### 6.3 PDP (`ProductGalleryClient.tsx`)

- Grid 12: galería 7 / panel 5.
- **Móvil**: slider scroll-snap 4/5 + flechas 44px + contador `01 / N` + indicadores hairline. **Desktop**: raíl de miniaturas sticky `top-28` (80px, activa con borde slate) + `ImageReveal` 4/5 con contador en overlay.
- Panel sticky `lg:top-28` con scroll interno: overline de categoría, H1 Display 2, precio, leyenda wine, SKU/marca/guía/compartir, swatches, tallas 48px con diagonal en agotadas, CTA forest full-width + `outline` "Comprar ahora", fila de confianza, `Accordion` (descripción/envío/cuidado), reseñas, cross-sell.
- **Barra sticky inferior móvil** (aparece con `scrollY > 420`): nombre + precio + CTA forest; mientras está visible aplica **`body.zoa-hide-fab`** (retira el FAB de WhatsApp) y gestiona `aria-hidden`/`tabIndex`.
- Modal guía de tallas: backdrop `slate/50` + blur, panel hairline con `shadow-card`, iframe del artículo.
- **Sin enlace flotante "Catálogo"**: retirado a propósito en v4; no reintroducir.

### 6.4 Carrito y checkout (`CartDrawer.tsx`, `app/checkout/**`)

- **Bottom sheet móvil** (`max-h: 95svh`, drag handle) / **full-height desktop** (md+), fondo arena, borde hairline.
- Vista `cart`: ítems con thumb 4/5 sobre off-white; steppers 44px; **progreso de envío gratis 1px forest** (umbral $3,000) + leyenda wine italic; cupón editorial; resumen tabular; CTA forest full-width "Finalizar compra" + `outline` "Seguir comprando"; flujo VENDIDO.
- Vista `checkout`: formulario de envío con autocompletado, aviso de entrega, mini resumen y Payment Brick (overrides en `globals.css`).
- `/checkout`: **desviación existente**: `mx-auto max-w-6xl px-5 md:px-10` en vez de `.container-zoa`; grid `[1fr_400px]`, resumen sticky `top-24` con hairline.
- `/checkout/success` y `/checkout/failure`: tarjeta centrada `max-w-md` con `.hairline`, CTA forest; failure usa ícono wine y leyenda italic.

### 6.5 Blog (`app/blog/**`)

- Índice: header editorial (H1 Display 1 + `link-arrow`); **destacado 7/5** (`BlogCard featured` con `ImageReveal`); rejilla de 3 con hairlines; CTA final `primary` size lg.
- Artículo: portada a sangre `clamp(260px, 42vw, 520px)`; cabecera Display 1; raíl de metadatos sticky `w-44` (fecha/lectura/autoría) + `link-arrow` "Volver al blog".
- Cuerpo: **`max-w-[68ch]`**, 16px/1.85, lead Bodoni; HTML con overrides de h2/h3 Bodoni, `<em>` → `not-italic`, blockquote con borde hairline.
- **`ReadingProgress`**: barra 1px forest sticky `top-16 md:top-20`.
- Sin banda wine; el cierre slate es el CTABanner global.

### 6.6 CTABanner (global, `layout.tsx`)

- Banda **slate full-bleed** al pie de todas las páginas. Grid 12: bloque editorial 7 / columna 5; overline `inverse`, Display 1 con segunda línea en `slate-inverse-60`; CTA `Button variant="inverse" size="lg"` (off-white, hover sand).

### 6.7 Footer (global)

- Fondo off-white; **wordmark gigante** Bodoni `clamp(5rem,12vw,11rem)` en `slate/[0.08]` como elemento gráfico.
- **Círculo Zoa**: grid 5/7 con `Overline` + `NewsletterForm` (captura de correo → WhatsApp).
- Columnas numeradas 00–03 (Zoa, Tienda, Colecciones, Información) con hairlines y links; contacto, redes y crédito webi.mx en la barra inferior.

---

## 7. Accesibilidad y QA

- Contraste ≥ 4.5:1 en texto (ver §1.5); el copy esencial nunca en `slate-60`.
- `focus-visible` en todos los interactivos (anillo 2px slate; off-white sobre fondos oscuros) con offset.
- Touch targets ≥ 44px (`min-h-11` / `h-11`).
- Iconos decorativos `aria-hidden`; icon-only con `aria-label`; estado de carrito y filtros anunciado.
- `prefers-reduced-motion` respetado en CSS y componentes.
- Sin overflow horizontal a 375px; probar 375/768/1024/1440/1600.
- Imágenes con placeholder off-white (sin flashes blancos) y `sizes` obligatorio en `ImageReveal`.
- PROHIBIDO hover-only para información esencial en móvil: todo dato necesario debe ser visible en táctil (los previews/hover se limitan a enriquecimiento con `.pointer-fine-only`).

## 8. Invariantes funcionales (NO romper)

- Rutas y query params: `/tienda?q=`, `?categoria=`, `?coleccion=`, `?talla=`, `?color=`, `/product/[id]`, `/blog/[slug]`, `/checkout/*`, tracking Skydropx.
- Flujo Mercado Pago (bricks), cupones, envíos, reseñas, zustand stores, Google Sheets.
- URLs de assets (Cloudinary hero, `public/*`), metadatos SEO, JSON-LD del blog.
- Anti-zoom iOS de inputs y overrides del Payment Brick en `globals.css`.
- Semántica: `main`, `section`, `nav`, `footer`, `h1` único.
- **No tocar** `app/api/**`, `lib/**`, `store/**`, `sitemap.ts`, `next.config.ts`, `package.json`. **Cero dependencias nuevas.**
- El orden del carrusel 02 "Lo más pedido" usa **`stableRank(id)`** (hash puro y determinista); no reintroducir `Math.random()`.
- El enlace flotante **"Catálogo" del PDP fue retirado a propósito** en v4; no reintroducir.

## 9. Anti-patrones (rechazo automático)

- Paleta v2: `#0E4067`, `#EFB810`; crema `#FAF8F5`; carbón `#1C1917`; oro `#C9A96E`.
- Outfit, Work Sans, Marcellus, Inter, cualquier `font-serif` legacy.
- **Degradados con más de un color**: solo capas alfa de un mismo color o máscaras de legibilidad (hero).
- **`#FFFFFF`** como superficie o tinta (usar `#EAE9E5` / `#FFF7F5`).
- **Bandas wine duplicadas**: más de una por página.
- **Forest como texto, indicador de filtro o relleno grande** (solo botones/CTA y las excepciones 1px/FAB de §1.4).
- **Información esencial hover-only en móvil** (revelarla siempre o gatear el enriquecimiento con `.pointer-fine-only`).
- Tarjetas blancas tras los productos; off-white como fondo de página.
- Vino como fondo fuera de su banda única; colores fuera de la paleta.
- Pills, `rounded-full` decorativo, `rounded-xl/2xl`, sombras difusas, texturas de grano.
- Emojis como iconos.
- Re-escribir clases del kit `components/ui/` dentro de páginas en lugar de usar sus variantes.

## 10. Overrides por página

Cada superficie documenta sus desviaciones concretas respecto a este MASTER en `design-system/zoa-boutique/pages/`:

- `home.md` · `tienda.md` · `producto.md` · `checkout.md` · `blog.md`
</content>
