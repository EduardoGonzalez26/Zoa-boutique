import type { Metadata } from "next";
import SaleForm from "./SaleForm";

export const metadata: Metadata = {
  title: "Ventas físicas",
  robots: { index: false, follow: false },
};

export default function AdminVentasPage() {
  return (
    <div className="min-h-screen pt-28 md:pt-32">
      <div className="mx-auto w-full max-w-2xl px-5 pb-16 md:px-10">
        <nav aria-label="Breadcrumb" className="hairline-b flex items-center gap-2 pb-4 pt-6">
          <span className="font-sans text-[10px] uppercase tracking-[0.18em] text-zoa-slate-60">Admin</span>
          <span aria-hidden className="font-sans text-[10px] text-zoa-slate-60">/</span>
          <span className="font-sans text-[10px] uppercase tracking-[0.18em] text-zoa-slate">Ventas</span>
        </nav>

        <div className="pt-8 pb-8">
          <p className="overline-forest">Zoa · Panel interno</p>
          <h1 className="mt-4 font-display text-[clamp(2rem,4vw,3rem)] font-normal leading-[1.04] tracking-[-0.02em] text-zoa-slate">
            Venta física
          </h1>
          <p className="mt-4 max-w-xl font-sans text-sm leading-relaxed text-zoa-slate-60">
            Registra una venta en tienda. Se valida el catálogo y el stock fresco,
            se descuenta inventario y se guarda el log con la marca ZOA. No se
            procesa ningún cobro ni envío.
          </p>
        </div>

        <SaleForm />

        <p className="mt-6 font-sans text-[11px] leading-relaxed text-zoa-slate-60">
          Solo para personal autorizado. Cada registro descuenta inventario real
          y no puede revertirse desde esta pantalla.
        </p>
      </div>
    </div>
  );
}
