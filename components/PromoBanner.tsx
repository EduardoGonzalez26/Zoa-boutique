import type { CSSProperties } from "react";
import Image from "next/image";
import type { Promo } from "@/lib/promotions";
import Overline from "@/components/ui/Overline";
import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import PromoCode from "@/components/ui/PromoCode";

interface PromoBannerProps {
  promo: Promo;
}

/**
 * Banda wine de campaña (única de la home).
 * Full-bleed, texto primero en móvil e imagen a la derecha en desktop.
 * No usa ImageReveal: su fondo off-white parpadearía sobre wine.
 */
export default function PromoBanner({ promo }: PromoBannerProps) {
  return (
    <section
      id="promocion"
      aria-labelledby="promo-title"
      className="mt-[var(--space-section)] bg-zoa-wine text-zoa-surface"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Texto (7) — primero en móvil */}
        <div className="order-1 flex items-center px-5 py-16 md:px-10 md:py-24 lg:col-span-7 xl:px-20 2xl:px-[calc((100vw_-_1600px)/2_+_5rem)]">
          <div className="w-full max-w-2xl">
            <Reveal>
              <Overline tone="inverse">{promo.overline}</Overline>
            </Reveal>

            <Reveal delay={0.06}>
              <h2
                id="promo-title"
                className="mt-6 text-balance font-display text-[clamp(2.25rem,5.5vw,4.75rem)] font-normal leading-[0.98] tracking-[-0.02em] text-zoa-surface"
              >
                {promo.title}
              </h2>
            </Reveal>

            <Reveal delay={0.12}>
              <p className="mt-6 max-w-md font-sans text-[15px] leading-[1.7] text-zoa-slate-inverse-60">
                {promo.description}
              </p>
            </Reveal>

            {promo.code && (
              <Reveal delay={0.18} className="mt-8">
                <PromoCode code={promo.code} label="Código" tone="inverse" />
              </Reveal>
            )}

            <Reveal delay={0.24} className="mt-10">
              <Button
                href={promo.cta.href}
                variant="inverse"
                size="lg"
                className="w-full sm:w-auto"
              >
                {promo.cta.label}
              </Button>
            </Reveal>

            {promo.terms && (
              <Reveal delay={0.3}>
                <p className="mt-6 max-w-md font-sans text-[11px] leading-[1.6] text-zoa-slate-inverse-60 md:text-[12px]">
                  {promo.terms}
                </p>
              </Reveal>
            )}
          </div>
        </div>

        {/* Imagen (5) — debajo del texto en móvil */}
        <div
          className="relative order-2 aspect-[4/3] w-full sm:aspect-[16/10] lg:col-span-5 lg:aspect-auto lg:min-h-[620px]"
          style={
            {
              "--promo-pos-mobile": promo.image.positionMobile,
              "--promo-pos-desktop": promo.image.positionDesktop,
            } as CSSProperties
          }
        >
          <Image
            src={promo.image.src}
            alt={promo.image.alt}
            fill
            sizes="(max-width: 1023px) 100vw, 42vw"
            className="promo-image object-cover"
          />
        </div>
      </div>
    </section>
  );
}
