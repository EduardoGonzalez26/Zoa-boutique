import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Overline from "@/components/ui/Overline";

interface EmptyStateProps {
  overline?: string;
  /** Titular en Bodoni (grande). */
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
  tone?: "default" | "inverse";
  className?: string;
  children?: ReactNode;
}

// v4.1 · El CTA del EmptyState hereda el `outline` forest del kit (inversión completa al hover).
const ACTION_CLASS_DEFAULT =
  "group inline-flex min-h-11 cursor-pointer items-center gap-2 border border-zoa-forest-35 px-6 py-3 font-sans text-[10px] uppercase tracking-[0.18em] text-zoa-forest transition-[background-color,border-color,color] duration-200 hover:border-zoa-forest hover:bg-zoa-forest hover:text-zoa-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-forest focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:translate-y-px";

const ACTION_CLASS_INVERSE =
  "group inline-flex min-h-11 cursor-pointer items-center gap-2 border border-zoa-surface/60 px-6 py-3 font-sans text-[10px] uppercase tracking-[0.18em] text-zoa-surface transition-colors duration-200 hover:border-zoa-surface hover:bg-zoa-surface/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-surface focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:translate-y-px";

/** Estado vacío editorial: overline + Bodoni grande + CTA. */
export default function EmptyState({
  overline = "Sin resultados",
  title,
  description,
  action,
  tone = "default",
  className = "",
  children,
}: EmptyStateProps) {
  const inverse = tone === "inverse";
  const actionClass = inverse ? ACTION_CLASS_INVERSE : ACTION_CLASS_DEFAULT;

  return (
    <div
      className={`flex flex-col items-start gap-4 py-20 md:py-28 ${
        inverse ? "hairline-inverse-t" : "hairline-t"
      } ${className}`}
    >
      <Overline tone={tone}>{overline}</Overline>

      <p
        className={`max-w-2xl text-balance font-display text-[clamp(1.75rem,3.4vw,2.9rem)] font-normal leading-[1.04] tracking-[-0.02em] ${
          inverse ? "text-zoa-surface" : "text-zoa-slate"
        }`}
      >
        {title}
      </p>

      {description && (
        <p
          className={`max-w-md font-sans text-[13px] leading-[1.7] ${
            inverse ? "text-zoa-slate-inverse-60" : "text-zoa-slate-60"
          }`}
        >
          {description}
        </p>
      )}

      {children}

      {action && (
        <>
          {action.href ? (
            <Link href={action.href} className={actionClass}>
              {action.label}
              <ArrowRight size={13} aria-hidden className="transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          ) : (
            <button type="button" onClick={action.onClick} className={actionClass}>
              {action.label}
              <ArrowRight size={13} aria-hidden className="transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          )}
        </>
      )}
    </div>
  );
}
