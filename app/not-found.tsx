import type { Metadata } from "next";
import Overline from "@/components/ui/Overline";
import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";

/**
 * 404 global (v4.3) — landing editorial de enlaces rotos (`/colecciones/*`,
 * `/checkout/pending`, productos/blog inexistentes).
 *
 * Server Component estático, sin props ni fetching. Renderiza dentro del root
 * layout: la única banda forest full-bleed de la vista la aporta el `CTABanner`
 * global (internas → forest), por lo que esta sección no añade bandas propias
 * (ni forest ni wine). El numeral «404» es decorativo (`aria-hidden`); el
 * estado se comunica en texto vía el `Overline` y el único `h1` de la vista.
 */
export const metadata: Metadata = {
  title: "Página no encontrada",
};

export default function NotFound() {
  return (
    <section
      aria-labelledby="titulo-404"
      className="container-zoa flex min-h-[60svh] items-center pb-20 pt-28 md:pb-28 md:pt-36"
    >
      <div className="grid w-full grid-cols-1 gap-10 md:grid-cols-12 md:items-center md:gap-0">
        {/* Bloque editorial — columna izquierda (7) */}
        <div className="md:order-1 md:col-span-7 md:pr-10 lg:pr-16">
          <Reveal offset={0}>
            <Overline index="404">Página no encontrada</Overline>
            <h1
              id="titulo-404"
              className="mt-6 max-w-2xl text-balance font-display text-[clamp(2.25rem,5.5vw,4.75rem)] font-normal leading-[0.98] tracking-[-0.02em] text-zoa-slate"
            >
              Esta página se fue de compras
            </h1>
            <p className="mt-6 max-w-md font-sans text-[13px] leading-[1.7] text-zoa-slate-60">
              El enlace puede haber cambiado o la pieza ya no está disponible. Descubre el catálogo
              completo o vuelve al inicio.
            </p>
          </Reveal>

          <Reveal offset={1} className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Button href="/tienda" variant="primary" size="lg">
              Ver el catálogo
            </Button>
            <Button href="/" variant="link-arrow" className="min-h-11">
              Volver al inicio
            </Button>
          </Reveal>
        </div>

        {/* Numeral decorativo — columna derecha (5, desktop); en móvil va arriba del H1 */}
        <Reveal
          offset={2}
          className="order-first flex md:order-2 md:col-span-5 md:self-stretch md:items-center md:justify-end md:border-l md:border-zoa-line md:pl-10 lg:pl-14"
        >
          <span
            aria-hidden
            className="tabular block font-display font-normal leading-[0.9] tracking-[-0.02em] text-zoa-forest text-[clamp(5rem,24vw,6rem)] md:text-[clamp(6rem,12vw,11rem)]"
          >
            404
          </span>
        </Reveal>
      </div>
    </section>
  );
}
