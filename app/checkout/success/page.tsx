import Link from "next/link";
import { CheckCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Pago exitoso | Zoa" };

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-16">
      <div className="text-center max-w-md space-y-6">
        <div className="flex justify-center">
          <CheckCircle
            size={56}
            strokeWidth={1.2}
            className="text-[var(--color-gold)]"
          />
        </div>
        <h1 className="font-serif text-4xl text-[var(--color-charcoal)]">
          ¡Pago recibido!
        </h1>
        <p className="font-sans text-sm text-[var(--color-stone-600)] leading-relaxed">
          Gracias por tu compra en{" "}
          <span className="font-serif text-[var(--color-charcoal)]">Zoa</span>.
          Recibirás un correo con los detalles de tu pedido y tu guía de envío en
          breve.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-[var(--color-charcoal)] text-[var(--color-cream)] font-sans text-xs tracking-[0.25em] uppercase hover:bg-[var(--color-gold)] transition-colors duration-300"
        >
          Seguir comprando
        </Link>
      </div>
    </div>
  );
}
