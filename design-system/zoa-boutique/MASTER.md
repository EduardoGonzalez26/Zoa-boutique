# ZOA BOUTIQUE — DESIGN SYSTEM v4.3 (MASTER)

> **Este documento sustituye a v4.** El estado «EDITORIAL ATELIER» está implementado en código (fases A/B + refinamiento v4.1 de acentos forest + v4.2 de hero/navbar/carrusel + v4.3 de hidratación/SSR). `tsc`/`build` verdes.
> Fuente ejecutable: `app/globals.css` (tokens y utilidades) + `components/ui/` (kit). Si hay discrepancia entre este documento y el código, manda el código y este archivo se corrige.
> Tema por defecto: **CLARO** (light-first, sin dark mode toggle).
> Alcance: SOLO frontend. Prohibido tocar `app/api/**`, `lib/**`, `store/**`, `sitemap.ts`, `next.config.ts`, `package.json`. Cero dependencias nuevas.

---

## 0. Posicionamiento

Boutique de moda femenina mexicana, editorial y segura. Ley visual v4.2:

- Fondo global **arena** `#EAE9E5`; los productos **flotan** sobre él (sin tarjetas blancas).
- Todo el texto, íconos y hairlines base en **gris pizarra** `#2B3C42` ("falso negro").
- **Bandas full-bleed de tinta** para dar profundidad tonal: **slate** (hero, cierre, marquee), **wine** (campañas; **máx. 1 por página**) y **forest** (**exactamente 1 por página**, ver §1.5).
- **Verde bosque** `#003628`: **acción principal + acento editorial** (numerales, overlines, hovers, bordes de acento y 1 banda full-bleed por página).
- **Borgoña** `#420D0D`: texto de urgencia/error y banda de campaña.
- **Off-white** `#FFF7F5`: superficies elevadas, tinta inversa sobre banda y botón `inverse`.
- Tipografía: **Archivo** (neo-grotesca tipo Helvetica) + **Bodoni Moda** (display). Escala dramática, dirección de arte por secciones.
- Retícula editorial de **hairlines de 1px**, radios **0–2px**, sombra solo en drawer/modal, movimiento tokenizado.

**Cambios v4 → v4.2 (resumen):** forest pasa de «solo botones/1px/FAB» a **color de acción + acento con cupo de exactamente 1 banda full-bleed por página** (home = `Marquee variant="forest"`; internas = `CTABanner` forest alternado por `usePathname()`); se añaden los tokens alfa `--color-zoa-forest-08/16/35/60` y las utilidades `.hairline-forest` / `.overline-forest` / `.rule-forest`; `:focus-visible` global en forest con overrides off-white sobre bandas oscuras; hero = **doble video Cloudinary en secuencia con crossfade**; navbar con **un solo panel full-bleed para el grupo activo**; carrusel **container-bound** (sin spacers); acentos forest en tarjeta, tienda, PDP, carrito, footer y blog/legal.

**Cambios v4.2 → v4.3 (resumen):** fix de **hidratación/SSR**. Nuevo hook compartido `components/ui/useMounted.ts` (`useSyncExternalStore`, snapshot de servidor `false`) y patrón obligatorio `const rm = mounted && reduceMotion` en los 10 componentes que leen `useReducedMotion` (la rama estática RM solo entra post-mount; SSR y primer render del cliente sirven el mismo markup); `app/template.tsx` pasa a **CSS puro** (`.page-enter` + `@keyframes zoa-page-enter`) y deja de ser componente cliente; `WhatsAppButton` resuelve su mensaje contextual con `useSyncExternalStore` + `getServerSnapshot`; el badge del carrito se gatea con `isMounted`. La mutación pre-hidratación del script anti-flash (`data-home`/`--nc`) se mantiene por coincidir con el render del servidor. Detalle normativo en §8.

**Historial:** v4 introdujo bandas slate/wine con tinta off-white, botón `inverse`, kit UI centralizado, motion tokenizado y contenedor 1600px. **Paleta v2 (ELIMINADA, no debe quedar rastro):** navy `#0E4067`, oro `#EFB810`, crema `#FAF8F5`, carbón `#1C1917`, oro apagado `#C9A96E`, Outfit, Work Sans.

---

## 1. Ley de color v4.2

### 1.1 Marca (exactos, invariables)

| Token | Hex | Uso permitido |
|---|---|---|
| `--color-zoa-sand` | `#EAE9E5` | **Fondo global**. Todo el sitio; los productos flotan encima |
| `--color-zoa-slate` | `#2B3C42` | **Texto base**, íconos, hairlines estructurales de 1px. También **fondo de banda full-bleed** (hero, marquee slate, CTABanner) con tinta off-white |
| `--color-zoa-forest` | `#003628` | **Acción principal** (fondo del botón primario, pagar, FAB) **+ acento editorial** (numerales, overlines de categoría, hovers, bordes de acento, íconos, cifras). **1 banda full-bleed por página** |
| `--color-zoa-wine` | `#420D0D` | Texto de urgencia/error en itálica Bodoni. **Fondo de banda full-bleed** (máx. 1 por página) con tinta off-white |
| `--color-zoa-surface` | `#FFF7F5` | Tinta inversa sobre bandas oscuras, fondo del botón `inverse`, footer, mega menú/drawer full-screen, placeholders de carga de imagen y thumbs del carrito |

### 1.2 Derivados permitidos

| Token | Valor | Uso |
|---|---|---|
| `--color-zoa-slate-900` | `#1E2A2F` | Hover/pressed sobre superficies pizarra; color de marca del Payment Brick |
| `--color-zoa-slate-60` | `rgba(43,60,66,0.62)` | Texto secundario/muted y metadatos. El copy esencial va en slate pleno |
| `--color-zoa-line` | `rgba(43,60,66,0.16)` | Hairline estándar (divisores de 1px) |
| `--color-zoa-line-strong` | `rgba(43,60,66,0.35)` | Hairline interactivo (bordes de input/botón outline) |
| `--color-zoa-forest-dark` | `#00251B` | Hover del botón verde y del FAB |
| `--color-zoa-success` | `#003628` | Confirmaciones (texto o borde; cupón válido, dirección validada). Es el mismo forest |
| `--color-zoa-error` | `#420D0D` | Errores de formulario (borde/texto, sin fondo). Es el mismo wine |

