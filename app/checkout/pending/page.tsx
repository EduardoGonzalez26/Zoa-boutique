import type { Metadata } from "next";
import { Clock } from "lucide-react";
import Button from "@/components/ui/Button";
import Overline from "@/components/ui/Overline";

export const metadata: Metadata = {
  title: "Pago pendiente",
  robots: { index: false, follow: false },
};

const TRACKING_URL = "https://tracking.skydropx.com/es-MX/page/zoa";

/**
 * Retorno de Checkout Pro cuando el pago queda pendiente de confirmación
 * (OXXO o transferencia SPEI). Comparte la tarjeta centrada de `success` y
 * `failure`; la única banda forest de la vista la aporta el CTABanner global.
 */
export default function CheckoutPendingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-5 pb-16 pt-28 md:pt-32">
      <div className="w-full max-w-md">
        <div className="hairline flex flex-col items-center gap-6 px-8 py-14 text-center">
          <Clock size={48} strokeWidth={1.1} aria-hidden className="text-zoa-forest" />
          <Overline tone="forest">Pago pendiente</Overline>
          <h1 className="text-balance font-display text-[clamp(2rem,4.5vw,3.25rem)] font-normal leading-[0.98] tracking-[-0.02em] text-zoa-slate">
            Tu pago está pendiente
          </h1>
          <p className="font-sans text-[15px] leading-[1.7] text-zoa-slate-60">
            Recibimos tu pedido, pero el pago aún no se ha confirmado. Si elegiste{" "}
            <strong className="font-medium text-zoa-slate">OXXO</strong>, paga tu referencia en tienda;
            si elegiste <strong className="font-medium text-zoa-slate">transferencia SPEI</strong>,{" "}
            completa el depósito desde tu banco.
          </p>
          <p className="font-sans text-[13px] leading-[1.7] text-zoa-slate-60">
            Tu pedido se prepara en cuanto se acredite el pago. Los pagos en OXXO pueden tardar hasta
            24 horas y las transferencias de 1 a 2 días hábiles; te avisaremos por correo con los
            detalles y la guía de envío.
          </p>
          <div className="mt-2 flex flex-col items-center gap-4">
            <Button href="/tienda" variant="primary">
              Volver a la tienda
            </Button>
            <Button href={TRACKING_URL} variant="link-arrow" className="min-h-11">
              Rastrear mi envío
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
