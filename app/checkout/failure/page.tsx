import Link from "next/link";
import { XCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Pago fallido | Zoa" };

export default function CheckoutFailurePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-16">
      <div className="text-center max-w-md space-y-6">
        <div className="flex justify-center">
          <XCircle size={56} strokeWidth={1.2} className="text-red-400" />
        </div>
        <h1 className="font-serif text-4xl text-[var(--color-charcoal)]">
          Algo salió mal
        </h1>
        <p className="font-sans text-sm text-[var(--color-stone-600)] leading-relaxed">
          Tu pago no pudo ser procesado. Por favor intenta de nuevo o contáctanos
          por Instagram para que podamos ayudarte.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-[var(--color-charcoal)] text-[var(--color-cream)] font-sans text-xs tracking-[0.25em] uppercase hover:bg-[var(--color-gold)] transition-colors duration-300"
        >
          Volver a la tienda
        </Link>
      </div>
    </div>
  );
}
