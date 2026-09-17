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

const ACTION_CLASS =
  "group inline-flex min-h-11 cursor-pointer items-center gap-2 border border-zoa-line-strong px-6 py-3 font-sans text-[10px] uppercase tracking-[0.18em] text-zoa-slate transition-colors duration-200 hover:bg-zoa-slate/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:translate-y-px";

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
            <Link href={action.href} className={ACTION_CLASS}>
              {action.label}
              <ArrowRight size={13} aria-hidden className="transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          ) : (
            <button type="button" onClick={action.onClick} className={ACTION_CLASS}>
              {action.label}
              <ArrowRight size={13} aria-hidden className="transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          )}
        </>
      )}
    </div>
  );
}
