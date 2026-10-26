"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

type PromoCodeTone = "inverse" | "default";

interface PromoCodeProps {
  code: string;
  label?: string;
  /** `inverse` para la banda wine; `default` sobre arena/off-white. */
  tone?: PromoCodeTone;
}

const COPY_ERROR = "No se pudo copiar. Selecciona el código y cópialo.";

/**
 * Caja de código promocional con copiado accesible.
 * - Clipboard API con fallback a `textarea` + `execCommand("copy")`.
 * - Anuncia el resultado en una región `role="status"` (`aria-live="polite"`).
 * - Foco off-white sobre banda oscura (nunca forest sobre wine).
 */
export default function PromoCode({
  code,
  label = "Código",
  tone = "default",
}: PromoCodeProps) {
  const codeRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    };
  }, []);

  function selectCode() {
    const node = codeRef.current;
    if (!node) return;
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(node);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  async function copyWithFallback(): Promise<boolean> {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
        return true;
      }
    } catch {
      // Sin permisos o contexto no seguro: se intenta el fallback.
    }

    let textarea: HTMLTextAreaElement | null = null;
    try {
      textarea = document.createElement("textarea");
      textarea.value = code;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.top = "-9999px";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);
      return document.execCommand("copy");
    } catch {
      return false;
    } finally {
      textarea?.remove();
    }
  }

  async function handleCopy() {
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);

    const ok = await copyWithFallback();

    if (ok) {
      setError(false);
      setCopied(true);
      timeoutRef.current = setTimeout(() => setCopied(false), 2200);
      return;
    }

    setCopied(false);
    setError(true);
    selectCode();
  }

  const isInverse = tone === "inverse";

  const boxClass = isInverse
    ? "border-zoa-line-inverse-35"
    : "border-zoa-line";
  const labelClass = isInverse
    ? "text-zoa-slate-inverse-60"
    : "text-zoa-slate-60";
  const codeClass = isInverse ? "text-zoa-surface" : "text-zoa-slate";
  const dividerClass = isInverse
    ? "bg-zoa-line-inverse-35"
    : "bg-zoa-line-strong";
  const buttonClass = isInverse
    ? "border-zoa-line-inverse-35 text-zoa-surface hover:bg-zoa-surface/10 focus-visible:ring-zoa-surface"
    : "border-zoa-line text-zoa-slate hover:bg-zoa-slate/5 focus-visible:ring-zoa-forest";
  const errorClass = isInverse
    ? "text-zoa-slate-inverse-60"
    : "text-zoa-slate-60";

  return (
    <div className="inline-flex max-w-full flex-col items-start gap-2">
      <div
        className={`inline-flex max-w-full items-stretch rounded-xs border ${boxClass}`}
      >
        <span
          className={`flex items-center px-3 font-sans text-[10px] uppercase tracking-[0.22em] sm:px-4 ${labelClass}`}
        >
          {label}
        </span>
        <span aria-hidden className={`my-3 w-px shrink-0 ${dividerClass}`} />
        <span
          ref={codeRef}
          className={`flex select-all items-center px-3 font-sans text-base font-medium tracking-[0.3em] sm:px-4 ${codeClass}`}
        >
          {code}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? `Código ${code} copiado` : `Copiar código ${code}`}
          className={`inline-flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center gap-2 border-l px-3 font-sans text-[10px] uppercase tracking-[0.18em] transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:translate-y-px sm:px-4 ${buttonClass}`}
        >
          {copied ? (
            <Check size={14} strokeWidth={1.5} aria-hidden />
          ) : (
            <Copy size={14} strokeWidth={1.5} aria-hidden />
          )}
          <span>{copied ? "Copiado" : "Copiar"}</span>
        </button>
      </div>

      <span role="status" aria-live="polite" className="sr-only">
        {error ? COPY_ERROR : copied ? `Código ${code} copiado.` : ""}
      </span>

      {error && (
        <p className={`font-sans text-[11px] leading-[1.6] ${errorClass}`}>
          {COPY_ERROR}
        </p>
      )}
    </div>
  );
}
