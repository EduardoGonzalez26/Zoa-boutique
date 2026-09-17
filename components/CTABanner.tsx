"use client";

import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import Overline from "@/components/ui/Overline";
import Button from "@/components/ui/Button";
import useMounted from "@/components/ui/useMounted";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Banda global full-bleed con tinta off-white.
 * Aparece al pie de todas las páginas: cierre editorial antes del footer.
 * Cupo v4.1 (1 banda forest por página): en la home la banda forest es el
 * `Marquee` y este banner queda slate; en el resto de páginas este banner es
 * la única banda forest.
 */
export default function CTABanner() {
  const reduceMotion = useReducedMotion();
  const mounted = useMounted();
  const rm = mounted && reduceMotion;
  const pathname = usePathname();
  const isHome = pathname === "/" || pathname === "";
  const band = isHome ? "bg-zoa-slate" : "bg-zoa-forest";

  const reveal = {
    initial: rm ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" as const },
  };

  return (
    <section className={`${band} text-zoa-surface`}>
      <div className="container-zoa py-[var(--space-section)]">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:items-end md:gap-14">

          {/* Bloque editorial izquierdo */}
          <div className="md:col-span-7">
            <motion.div {...reveal} transition={{ duration: 0.7, ease: EASE }}>
              <Overline tone="inverse">Nueva colección disponible</Overline>
            </motion.div>
            <motion.h2
              {...reveal}
              transition={{ duration: 0.7, delay: 0.07, ease: EASE }}
              className="mt-6 text-balance font-display text-[clamp(2.25rem,5.5vw,4.75rem)] font-normal leading-[0.98] tracking-[-0.02em] text-zoa-surface"
            >
              Piezas que te definen,
              <br className="hidden md:block" />{" "}
              <span className="text-zoa-slate-inverse-60">estilo que perdura</span>
            </motion.h2>
          </div>

          {/* Columna derecha */}
          <div className="md:col-span-5 md:pb-2 md:pl-6 lg:pl-10">
            <motion.p
              {...reveal}
              transition={{ duration: 0.7, delay: 0.14, ease: EASE }}
              className="max-w-md font-sans text-[clamp(1rem,1.35vw,1.3rem)] leading-[1.6] text-zoa-slate-inverse-60"
            >
              Descubre nuestra colección completa: blusas, vestidos, sweaters y más. Envíos a todo México.
            </motion.p>

            <motion.div
              {...reveal}
              transition={{ duration: 0.7, delay: 0.21, ease: EASE }}
              className="mt-9"
            >
              <Button href="/tienda" variant="inverse" size="lg">
                Explorar colección
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
