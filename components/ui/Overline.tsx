import type { ReactNode } from "react";

interface OverlineProps {
  children: ReactNode;
  /** `inverse` para bandas oscuras (slate / wine). */
  tone?: "default" | "inverse";
  /** Índice editorial opcional: `<Overline index="01">Nueva llegada</Overline>` → "01 — NUEVA LLEGADA" */
  index?: string;
  className?: string;
  as?: "p" | "span" | "div" | "h2" | "h3";
}

/**
 * Overline editorial — Archivo 10px / 500 / uppercase / 0.32em.
 * Base de toda la jerarquía editorial v4.
 */
export default function Overline({
  children,
  tone = "default",
  index,
  className = "",
  as: Tag = "p",
}: OverlineProps) {
  return (
    <Tag className={`${tone === "inverse" ? "overline-on-dark" : "overline"} ${className}`}>
      {index && <span className="tabular">{index} — </span>}
      {children}
    </Tag>
  );
}
