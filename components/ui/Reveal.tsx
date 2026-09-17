"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import useMounted from "@/components/ui/useMounted";

type RevealTag = "div" | "section" | "article" | "li" | "span" | "p";

const TAGS = {
  div: motion.div,
  section: motion.section,
  article: motion.article,
  li: motion.li,
  span: motion.span,
  p: motion.p,
} as const;

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Elemento HTML a renderizar (por defecto `div`). */
  as?: RevealTag;
  /** Retardo base en segundos. */
  delay?: number;
  /** Distancia vertical del reveal (px). Default 28. */
  y?: number;
  /**
   * Índice para stagger automático: `offset * 70ms` (máx. 8 sugerido).
   * Se suma al `delay` base.
   */
  offset?: number;
  /** Si es `false`, vuelve a animar cada vez que entra en viewport. Default `true`. */
  once?: boolean;
}

const EASE = [0.16, 1, 0.3, 1] as const;
const STAGGER_STEP = 0.07;
const MAX_STAGGER = 8;

/**
 * Reveal de entrada al viewport — opacity 0→1, y 28→0, 700ms `ease-out-expo`.
 * Respeta `prefers-reduced-motion` (render estático).
 */
export default function Reveal({
  children,
  className = "",
  as = "div",
  delay = 0,
  y = 28,
  offset,
  once = true,
}: RevealProps) {
  const reduceMotion = useReducedMotion();
  const mounted = useMounted();
  // Tras montar: con RM se renderiza estático; el HTML del primer render
  // (cliente y servidor) siempre pasa por la rama `motion`.
  const rm = mounted && reduceMotion;
  const Tag = TAGS[as] as React.ElementType;

  const stagger = offset !== undefined ? Math.min(offset, MAX_STAGGER) * STAGGER_STEP : 0;

  if (rm) {
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-80px" }}
      transition={{ duration: 0.7, ease: EASE, delay: delay + stagger }}
    >
      {children}
    </Tag>
  );
}
