import type { ReactNode } from "react";
import { X } from "lucide-react";

type ChipVariant = "sand" | "outline" | "inverse";

interface ChipProps {
  children: ReactNode;
  variant?: ChipVariant;
  /** Si se pasa, el chip se vuelve un botón removible con ícono X. */
  onRemove?: () => void;
  /** Contenido decorativo a la izquierda (p. ej. el swatch del color activo). */
  leading?: ReactNode;
  className?: string;
}

const VARIANT: Record<ChipVariant, string> = {
  sand: "bg-zoa-sand text-zoa-slate hairline hover:bg-zoa-slate/10",
  outline: "bg-transparent text-zoa-slate hairline hover:bg-zoa-slate/5",
  inverse: "bg-transparent text-zoa-surface hairline-inverse hover:bg-zoa-surface/10",
};

/**
 * Chip de filtro / etiqueta editorial. Radio 2px, micro-label, sin relleno decorativo.
 * Con `onRemove` se convierte en un botón interactivo (touch target ≥ 44px de alto en móvil).
 */
export default function Chip({
  children,
  variant = "outline",
  onRemove,
  leading,
  className = "",
}: ChipProps) {
  const base =
    "inline-flex items-center gap-2 rounded-xs px-3 py-2 font-sans text-[10px] uppercase tracking-[0.16em] whitespace-nowrap";

  if (!onRemove) {
    return (
      <span className={`${base} ${VARIANT[variant]} ${className}`}>
        {leading}
        {children}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onRemove}
      className={`${base} ${VARIANT[variant]} group cursor-pointer transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent ${
        variant === "inverse" ? "focus-visible:ring-zoa-surface" : "focus-visible:ring-zoa-slate"
      } ${className}`}
    >
      {leading}
      {children}
      <X size={11} strokeWidth={1.5} aria-hidden />
    </button>
  );
}
