"use client";

import { useReducedMotion } from "framer-motion";
import useMounted from "@/components/ui/useMounted";

export type MarqueeVariant = "sand" | "slate" | "wine" | "forest";

interface MarqueeProps {
  variant?: MarqueeVariant;
  items?: string[];
  className?: string;
}

const DEFAULT_ITEMS = ["Envíos a todo México", "Pago seguro", "Nueva colección", "Cambios hasta 7 días"];

const VARIANT: Record<MarqueeVariant, { wrapper: string; text: string }> = {
  sand: {
    wrapper: "bg-zoa-sand border-y border-zoa-line",
    text: "text-zoa-slate",
  },
  slate: {
    wrapper: "bg-zoa-slate border-y border-zoa-line-inverse",
    text: "text-zoa-surface",
  },
  wine: {
    wrapper: "bg-zoa-wine border-y border-zoa-line-inverse",
    text: "text-zoa-surface",
  },
  /* v4.1 · Banda forest full-bleed (la única de la página, con cupo medido) */
  forest: {
    wrapper: "bg-zoa-forest border-y border-zoa-line-inverse",
    text: "text-zoa-surface",
  },
};

/** Rombo hairline — separador editorial (sin emojis). */
function Diamond() {
  return (
    <span
      aria-hidden
      className="mx-5 inline-block h-1 w-1 shrink-0 rotate-45 border border-current opacity-60"
    />
  );
}

/**
 * Banda marquee editorial: hairlines arriba/abajo, separadores de rombo,
 * animación lineal de 40s con pausa al hover (CSS puro).
 * Con `prefers-reduced-motion` se renderiza una versión estática centrada.
 */
export default function Marquee({
  variant = "sand",
  items = DEFAULT_ITEMS,
  className = "",
}: MarqueeProps) {
  const reduceMotion = useReducedMotion();
  const mounted = useMounted();
  // La variante estática RM solo se sirve tras montar (SSR y primer render: marquee).
  const rm = mounted && reduceMotion;
  const tone = VARIANT[variant];

  return (
    <div className={`w-full ${tone.wrapper} ${className}`} aria-hidden="true">
      {rm ? (
        <p
          className={`flex flex-wrap items-center justify-center gap-x-5 gap-y-1 px-5 py-3 text-center font-sans text-[10px] uppercase tracking-[0.25em] ${tone.text}`}
        >
          {items.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </p>
      ) : (
        <div className="marquee-wrap py-3">
          <div className="marquee-track">
            {/* Dos copias idénticas → bucle perfecto a -50% */}
            {[0, 1].map((copy) => (
              <div key={copy} className="flex items-center whitespace-nowrap">
                {items.map((item, i) => (
                  <span key={`${copy}-${i}`} className="flex items-center">
                    <span className={`font-sans text-[10px] uppercase tracking-[0.25em] ${tone.text}`}>
                      {item}
                    </span>
                    <Diamond />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
