import Link from "next/link";
import { XCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Pago fallido | Zoa" };

export default function CheckoutFailurePage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-5 pb-16 pt-28 md:pt-32">
      <div className="w-full max-w-md">
        <div className="hairline flex flex-col items-center gap-6 px-8 py-14 text-center">
          <XCircle size={48} strokeWidth={1.1} aria-hidden className="text-zoa-wine" />
          <p className="overline">Pago no procesado</p>
          <h1 className="text-balance font-display text-[clamp(2rem,4.5vw,3.25rem)] font-normal leading-[0.98] tracking-[-0.02em] text-zoa-slate">
            Algo salió mal
          </h1>
          <p className="font-sans text-[15px] leading-[1.7] text-zoa-slate-60">
            Tu pago no pudo ser procesado. Por favor intenta de nuevo o contáctanos
            por Instagram para que podamos ayudarte.
          </p>
          <Link
            href="/tienda"
            className="mt-2 inline-flex h-12 cursor-pointer items-center justify-center gap-2.5 bg-zoa-forest px-8 font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-zoa-surface transition-colors duration-200 hover:bg-zoa-forest-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:translate-y-px"
          >
            Volver a la tienda
          </Link>
          <p className="font-display text-[13px] italic text-zoa-wine">
            Tu bolsa sigue intacta
          </p>
        </div>
      </div>
    </div>
  );
}
