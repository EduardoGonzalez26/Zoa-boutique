"use client";

import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";

/**
 * Barra de progreso de lectura de 1px forest, anclada (sticky) bajo el navbar.
 * Mide el avance sobre el bloque de contenido que envuelve (el cuerpo del artículo).
 */
export default function ReadingProgress({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.4"],
  });
  const scaleX = useSpring(scrollYProgress, { stiffness: 180, damping: 30, restDelta: 0.001 });

  return (
    <div ref={ref}>
      <div
        aria-hidden
        className="sticky top-16 z-30 -mx-5 h-px bg-zoa-line md:top-20 md:-mx-8"
      >
        <motion.span
          style={{ scaleX: reduceMotion ? 1 : scaleX }}
          className="block h-px origin-left bg-zoa-forest"
        />
      </div>
      {children}
    </div>
  );
}
