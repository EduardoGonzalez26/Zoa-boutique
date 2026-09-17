import type { ReactNode } from "react";

type OverlineTone = "default" | "inverse" | "forest";

interface OverlineProps {
  children: ReactNode;
  /** `inverse` para bandas oscuras (slate / forest / wine); `forest` para acento en claro. */
  tone?: OverlineTone;
  /** Índice editorial opcional: `<Overline index="01">Nueva llegada</Overline>` → "01 — NUEVA LLEGADA" */
  index?: string;
  className?: string;
  as?: "p" | "span" | "div" | "h2" | "h3";
}

/**
 * Overline editorial — Archivo 10px / 500 / uppercase / 0.32em.
 * Base de toda la jerarquía editorial v4.1.
 * Regla de numerales (v4.1): con `tone="default"` el índice va siempre en forest
 * tabular mientras el texto permanece slate-60; con `tone="inverse"` el índice
 * va off-white/70. `tone="forest"` pinta todo el overline en forest.
 */
export default function Overline({
  children,
  tone = "default",
  index,
  className = "",
  as: Tag = "p",
}: OverlineProps) {
  const toneClass =
    tone === "inverse" ? "overline-on-dark" : tone === "forest" ? "overline-forest" : "overline";

  return (
    <Tag className={`${toneClass} ${className}`}>
      {index && (
        <span className={`tabular ${tone === "inverse" ? "text-zoa-surface/70" : "text-zoa-forest"}`}>
          {index} —{" "}
        </span>
      )}
      {children}
    </Tag>
  );
}
