"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { useCartStore } from "@/store/cartStore";

const PHONE = "525521068191";
const DEFAULT_MESSAGE = "Hola, me gustaría recibir información sobre Zoa.";

/** Suscripción vacía: `useSyncExternalStore` solo lee el snapshot del cliente. */
const emptySubscribe = () => () => {};

/** Mensaje contextual: en /product/* incluye el nombre y la URL del producto. */
function buildMessage(isProduct: boolean): string {
  if (!isProduct || typeof window === "undefined") return DEFAULT_MESSAGE;

  const nameEl = document.querySelector("[data-product-name]") as HTMLElement | null;
  const name = nameEl?.dataset?.productName;
  const productUrl = window.location.href;

  return name
    ? `Hola! Me interesa este producto de Zoa: *${name}* 👉 ${productUrl} ¿Pueden ayudarme?`
    : `Hola! Me interesa este producto de Zoa: ${productUrl} ¿Pueden ayudarme?`;
}

/**
 * Botón flotante de WhatsApp — fijo abajo a la derecha.
 * Oculto cuando el drawer del carrito/checkout está abierto.
 */
export default function WhatsAppButton() {
  const pathname = usePathname();
  const isProduct = Boolean(pathname?.startsWith("/product/"));
  const { isOpen: cartIsOpen } = useCartStore();

  // Snapshot de cliente / servidor: mismo patrón seguro para SSR.
  const message = useSyncExternalStore(
    emptySubscribe,
    () => buildMessage(isProduct),
    () => DEFAULT_MESSAGE,
  );

  // Oculto cuando el carrito/checkout está abierto
  if (cartIsOpen) return null;

  const href = `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className="zoa-whatsapp group fixed bottom-6 right-5 z-50 flex min-h-11 items-center gap-2.5 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
      style={{ willChange: "transform" }}
    >
      {/* Label — se desliza al hover, hairline */}
      <span className="max-w-0 overflow-hidden whitespace-nowrap transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:max-w-[13rem] group-focus-visible:max-w-[13rem]">
        <span className="block border border-zoa-line bg-zoa-surface px-3.5 py-2.5 font-sans text-[10px] uppercase tracking-[0.18em] text-zoa-slate">
          ¿Necesitas ayuda?
        </span>
      </span>

      {/* Botón */}
      <span className="flex h-[52px] w-[52px] items-center justify-center rounded-xs bg-zoa-forest text-zoa-surface transition-colors duration-200 group-hover:bg-zoa-forest-dark group-active:translate-y-px">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="26" height="26"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
        </svg>
      </span>
    </a>
  );
}
