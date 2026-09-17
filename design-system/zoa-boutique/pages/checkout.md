# Checkout — overrides v4.3

> Referencia: `MASTER.md` §6.4. Se documentan desviaciones existentes que deben conservarse (no son deuda a "corregir" sin orden explícita).

## Flujo principal — `CartDrawer`

- Bottom sheet móvil `max-h: 95svh` con **drag handle `forest-35`** / full-height desktop (override `.cart-drawer-aside` en `globals.css`); fondo arena, borde hairline.
- Vista carrito: thumbs 4/5 sobre off-white, steppers 44px, **contador "N piezas" en forest** (dentro del overline "Tu bolsa"), **progreso de envío gratis 1px forest** (umbral $3,000) + leyenda wine italic, cupón editorial (**cupón válido en `--color-zoa-success`, que equivale a forest**; error en wine), resumen tabular, CTA forest full-width + `outline` "Seguir comprando", flujo VENDIDO.
- Vista checkout: formulario de envío con autocompletado, aviso de entrega, mini resumen y Payment Brick. Los inputs enfocan **slate** (sin acento forest).

## Página `/checkout`

- **Desviación existente**: usa `mx-auto max-w-6xl px-5 md:px-10` en lugar de `.container-zoa`; grid `[1fr_400px]`, resumen sticky `top-24` con borde hairline.
- **Overlines de sección en `overline-forest`** (constante `OVERLINE`): "Zoa · Pago seguro", "Información de envío", "Método de pago" y "Resumen del pedido".
- Inputs: radio 2px, borde `line-strong`, foco slate + anillo `slate/15`; labels micro-label uppercase.
- Payment Brick: overrides en `app/globals.css` (labels Archivo 11px/500, radios 2px, `baseColor #2B3C42`, **`baseColorFirstVariant #003628` (forest)**, `baseColorSecondVariant #1E2A2F`). No tocar la lógica Mercado Pago.

## Estados `/checkout/success` y `/checkout/failure`

- Tarjeta centrada `max-w-md` con `.hairline`, **overline `overline-forest`** ("Pedido confirmado" / "Pago no procesado"), H1 Display 2, CTA forest.
- `success`: ícono `CheckCircle` en `--color-zoa-success` (forest).
- `failure`: ícono `XCircle` wine + leyenda wine italic "Tu bolsa sigue intacta". Sin banda wine.

## Reglas

- El cierre global de estas páginas es el **CTABanner forest**; no añadir otra banda forest ni bandas wine.
- Conservar intactos cupones, envío, VENDIDO, `openCartAtCheckout` y redirecciones `?pendiente=1`.
- **Hidratación (v4.3)**: `WhatsAppButton` (FAB global, presente también en checkout) resuelve su mensaje con `useSyncExternalStore` + `getServerSnapshot` (mensaje por defecto en SSR); sin cambios de UI. El badge del carrito del `Navbar` se gatea con `isMounted` y el store `zoa-cart` no persiste estado de UI (§8.3–8.5 del MASTER).