### 1.3 Alfa de forest (v4.1–v4.2)

| Token | Valor | Uso verificado |
|---|---|---|
| `--color-zoa-forest-35` | `rgba(0,54,40,0.35)` | Borde/atenuación de acento: `outline`, badges NUEVO, hairline de la barra sticky del PDP, drag handle del carrito, `.hairline-forest`, botón Filtrar, CTA outline del `EmptyState` |
| `--color-zoa-forest-08` | `rgba(0,54,40,0.08)` | Definido y disponible; **sin consumidores en el código actual** |
| `--color-zoa-forest-16` | `rgba(0,54,40,0.16)` | Definido y disponible; **sin consumidores en el código actual** |
| `--color-zoa-forest-60` | `rgba(0,54,40,0.62)` | Definido y disponible; **sin consumidores en el código actual** |

Utilidades v4.2 (nombres exactos en `globals.css`):
- `.hairline-forest` → borde 1px `forest-35` (reservado a contenedores de acento, nunca a la retícula estructural).
- `.overline-forest` → overline 10px/500/0.32em en forest (copy corto, nunca párrafos).
- `.rule-forest` → bloque de acento 2px × 24px en forest (títulos de menú del navbar).
- En componentes también se usan opacidades Tailwind puntuales sobre forest: `forest/5`, `forest/15`, `forest/35`.

### 1.4 Alfa inversos (bandas slate/wine/forest)

| Token | Valor | Uso |
|---|---|---|
| `--color-zoa-line-inverse` | `rgba(255,247,245,0.16)` | Hairline inverso sobre banda |
| `--color-zoa-line-inverse-35` | `rgba(255,247,245,0.35)` | Hairline inverso fuerte / borde de caja de cupón |
| `--color-zoa-slate-inverse-60` | `rgba(255,247,245,0.62)` | Texto muted inverso (overlines, copy secundario sobre banda) |

Utilidades: `.hairline`, `.hairline-t/-b/-l/-r` (arena) y `.hairline-inverse`, `.hairline-inverse-t/-b/-l/-r` (bandas).

### 1.5 Forest: acción, acento y cupo de banda (ley v4.1+, corregida en v4.2)

Forest es **acción + acento sobre superficies claras**, con un **cupo de exactamente 1 banda full-bleed forest por página**.

- **Acción**: fondo del botón `primary`, CTA de compra/pago, FAB de WhatsApp, `Chip variant="forest"`, talla seleccionada, filtro activo.
- **Acento (texto/ícono/borde, siempre sobre arena u off-white)**: numeral de índice del `Overline` (tone default), overlines de categoría (blog/legal/checkout), cifras métricas de la home, íconos de promesas, íconos de confianza del PDP, hovers del navbar (`--nc-hover`), badge de bolsa, rombos del anuncio, `.rule-forest`, numerales + barra activa 2px + itálica activa de `CollectionIndex`, badge NUEVO + "VER PRODUCTO" + tallas disponibles de `ProductCard`, estados activos de `TiendaClient`, "Disponible" del PDP, contador y drag handle del carrito, overlines/hovers/logo del footer, hovers del blog y páginas legales.
- **Banda full-bleed (1 por página)**: home → `Marquee variant="forest"` (el `CTABanner` de la home queda **slate**); resto de páginas → `CTABanner` **forest**. La alternancia vive en `CTABanner.tsx` con `usePathname()`. No puede haber una segunda banda forest en la misma vista.
- **`Button`**: `outline` = borde `forest-35` + texto forest + hover invierte a fondo forest con tinta off-white; `link-arrow` default = forest (`tone="inverse"` para bandas); `inverse` = fondo off-white + **texto forest** + hover sand; focus ring forest en variantes claras y off-white/surface sobre bandas oscuras.
- **`:focus-visible` global = forest** (outline 2px, offset 2, también en `.carousel-wrap` con offset 4). **Regla de auditoría**: sobre bandas oscuras (slate/wine/forest), foto o video el anillo forest se sustituye siempre por un anillo off-white/surface explícito (`ring-zoa-surface`, `ring-current` sobre video, `tone="inverse"`); el forest nunca se pinta sobre oscuro (1.17:1).
- **Velo del hero**: capas alfa del MISMO slate (`rgba(43,60,66,0.30)` + `rgba(43,60,66,0.55)` enmascarada). Es la única forma de "gradiente" permitida: alfa de un solo color o máscara de legibilidad.
- **Prohibiciones vigentes**: forest sobre slate/wine/foto/video (≈1.17:1), forest en párrafos largos, **2 bandas forest en la misma página**, forest en swatches de color o en hairlines estructurales (esos siguen slate).

### 1.6 Contraste (verificado WCAG AA)

- Slate sobre arena = **9.5:1**; slate sobre off-white = **10.9:1**; off-white sobre slate = **10.9:1**.
- Forest sobre arena = **11.2:1**; forest sobre off-white = **12.8:1**; off-white sobre forest = **12.8:1**.
- Wine sobre arena = **13.4:1**; off-white sobre wine ≈ **15.3:1**.
- Muted inverso (`slate-inverse-60`) ≈ **5.3:1** sobre slate y ≈ **6.5:1** sobre wine.
- Forest sobre slate/wine ≈ **1.17:1** → **PROHIBIDO**.
- PROHIBIDO además: blanco puro `#FFFFFF` en cualquier forma; degradados multicolor; vino como fondo fuera de su banda full-bleed única.

---

## 2. Tipografía v4.2

Cargadas con `next/font/google` en `app/layout.tsx`:

- **Texto/UI: Archivo** (300, 400, 500, 600) → `--font-archivo` → `--font-sans`.
- **Display: Bodoni Moda** (400, 500 + italic) → `--font-bodoni` → `--font-display`.

