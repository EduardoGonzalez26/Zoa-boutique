import type { ReactNode } from "react";
import Overline from "@/components/ui/Overline";
import Button from "@/components/ui/Button";

interface SectionHeaderProps {
  /** Índice editorial: `01`, `02`… Se une al overline como "01 — NUEVA LLEGADA". */
  index?: string;
  overline: string;
  title: ReactNode;
  /** Acción alineada a la derecha (link con flecha). */
  action?: { label: string; href: string };
  tone?: "default" | "inverse";
  className?: string;
  /** Contenido extra bajo el título (copy corto). */
  children?: ReactNode;
}

/**
 * Cabecera de sección editorial: overline numerada + título Bodoni + acción opcional,
 * cerrada con hairline inferior. Patrón canónico de todas las secciones v4.
 */
export default function SectionHeader({
  index,
  overline,
  title,
  action,
  tone = "default",
  className = "",
  children,
}: SectionHeaderProps) {
  const inverse = tone === "inverse";

  return (
    <div className={`${inverse ? "hairline-inverse-b" : "hairline-b"} pb-5 ${className}`}>
      <Overline index={index} tone={tone}>
        {overline}
      </Overline>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <h2
          className={`text-balance font-display text-[clamp(2.25rem,5.5vw,4.75rem)] font-normal leading-[0.98] tracking-[-0.02em] ${
            inverse ? "text-zoa-surface" : "text-zoa-slate"
          }`}
        >
          {title}
        </h2>

        {action && (
          <Button
            variant="link-arrow"
            href={action.href}
            tone={inverse ? "inverse" : "default"}
            className="shrink-0 pb-1"
          >
            {action.label}
          </Button>
        )}
      </div>

      {children && (
        <div
          className={`mt-5 max-w-xl font-sans text-[15px] leading-[1.7] ${
            inverse ? "text-zoa-slate-inverse-60" : "text-zoa-slate-60"
          }`}
        >
          {children}
        </div>
      )}
    </div>
  );
}
