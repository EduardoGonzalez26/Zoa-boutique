"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

export type ButtonVariant = "primary" | "outline" | "ghost-inverse" | "inverse" | "link-arrow";
export type ButtonSize = "md" | "lg";

interface BaseProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  /** Ícono a la izquierda del label (lucide, 14–16px). */
  icon?: ReactNode;
  /** Solo aplica a `link-arrow`: invierte el color del texto sobre bandas oscuras. */
  tone?: "default" | "inverse";
}

interface LinkProps extends BaseProps {
  href: string;
  /** Fuerza apertura externa (`target="_blank"`). Se autodetecta con http(s). */
  external?: boolean;
  onClick?: () => void;
  type?: never;
  disabled?: never;
}

interface ActionProps extends BaseProps {
  href?: undefined;
  external?: never;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}

type ButtonProps = LinkProps | ActionProps;

/** Radio 2px, Archivo 11px / 500 / 0.18em uppercase, foco con anillo 2px + offset 2px. */
const BASE =
  "group/btn relative inline-flex select-none cursor-pointer items-center justify-center gap-2.5 rounded-xs font-sans text-[11px] font-medium uppercase tracking-[0.18em] transition-[background-color,border-color,color,opacity] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:translate-y-px disabled:pointer-events-none disabled:opacity-50";

const SIZE: Record<ButtonSize, string> = {
  md: "h-12 px-7",
  lg: "h-14 px-9",
};

const VARIANT: Record<Exclude<ButtonVariant, "link-arrow">, string> = {
  primary:
    "bg-zoa-forest text-zoa-surface hover:bg-zoa-forest-dark focus-visible:ring-zoa-forest",
  outline:
    "border border-zoa-forest-35 bg-transparent text-zoa-forest hover:border-zoa-forest hover:bg-zoa-forest hover:text-zoa-surface focus-visible:ring-zoa-forest",
  "ghost-inverse":
    "border border-zoa-surface/60 bg-transparent text-zoa-surface hover:border-zoa-surface hover:bg-zoa-surface/10 focus-visible:ring-zoa-surface",
  inverse:
    "bg-zoa-surface text-zoa-forest hover:bg-zoa-sand focus-visible:ring-zoa-surface",
};

/**
 * Botón/link editorial v4.1. Variantes:
 * - `primary`       → forest, acción principal ("Añadir a la bolsa", pagar)
 * - `outline`       → borde forest-35 + texto forest → invierte a forest al hover
 * - `ghost-inverse` → borde off-white/60 sobre imagen o banda oscura
 * - `inverse`       → fondo off-white + texto forest (sobre banda slate/forest/wine)
 * - `link-arrow`    → texto + flecha forest que se desplaza al hover
 */
export default function Button(props: ButtonProps) {
  const {
    children,
    variant = "primary",
    size = "md",
    className = "",
    icon,
    tone = "default",
  } = props;

  const isLinkArrow = variant === "link-arrow";

  const content = isLinkArrow ? (
    <>
      <span className="link-underline">{children}</span>
      <ArrowRight
        size={13}
        strokeWidth={1.5}
        aria-hidden
        className="transition-transform duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover/btn:translate-x-1"
      />
    </>
  ) : (
    <>
      {icon && <span className="shrink-0" aria-hidden>{icon}</span>}
      <span className="whitespace-nowrap">{children}</span>
    </>
  );

  const classes = isLinkArrow
    ? `group/btn inline-flex cursor-pointer items-center gap-2 font-sans text-[10px] uppercase tracking-[0.18em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
        tone === "inverse" ? "text-zoa-surface" : "text-zoa-forest"
      } ${className}`
    : `${BASE} ${SIZE[size]} ${VARIANT[variant]} ${className}`;

  if (props.href !== undefined) {
    const { href, external, onClick } = props;
    const isExternal = external ?? /^https?:\/\//.test(href);

    if (isExternal) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClick}
          className={classes}
        >
          {content}
        </a>
      );
    }

    return (
      <Link href={href} onClick={onClick} className={classes}>
        {content}
      </Link>
    );
  }

  const { onClick, type = "button", disabled } = props;

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {content}
    </button>
  );
}