### 2.1 Escala real (verificada en código)

| Rol | Fuente | Tamaño | Interlínea / tracking | Dónde |
|---|---|---|---|---|
| Hero XL | Archivo 300 | `clamp(2.75rem, min(11vw, 13.5vh), 9.5rem)` | `0.86` / `-0.035em`, UPPERCASE | H1 del hero (`HeroSection.tsx`); tope por alto de ventana |
| Display 1 | Bodoni 400 | `clamp(2.25rem, 5.5vw, 4.75rem)` | `0.98` / `-0.02em` | H1 tienda/blog, H2 de sección (`SectionHeader`), CTABanner, statement de home, banda wine |
| Display 2 | Bodoni 400 | `clamp(1.75rem, 3.4vw, 2.9rem)` | `1.04` / `-0.02em` | H1 de PDP, `EmptyState`, destacado de home, cierres editoriales |
| Display 3 | Bodoni 400 | `clamp(1.5rem, 2.6vw, 2rem)` | `1.12` | H2 dentro del cuerpo de artículo |
| Cifras | Bodoni 400 | `clamp(2.5rem, 6vw, 5rem)` | `0.9` / `-0.02em`, `tabular` | Métricas de la intro de home (`text-zoa-forest`) |
| Lead | Archivo 400 | `clamp(1rem, 1.35vw, 1.3rem)` | `1.6` | Copys de hero/CTABanner/home |
| Overline | Archivo 500 | `10px` | `1.2` / `0.32em`, UPPERCASE | `.overline` / `.overline-on-dark` / `.overline-forest` (`Overline.tsx`) |
| Micro-label | Archivo 400 | `10px` | `1.3` / `0.22em`, UPPERCASE | `.micro-label`; metadatos, precios en card, columnas del footer |
| Nav / anuncio | Archivo 400 | `11px` / `10px` | `0.22em` / `0.25em`, UPPERCASE | Navbar y marquee de anuncio |
| Botones | Archivo 500 | `11px` | `0.18em`, UPPERCASE | `Button` (link-arrow: `10px`) |
| Body editorial | Archivo 400 | `15px` | `1.7` | Copy de secciones y cards |
| Body de lectura | Archivo 400 | `16px` | `1.85` | Cuerpo de artículo de blog |
| Muted / meta | Archivo 400 | `13px` | `1.7` | `--color-zoa-slate-60` |
| Precio | Archivo 500 | `15px` (PDP hasta `28px`) | `0.01em`, `tabular` | Cards y PDP |
| Logo watermark footer | SVG `public/logozoa.svg` vía `.zoa-logo` (máscara) | Alto `clamp(4rem, 9.6vw, 8.8rem)` · ancho ≈3.23:1 | `forest/[0.07]` | Elemento gráfico del footer |

### 2.2 Regla de itálica Bodoni (limitada)

- **Permitido en Bodoni italic**: leyendas de urgencia/error en vino (`−30% · Precios especiales`, `Últimas tallas`, `Elige una talla`, `Te faltan $X`, "Tu bolsa está vacía", "Tu bolsa sigue intacta"); **"Últimas X piezas"** en vino; **confirmación de stock "Disponible" en forest**; citas `<blockquote>` del blog; y **una** palabra de énfasis en statements editoriales (home: "carácter"), sin color.
- **`CollectionIndex` (v4.1+)**: el numeral de la fila activa pasa a Bodoni **itálica** de 15px en forest (además de la barra de 2px). Es la única itálica funcional de navegación.
- En el resto de la UI la Bodoni va en redonda.
- PROHIBIDO: Outfit, Work Sans, Marcellus, Inter y cualquier `font-serif` legacy. PROHIBIDO itálicas decorativas fuera de los casos anteriores.

### 2.3 Patrón editorial de sección

```
<Overline index="01">Nueva llegada</Overline>   ← Archivo 10px / 0.32em / numeral forest + texto slate-60
<h2> Lo nuevo </h2>                             ← Bodoni Display 1, izquierda, balance
<Button variant="link-arrow">Ver todo</Button>  ← Archivo 10px uppercase + flecha forest
──────────────────────────────────────────────  ← hairline inferior (SectionHeader)
```

---

## 3. Kit UI v4.2 (`components/ui/`) — uso obligatorio

**Regla dura:** toda página o componente nuevo usa el kit. Prohibido re-escribir clases sueltas de botón, overline, reveal o header de sección en las páginas. Si falta una variante, se añade al kit en `components/ui/`, no se duplica.

