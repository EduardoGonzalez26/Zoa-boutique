"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Hook local de foco para diálogos/drawers (sin dependencias):
 *  - guarda el elemento abridor y le devuelve el foco al cerrar;
 *  - enfoca el primer elemento enfocable al abrir (fallback: el contenedor);
 *  - atrapa Tab / Shift+Tab dentro del contenedor;
 *  - cierra con Escape (`onClose`);
 *  - bloquea el scroll del body mientras está activo.
 *
 * El contenedor debe ser enfocable (`tabIndex={-1}`) para el fallback.
 * `active` debe reflejar el estado real de apertura del diálogo.
 */
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "audio[controls]",
  "video[controls]",
  "[contenteditable='true']",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) =>
      !el.hasAttribute("hidden") &&
      el.getAttribute("aria-hidden") !== "true" &&
      el.getClientRects().length > 0
  );
}

export default function useFocusTrap(
  active: boolean,
  containerRef: RefObject<HTMLElement | null>,
  onClose?: () => void
) {
  const openerRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  // Ref con la última versión del callback (evita re-suscribir listeners).
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Foco inicial + devolución del foco al abridor.
  useEffect(() => {
    if (!active) return;
    const opener =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    openerRef.current = opener;
    const raf = requestAnimationFrame(() => {
      const container = containerRef.current;
      if (!container) return;
      const first = getFocusable(container)[0];
      (first ?? container).focus({ preventScroll: true });
    });
    return () => {
      cancelAnimationFrame(raf);
      if (opener && opener.isConnected) opener.focus({ preventScroll: true });
      openerRef.current = null;
    };
  }, [active, containerRef]);

  // Scroll lock del body.
  useEffect(() => {
    if (!active) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);

  // Escape + trap de Tab / Shift+Tab.
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current?.();
        return;
      }
      if (event.key !== "Tab") return;

      const container = containerRef.current;
      if (!container) return;
      const focusables = getFocusable(container);
      if (focusables.length === 0) {
        event.preventDefault();
        container.focus({ preventScroll: true });
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const current = document.activeElement;
      if (event.shiftKey) {
        if (current === first || !container.contains(current)) {
          event.preventDefault();
          last.focus();
        }
      } else if (current === last || !container.contains(current)) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [active, containerRef]);
}
