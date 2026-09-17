# Checkout — overrides v4

> Referencia: `MASTER.md` §6.4. Se documentan desviaciones existentes que deben conservarse (no son deuda a "corregir" sin orden explícita).

## Flujo principal — `CartDrawer`

- Bottom sheet móvil `max-h: 95svh` con drag handle / full-height desktop (override `.cart-drawer-aside` en `globals.css`); fondo arena, borde hairline.
- Vista carrito: thumbs 4/5 sobre off-white, steppers 44px, **progreso de envío gratis 1px forest** (umbral $3,000) + leyenda wine italic, cupón editorial, resumen tabular, CTA forest full-width + `outline` "Seguir comprando", flujo VENDIDO.
- Vista checkout: formulario de envío con autocompletado, aviso de entrega, mini resumen y Payment Brick.

## Página `/checkout`

- **Desviación existente**: usa `mx-auto max-w-6xl px-5 md:px-10` en lugar de `.container-zoa`; grid `[1fr_400px]`, resumen sticky `top-24` con borde hairline.
- Inputs: radio 2px, borde `line-strong`, foco slate + anillo `slate/15`; labels micro-label uppercase.
- Payment Brick: overrides en `app/globals.css` (labels Archivo 11px/500, radios 2px, `baseColor #2B3C42`, `baseColorFirstVariant #003628`, `baseColorSecondVariant #1E2A2F`). No tocar la lógica Mercado Pago.

## Estados `/checkout/success` y `/checkout/failure`

- Tarjeta centrada `max-w-md` con `.hairline`, ícono slate (`success`) o wine (`failure`), H1 Display 2, CTA forest.
- Failure añade leyenda wine italic "Tu bolsa sigue intacta". Sin banda wine.

## Reglas

- No hay desviaciones de color/tipografía/motion.
- Conservar intactos cupones, envío, VENDIDO, `openCartAtCheckout` y redirecciones `?pendiente=1`.