| Componente | Variantes / props clave | Especificación |
|---|---|---|
| **`Button`** | `primary`, `outline`, `ghost-inverse`, `inverse`, `link-arrow`; `size` `md` (h-12 px-7) / `lg` (h-14 px-9); `href`/`external`/`onClick`/`type`/`disabled`/`icon`; `tone` para `link-arrow` | Radio 2px, Archivo 11px/500/0.18em, `active:translate-y-px`, focus ring 2px offset 2. `primary` forest; **`outline` = borde `forest-35` + texto forest → invertido a fondo forest al hover**; `inverse` = fondo off-white + **texto forest** + hover sand (CTA sobre banda oscura); `ghost-inverse` = borde off-white/60 sobre imagen; `link-arrow` default forest, `tone="inverse"` off-white |
| **`Reveal`** | `as`, `delay`, `y` (28), `offset` (stagger 70ms, máx. 8), `once` | Entrada al viewport: opacity 0→1, y 28→0, 700ms `--ease-out-expo`, `margin:"-80px"` |
| **`ImageReveal`** | `src`, `alt`, `sizes` (**obligatorio**), `priority`, `className`, `imgClassName`, `delay`, `offset`, `decorative` | `.img-reveal`: `clip-path` `inset(10% 0 0 0)`→`0` + zoom 1.06→1, 950ms expo. Fondo off-white mientras carga |
| **`SectionHeader`** | `index`, `overline`, `title`, `action {label,href}`, `tone`, `children` | Overline numerada (numeral forest) + título Display 1 + acción `link-arrow`; cierra con `hairline-b` (o `hairline-inverse-b`) |
| **`Overline`** | `index` ("01 — "), `tone` `default`/`inverse`/**`forest`**, `as` | 10px/500/0.32em. El numeral va **forest** por defecto; con `tone="inverse"` va off-white/70; `tone="forest"` pinta todo el overline en forest (`overline-forest`) |
| **`Chip`** | `sand`, `outline`, `inverse`, **`forest`**; `onRemove`, `leading` | 10px/0.16em, radio 2px, px-3 py-2. `forest` = **fondo forest + tinta off-white** (filtro activo); con `onRemove` es botón removible con X, touch target ≥44px y focus ring según variante |
| **`Accordion`** | `items {id,label,content}`, `defaultOpenId`, `single`, `tone` | Hairlines, `aria-expanded`/`aria-controls`, chevron 300ms que **se pinta forest al abrir** (tono claro), altura animada 320ms expo; apertura instantánea con reduced-motion |
| **`EmptyState`** | `overline` (def. "Sin resultados"), `title`, `description`, `action {label,href,onClick}`, `tone` | Overline + título Display 2 + CTA **outline forest** (inversión completa al hover); `py-20 md:py-28`, `hairline-t` |

Componentes de dominio que consumen el kit: `HeroSection`, `Navbar`, `ProductCard`, `TiendaClient`, `ProductGalleryClient`, `CartDrawer`, `CTABanner`, `Footer`, `CollectionIndex`, `BlogCard`, `ReadingProgress`, `Marquee`, `NewsletterForm`, `WhatsAppButton`.

---

## 4. Motion v4.2–v4.3

Tokens en `app/globals.css`: `--ease-out-expo: cubic-bezier(0.16,1,0.3,1)`, `--ease-std: cubic-bezier(0.4,0,0.2,1)`, `--dur-hover: 240ms`, `--dur-enter: 700ms`, `--dur-reveal: 950ms`. Se conserva `--ease-out-quint: cubic-bezier(0.22,1,0.36,1)` solo para `.link-underline` (herencia v3).

| Patrón | Valores canónicos |
|---|---|
| Reveal de entrada (`Reveal`) | `opacity 0→1` · `y 28→0` · **700ms** · expo · viewport `once`, margen -80px |
| Stagger | **70ms** por paso; `offset` se limita a **8** (máx. 560ms) |
| Reveal de imagen (`.img-reveal` / `ImageReveal`) | `clip-path inset(10% 0 0 0) → inset(0)` + escala **1.06→1** · **950ms** · expo |
| Transición de página (`app/template.tsx`) | **CSS puro** (`.page-enter` + `@keyframes zoa-page-enter`, `both`): `opacity 0→1` · `y 8→0` · 420ms · expo; `prefers-reduced-motion` la neutraliza en `globals.css` (§8.2) |
| Hover estándar | **240ms** · `--ease-std` (color de botón, opacidad, retirada del FAB) |
| Subrayado `.link-underline` | `scaleX 0→1` · 240ms · `--ease-out-quint` |
| Zoom de imagen de card | `scale(1.03–1.04)` · 650–700ms · expo, contenedor `overflow-hidden` |
| Marquee | 40s lineal infinito (anuncio del navbar 38s), pausa al hover |
| Hero (doble clip) | Crossfade de opacidad **400ms** CSS (`duration-400`, expo) con commit a **450ms** (`CROSSFADE_MS`): el saliente sigue pintando el fundido y después se pausa y rebobina |
| Botones | color/opacidad; `active: translateY(1px)`. Sin escalado elástico |

- **Obligatorio** `prefers-reduced-motion`: `app/globals.css` neutraliza animaciones/transiciones, marquee, `.img-reveal` y la transición de página; los componentes con lógica RM (`Reveal`, `ImageReveal`, `Accordion`, `HeroSection`, `Marquee`, `Navbar`, `ReadingProgress`, `ProductGalleryClient`, `CTABanner`, `CollectionIndex`) lo resuelven con el patrón `rm = mounted && reduceMotion` (`components/ui/useMounted.ts`), nunca con `useReducedMotion()` directo en `initial`/`style`/rama de render (§8.1). Fallbacks verificados: hero = solo poster del clip 0; barra de scroll del navbar = 1px `forest/35`; barra de lectura = 100%; marquee = versión estática centrada. `CartDrawer` no consume `useReducedMotion`: se rige por la neutralización global de `globals.css`.
- PROHIBIDO: parallax, scroll-jacking, loops infinitos (salvo marquee) y animaciones fuera de estos tokens.

---

## 5. Layout v4.2

- **Contenedor maestro `.container-zoa`**: `max-width: 1600px` (`--container-zoa`), `margin-inline:auto`, padding lateral `1.25rem` / `md:2.5rem` / `xl:5rem` (px-5 / md:px-10 / xl:px-20).
- **Ritmo vertical**: `py-[var(--space-section)]` / `pt-[var(--space-section)]` con `--space-section: clamp(5rem, 9vw, 9rem)` → **80px a 144px** (escala nominal 80/112/144). `EmptyState` usa `py-20 md:py-28`.
- **Hairlines de 1px obligatorios** para estructurar la retícula: `.hairline*` en arena, `.hairline-inverse*` sobre bandas. `.hairline-forest` es **solo para contenedores de acento**, nunca para la retícula estructural.
- **Radios 0–2px** (`--radius-xs/sm/md/lg = 2px`). Círculos solo con valor semántico (swatches de color). PROHIBIDO `rounded-full` decorativo, `rounded-xl/2xl`.
- **Sombra**: solo `--shadow-card: 0 1px 2px rgba(43,60,66,.05)` en `CartDrawer` y modales (guía de tallas, reseñas). Nada difuso.
- **Productos flotan**: imágenes directamente sobre arena; placeholder de carga off-white; borde interior hairline opcional.
- **Carrusel nativo** `.carousel-wrap`: se coloca **dentro de `.container-zoa`** (hereda max-width 1600px y gutter), **sin spacers ni `scroll-padding-left`**. Scroller con `tabIndex={0}`, `role="region"` y `aria-label="<título> — desplazable horizontalmente"`; `:focus-visible` outline forest con offset 4; snap `x proximity`; gap `0.75rem` (`md: 1.25rem`); scrollbar oculta. Motivo: con spacers, en viewports >1600px el carrusel desbordaba el wrapper.
- Utilidades vigentes: `.overline`, `.overline-on-dark`, `.overline-forest`, `.micro-label`, `.link-underline`, `.img-reveal`, `.hairline-forest`, `.rule-forest`, `.marquee-wrap/.marquee-track`, `.tabular`, `.text-balance`, `.no-scrollbar`, `.vertical-rl`, `.pointer-fine-only`, `.pointer-coarse-only`, `.carousel-wrap/.carousel-item`, `body.zoa-hide-fab`.
- Selección `rgba(0,54,40,.14)` (tinte forest); scrollbar 6px slate/arena; `html { font-size: 16px }`; anti-zoom iOS (inputs 16px <1024px) y overrides del Payment Brick en `globals.css`.

---

## 6. Inventario de superficies v4.2

### 6.0 Navbar (global, `Navbar.tsx`) — reestructurado en v4.2

- **Fila superior real**: Logo (`logozoa.svg` enmascarado con `.zoa-logo` sobre `--nc`/`--nc-hover`; 71×22 px < lg, 84×26 px ≥ lg) · **Inicio · Colecciones ▾ · Categorías ▾ · Tienda ▾** · lupa · bolsa. **Blog y Rastrear envío ya NO están en la fila**: viven dentro del grupo **Tienda** (mega menú desktop y drawer móvil).
- **Barra de anuncio** (arena, marquee 38s, rombos hairline forest) que colapsa a `h-0` al scroll; **barra de progreso de scroll 1px forest** en el borde superior (reduced-motion: `forest/35` estático).
- **Estados de tinta**: sobre el hero de la home sin scroll y sin paneles, off-white (`--nc`, hover off-white/72); nav sólido (`data-scrolled`, `data-panel` o página interna), slate con **hover forest** (`--nc-hover`). Un panel desplegado (mega menú o búsqueda) siempre pinta la navbar sólida —nunca queda sobre una navbar transparente— y `Navbar.tsx` escribe `--nc`/`--nc-hover` inline desde un único booleano `solidNav`. Un script inline en `layout.tsx` fija `data-home`/`--nc` antes de la hidratación.
- **Un solo panel full-bleed `#mega-menu`** (off-white, `hidden` bajo `md`) que renderiza **solo el grupo activo** (`OpenMenu = "collections" | "categories" | "shop"`); `motion.div key={openMenu}` con fade de 180ms **sin `mode="wait"`**; el chevron rota solo el trigger activo; `role="region"` + `aria-label` por menú; abre con `onMouseEnter`, alterna por click (touch/teclado) y cierra con Escape, click-outside o al salir del header con el puntero; títulos con `.rule-forest`; links con hover forest.
  - **Colecciones**: lista 01–05 + **"Lo más vendido"** en `xl` con `link-arrow`. El bloque muestra un **crossfade de las 4 prendas más vendidas** (foto principal del catálogo, enlace al PDP, avance cada 4 s; estático con reduced motion o una sola prenda) calculadas por `getBestSellers()` (`lib/googleSheets.ts`) desde la pestaña **Ventas** y pasadas como prop server-side desde `layout.tsx`. Sin datos cae al poster del clip `two-models-walking` (cloud `ppo6ze2s`).
  - **Categorías**: grid de 3 columnas + CTA.
  - **Tienda**: 4 enlaces en 2 columnas (Todos los productos, Blog, Cambios y devoluciones, Rastrear envío) + bloque `xl` "Atención personalizada" (WhatsApp / teléfono / Instagram).
- **Bolsa**: badge forest solo en móvil (`md:hidden`, "99+" si >99) y label "Bolsa (N)" en desktop; la lupa abre el panel de búsqueda (focos slate, sin forest).
- **Drawer móvil espejo** full-screen off-white: búsqueda → Inicio (numeral 01 forest) → Colecciones (numerales forest) → Categorías (2 columnas) → Tienda → contacto, con hovers forest.

### 6.1 Home — 9 bloques (`app/page.tsx`)

| # | Bloque | Estructura | Notas |
|---|---|---|---|
| 1 | **Hero** | 86vh (`h-[86vh] max-h-[940px] min-h-[640px]`); **dos clips Cloudinary (`ppo6ze2s`) en secuencia con crossfade** + 2 velos alfa slate; H1 Hero XL; raíl vertical "01 — Colección 2026"; barra puente de 3 columnas | CTA `primary` "Ver productos" (focus ring off-white sobre video) + `ghost-inverse`; indicador de scroll hairline |
| 2 | **Banda forest (fina)** | Full-bleed | `Marquee variant="forest"` — **la única banda forest de la home** §1.5 |
| 3 | **Intro editorial** | Overline "La casa" + statement Display 1 (una itálica) + lead + 3 métricas Bodoni tabular **forest** | Métricas: 100+ piezas · 3–5 días · $3,000; hairlines verticales |
| 4 | **Destacado** | Grid 12: imagen 8 / panel 4; `ImageReveal` 3/4→16/11→5/4 | CTA `link-arrow` "Ver la pieza" (forest) + `outline` "Toda la colección" (inversión forest) |
| 5 | **Índice de colecciones** | `SectionHeader` + `CollectionIndex`: lista 7 / preview sticky 5 (`pointer-fine-only`) | Preview 520px `top-32`; numerales forest, activa con barra 2px + itálica Bodoni forest; en táctil la lista es autosuficiente |
| 6 | **Carruseles 01–06** | `SectionHeader` numerado + `.carousel-wrap` **container-bound** con `ProductCard` | 01 Lo nuevo · 02 Lo más pedido · 03 Blusas · 04 Sweaters · 05 Pantalones · 06 De Temporada; mismo filtro/slice que v3 |
| 7 | **Banda wine · Día de las Madres** | Full-bleed; grid 12: texto 7 / imagen 5; caja de cupón `hairline-inverse-35` | **Única banda wine de la home**; CTA `inverse` size lg |
| 8 | **Promesas de servicio** | 3 columnas hairline + cierre editorial; íconos **forest** | `link-arrow` "Leer el blog" |
| 9 | **CTABanner slate** | Global desde `layout.tsx` | Cierre editorial antes del footer |

### 6.2 Tienda (`TiendaClient.tsx`)

- Header editorial: breadcrumb hairline, `Overline` (categoría o "Catálogo completo"), H1 Display 1, conteo tabular con **cifra forest**.
- Controles: **orden** client-side (recomendado, precio ↑/↓, novedades) con foco forest; **densidad 2/3/4** (solo desktop; activo en slate, sin cambios); botón "Filtrar" móvil **borde `forest-35` + texto forest + contador forest**.
- **Sidebar desktop** `w-56`, sticky `top-28`; **bottom sheet móvil** `max-h-[88svh]` con **drag handle 1px forest (pleno)**, scroll interno y bloque sticky de confirmación (CTA forest "Ver N piezas" + "Limpiar" outline slate).
- **Filtros activos en forest**: fila con **barra de 2px (`w-0.5 h-3.5`)** + texto forest; **talla seleccionada con fondo forest**; **`Chip variant="forest"`** (categoría, colección, talla, color con swatch `leading`, búsqueda) + "Limpiar todo" slate. `EmptyState` con acción outline forest.
- Grid: `gap-x-4 md:gap-x-6`, `gap-y-12 md:gap-y-16`; cada card con `Reveal offset={idx % 8}`; animación `layout` al filtrar.
- Sin banda wine. Params `?q/?categoria/?coleccion/?talla/?color` intactos.

### 6.3 PDP (`ProductGalleryClient.tsx`)

- Grid 12: galería 7 / panel 5.
- **Móvil**: slider scroll-snap 4/5 + flechas 44px + contador `01 / N` + indicadores hairline. **Desktop**: raíl de miniaturas sticky `top-28` (80px, activa con borde slate) + `ImageReveal` 4/5 con contador en overlay.
- Panel sticky `lg:top-28` con scroll interno: overline de categoría, H1 Display 2, precio, leyenda wine, SKU/marca/guía/compartir, swatches (anillo activo slate), tallas 48px con diagonal en agotadas y **seleccionada en forest**, **"Disponible" en itálica forest** / "Últimas X piezas" en vino, CTA forest full-width + **`outline` forest "Comprar ahora"**, fila de confianza con **íconos forest**, `Accordion` (chevron abierto forest), reseñas, cross-sell.
- **Barra sticky inferior móvil** (aparece con `scrollY > 420`): nombre + precio + CTA forest; **hairline superior `forest-35`**; mientras está visible aplica **`body.zoa-hide-fab`** (retira el FAB de WhatsApp) y gestiona `aria-hidden`/`tabIndex`.
- Modal guía de tallas: backdrop `slate/50` + blur, panel hairline con `shadow-card`, iframe del artículo.
- **Sin enlace flotante "Catálogo"**: retirado a propósito en v4; no reintroducir.

### 6.4 Carrito y checkout (`CartDrawer.tsx`, `app/checkout/**`)

- **Bottom sheet móvil** (`max-h: 95svh`, drag handle **`forest-35`**) / **full-height desktop** (md+), fondo arena, borde hairline.
- Vista `cart`: ítems con thumb 4/5 sobre off-white; steppers 44px; **contador "N piezas" en forest**; **progreso de envío gratis 1px forest** (umbral $3,000) + leyenda wine italic; cupón editorial (**válido = `--color-zoa-success`, forest**; error = wine); resumen tabular; CTA forest full-width "Finalizar compra" + `outline` "Seguir comprando"; flujo VENDIDO.
- Vista `checkout`: formulario de envío con autocompletado, aviso de entrega, mini resumen y Payment Brick (overrides en `globals.css`; `baseColorFirstVariant #003628`). Los inputs del formulario enfocan **slate** (sin acento forest).
- `/checkout`: **desviación existente**: `mx-auto max-w-6xl px-5 md:px-10` en vez de `.container-zoa`; grid `[1fr_400px]`, resumen sticky `top-24` con hairline; overlines de sección en `overline-forest`.
- `/checkout/success` y `/checkout/failure`: tarjeta centrada `max-w-md` con `.hairline`, overline **forest**, CTA forest; failure usa ícono wine y leyenda italic wine.

### 6.5 Blog (`app/blog/**`)

- Índice: header editorial (H1 Display 1 + `link-arrow`); **destacado 7/5** (`BlogCard featured` con `ImageReveal`); rejilla de 3 con hairlines; CTA final `primary` size lg. Las categorías de cada card van en `Overline tone="forest"` con regla `forest-35`.
- Artículo: portada a sangre `clamp(260px, 42vw, 520px)`; cabecera Display 1 con **overline de categoría forest**; raíl de metadatos sticky `w-44` + `link-arrow` "Volver al blog".
- Cuerpo: **`max-w-[68ch]`**, 16px/1.85, lead Bodoni; HTML con overrides de h2/h3 Bodoni, **h2 con hairline superior `forest-35`**, enlaces con hover forest, `<em>` → `not-italic`, blockquote con borde hairline.
- **`ReadingProgress`**: barra 1px forest sticky `top-16 md:top-20`.
- Sin banda wine; el cierre **forest** es el CTABanner global.

### 6.6 CTABanner (global, `layout.tsx`)

- Banda full-bleed al pie de todas las páginas. **Alternancia por `usePathname()`**: home → **slate**; resto de páginas → **forest** (la única banda forest de esas vistas). Grid 12: bloque editorial 7 / columna 5; overline `inverse`, Display 1 con segunda línea en `slate-inverse-60`; CTA `Button variant="inverse" size="lg"` (off-white + texto forest, hover sand).

### 6.7 Footer (global)

- Fondo off-white; **logo watermark gigante** = `public/logozoa.svg` enmascarado con `.zoa-logo` (+ `.zoa-logo-footer`: alto `clamp(4rem,9.6vw,8.8rem)`, ancho ≈3.23:1) en **`forest/[0.07]`** como elemento gráfico.
- **Círculo Zoa**: grid 5/7 con `Overline` + `NewsletterForm` (captura de correo → WhatsApp; input enfoca borde forest + ring `forest/15`; botón outline forest).
- Columnas numeradas 00–03 (Zoa, Tienda, Colecciones, Información) con **títulos e índices forest** y links slate-60 con hover forest; contacto, redes (hover forest) y crédito webi.mx en la barra inferior.

### 6.8 Otras superficies con acento forest

- **Páginas legales** (`/privacidad`, `/terminos`, `/devoluciones`): overline `overline-forest` "Legal" y links con hover forest.
- **Navbar**: hover forest cuando el nav es sólido (`--nc-hover`), `rule-forest` en títulos de panel, rombos del anuncio, badge de bolsa, hover de links del mega menú/drawer.

### 6.9 `ProductCard` (componente de dominio)

- Imagen 3/4 que flota sobre arena (hairline interior de 1px, placeholder off-white); hover con segunda imagen + zoom 1.04 solo pointer fino (CSS).
- Micro-índice `01`… en slate-60 arriba a la derecha; **badge NUEVO = borde `forest-35` + texto forest**; AGOTADO = borde `line-strong` + slate.
- Marquesina "VER PRODUCTO" en strip arena/94% con **texto forest**, visible solo al hover.
- Info en slate: categoría, nombre (subrayado slate), precio tabular; leyenda de urgencia en wine italic.
- **Micro-fila de tallas** (no interactiva; visible al hover en pointer fino, o siempre con reduced-motion): disponibles en **forest**, agotadas en slate-60 tachadas opacity-40.
- Swatches de color: círculos semánticos con **anillo activo slate**; el forest no entra en swatches.

---

## 7. Accesibilidad y QA

- Contraste ≥ 4.5:1 en texto (ver §1.6); el copy esencial nunca en `slate-60`.
- `:focus-visible` global con anillo forest de 2px + offset; **sobre bandas oscuras/foto/video siempre hay override off-white/surface** (auditar cualquier interacción nueva: el forest nunca queda sobre oscuro).
- Touch targets ≥ 44px (`min-h-11` / `h-11`).
- Iconos decorativos `aria-hidden`; icon-only con `aria-label`; estado de carrito y filtros anunciado.
- `prefers-reduced-motion` respetado en CSS y componentes (ramas RM vía patrón `rm`, §8.1).
- **Hidratación**: 0 warnings de mismatch en consola con `prefers-reduced-motion` emulado y sin emular (§8.6).
- Sin overflow horizontal a 375px; probar 375/768/1024/1440/1600 (incluido >1600 para el carrusel container-bound).
- Imágenes con placeholder off-white (sin flashes blancos) y `sizes` obligatorio en `ImageReveal`.
- PROHIBIDO hover-only para información esencial en móvil: todo dato necesario debe ser visible en táctil (los previews/hover se limitan a enriquecimiento con `.pointer-fine-only`).

## 8. Hidratación y SSR (v4.3)

Fix v4.3: se eliminaron los warnings de hidratación derivados de framer-motion y la transición de página dejó de depender de JS. Estas reglas son **ley dura** para cualquier componente nuevo o modificado.

### 8.1 Regla dura: `useReducedMotion` nunca directo

- `useReducedMotion()` devuelve `null` en SSR y el valor real en el **primer render del cliente**. Por eso **ninguna rama de markup ni de estilo (`initial`/`animate`/`exit`/`transition`/`style`) puede depender directamente de él**: el HTML del servidor y el primer render del cliente divergen y React reporta mismatch.
- Patrón obligatorio (exacto):
  ```tsx
  const reduceMotion = useReducedMotion();
  const mounted = useMounted();
  const rm = mounted && reduceMotion; // false en SSR y primer render
  ```
- Hook compartido: `components/ui/useMounted.ts` — `useSyncExternalStore` con suscripción vacía, snapshot cliente `true`, `getServerSnapshot` `false`.
- Consumidores verificados (10): `Reveal`, `ImageReveal`, `Accordion`, `HeroSection`, `Marquee`, `Navbar` (vía `isMounted`), `ReadingProgress`, `ProductGalleryClient`, `CTABanner`, `CollectionIndex`.

### 8.2 Transición de página: CSS puro (prohibido JS)

- `app/template.tsx` renderiza `<div className="page-enter">` y ya no es componente cliente.
- `app/globals.css`: `@keyframes zoa-page-enter` (`opacity 0→1`, `translateY(8px→0)`) y `.page-enter { animation: zoa-page-enter 0.42s var(--ease-out-expo) both; }`.
- El bloque `@media (prefers-reduced-motion: reduce)` la neutraliza: `.page-enter { animation: none !important; }`.
- Prohibido volver a resolverla con `useReducedMotion` en JS: framer-motion captura `initial`/`transition` al montar y un flip post-mount **no cancela** la animación ya iniciada (el usuario RM seguía viendo el fade).

### 8.3 Snapshots de cliente: `useSyncExternalStore`

- Datos que solo existen en el cliente se leen con `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)`. Prohibido `typeof window !== "undefined"` en render y `suppressHydrationWarning` como parche.
- Casos verificados:
  - `WhatsAppButton`: mensaje contextual de `/product/*`; `getServerSnapshot` → `DEFAULT_MESSAGE`, snapshot cliente → `buildMessage(isProduct)` (consulta `[data-product-name]` y `location`).
  - `useMounted`: snapshot de montaje (`false` → `true`); es la base del patrón `rm`.
  - `Navbar` · badge del carrito: `count = isMounted ? itemCount() : 0`; el carrito vive en `localStorage` y no se pinta hasta montar.

### 8.4 Excepción legítima: script inline del navbar

- `app/layout.tsx` inyecta un script síncrono que fija `data-home` y `--nc` antes de la hidratación (anti-flash del navbar sobre el hero). Es la **única mutación pre-hidratación permitida**.
- Se mantiene porque los valores que escribe coinciden con el render del servidor (`isHome` y `--nc` de `Navbar`): muta el DOM hacia el mismo estado, sin cambiar el markup. Cualquier cambio futuro a esa lógica debe preservar esa equivalencia.
- Única instancia de `suppressHydrationWarning` del proyecto: el `<html>` de `app/layout.tsx` (preexistente al fix). No es un patrón a replicar; cualquier uso nuevo exige justificación.

### 8.5 Anti-patrones de hidratación (rechazo automático)

- `useReducedMotion()` directo en `initial`/`style`/`transition` o en una rama de render, sin gate de montaje.
- `suppressHydrationWarning` sin justificación (única excepción: §8.4).
- Renderizar durante la hidratación datos de `localStorage`: el store `zoa-cart` solo persiste `items`/`vipCode`/`couponDiscount`/`couponType`, nunca UI (`isOpen`/`drawerView`); aun así, todo dato persistido se lee post-mount (`isMounted`).

### 8.6 Invariante

Cualquier componente de animación debe pasar la batería «**0 warnings de hidratación**» con `prefers-reduced-motion` emulado y sin emular. Un warning de hydration mismatch bloquea el cambio.

## 9. Invariantes funcionales (NO romper)

- Rutas y query params: `/tienda?q=`, `?categoria=`, `?coleccion=`, `?talla=`, `?color=`, `/product/[id]`, `/blog/[slug]`, `/checkout/*`, tracking Skydropx.
- Flujo Mercado Pago (bricks), cupones, envíos, reseñas, zustand stores, Google Sheets.
- **Cloudinary activo: `ppo6ze2s`** (hero y mega menú). Las URLs del cloud `dsx1gi6mt` están **prohibidas**: no reintroducir.
- **Cupo "1 banda forest full-bleed por página"**: home = `Marquee variant="forest"` (CTABanner slate); internas = `CTABanner` forest. No duplicar.
- URL del hero: dos clips con `q_auto:good,w_1440,c_limit` (+ `w_960` móvil `<768px`) y posters `so_1,f_jpg`; no `f_auto` en video.
- URLs de assets (Cloudinary hero, `public/*`), metadatos SEO, JSON-LD del blog.
- Anti-zoom iOS de inputs y overrides del Payment Brick en `globals.css`.
- Semántica: `main`, `section`, `nav`, `footer`, `h1` único.
- **No tocar** `app/api/**`, `lib/**`, `store/**`, `sitemap.ts`, `next.config.ts`, `package.json`. **Cero dependencias nuevas.**
- El orden del carrusel 02 "Lo más pedido" usa **`stableRank(id)`** (hash puro y determinista); no reintroducir `Math.random()`.
- El enlace flotante **"Catálogo" del PDP fue retirado a propósito** en v4; no reintroducir.
- El mega menú superior ya no lista Blog ni Rastrear envío: viven en el grupo **Tienda** (mega menú y drawer). No duplicarlos en la fila.
- **Hidratación**: todo componente de animación pasa la batería «0 warnings de hidratación» con `prefers-reduced-motion` emulado y sin emular; cualquier mismatch bloquea el cambio (§8.6).

## 10. Anti-patrones (rechazo automático)

- Paleta v2: `#0E4067`, `#EFB810`; crema `#FAF8F5`; carbón `#1C1917`; oro `#C9A96E`.
- Outfit, Work Sans, Marcellus, Inter, cualquier `font-serif` legacy.
- **Degradados con más de un color**: solo capas alfa de un mismo color o máscaras de legibilidad (hero).
- **`#FFFFFF`** como superficie o tinta (usar `#EAE9E5` / `#FFF7F5`).
- **Bandas wine duplicadas**: más de una por página.
- **Bandas forest duplicadas**: más de una por página (home = marquee; internas = CTABanner).
- **Forest sobre slate/wine/foto/video** (1.17:1), forest en párrafos largos, forest en swatches de color o en hairlines estructurales.
- **URLs del cloud `dsx1gi6mt`** en cualquier asset.
- **Información esencial hover-only en móvil** (revelarla siempre o gatear el enriquecimiento con `.pointer-fine-only`).
- Tarjetas blancas tras los productos; off-white como fondo de página.
- Vino como fondo fuera de su banda única; colores fuera de la paleta.
- Pills, `rounded-full` decorativo, `rounded-xl/2xl`, sombras difusas, texturas de grano.
- Emojis como iconos.
- Re-escribir clases del kit `components/ui/` dentro de páginas en lugar de usar sus variantes.
- Spacers/scroll-padding para simular el gutter del carrusel (patrón retirado: usar `.carousel-wrap` dentro de `.container-zoa`).
- **`useReducedMotion()` sin gate de montaje** en `initial`/`style`/`transition` o en cualquier rama de render (patrón obligatorio `rm = mounted && reduceMotion`, §8.1).
- **`suppressHydrationWarning` como parche** de datos de cliente (única instancia existente: `<html>` de `layout.tsx`, §8.4).
- **Renderizar datos de `localStorage` durante la hidratación**: el store `zoa-cart` solo persiste `items`/`vipCode`/`couponDiscount`/`couponType`, nunca UI (`isOpen`/`drawerView`, §8.5).

## 11. Overrides por página

Cada superficie documenta sus desviaciones concretas respecto a este MASTER en `design-system/zoa-boutique/pages/`:

- `home.md` · `tienda.md` · `producto.md` · `checkout.md` · `blog.md`
