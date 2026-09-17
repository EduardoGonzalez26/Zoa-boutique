import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cambios y Devoluciones | Zoa",
  description: "Política de cambios y devoluciones de Zoa — moda femenina en México.",
};

const legalLink = "font-medium text-zoa-slate underline decoration-zoa-slate decoration-2 underline-offset-2 transition-colors hover:decoration-zoa-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate";

export default function DevolucionesPage() {
  return (
    <div className="min-h-screen bg-zoa-sand pt-28 pb-20">
      <div className="mx-auto w-full max-w-[70ch] px-5 md:px-0">
        <div className="hairline-b mb-10 pt-10 pb-8">
          <p className="overline">Legal</p>
          <h1 className="mt-5 text-balance font-display text-[clamp(2rem,4.5vw,3.25rem)] font-normal leading-[0.98] tracking-[-0.02em] text-zoa-slate">
            Cambios y Devoluciones
          </h1>
          <p className="mt-4 font-sans text-[11px] uppercase tracking-[0.16em] text-zoa-slate-60 tabular">Última actualización: marzo 2025</p>
        </div>

        {/* Quick Summary */}
        <div className="mb-12 grid grid-cols-1 border-t border-zoa-line sm:grid-cols-3">
          {[
            { number: "7", label: "días hábiles para solicitar cambio" },
            { number: "0", label: "costo de cambio por talla disponible" },
            { number: "3–5", label: "días hábiles para reembolso" },
          ].map(({ number, label }, i) => (
            <div
              key={label}
              className={`flex flex-col gap-3 border-b border-zoa-line py-7 sm:border-b-0 ${
                i > 0 ? "sm:border-l sm:pl-8" : "sm:pr-8"
              } ${i === 1 ? "sm:pr-8" : ""}`}
            >
              <p className="font-display text-[clamp(2rem,4vw,3rem)] font-normal leading-none text-zoa-slate tabular-nums">{number}</p>
              <p className="font-sans text-[10px] uppercase leading-snug tracking-[0.18em] text-zoa-slate-60">{label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-10 font-sans text-[15px] leading-[1.75] text-zoa-slate-60">
          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">Política de cambios</h2>
            <p className="mb-3">Aceptamos cambios de talla o color dentro de los <strong className="font-medium text-zoa-slate">7 días hábiles</strong> posteriores a la recepción de tu pedido, siempre que:</p>
            <ul className="ml-5 list-disc list-outside space-y-1.5 marker:text-zoa-slate-60">
              <li>El artículo esté sin usar, sin lavar y con todas las etiquetas originales.</li>
              <li>Presente el embalaje original.</li>
              <li>No sea artículo de liquidación ni de temporada pasada marcado como final sale.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">Política de devoluciones</h2>
            <p className="mb-3">Las devoluciones aplican únicamente en los siguientes casos:</p>
            <ul className="ml-5 list-disc list-outside space-y-1.5 marker:text-zoa-slate-60">
              <li>Artículo recibido con defecto de fabricación.</li>
              <li>Artículo diferente al ordenado.</li>
              <li>Daño evidente durante el envío.</li>
            </ul>
            <p className="mt-3">El reembolso se realiza al mismo método de pago original en un plazo de <strong className="font-medium text-zoa-slate">3 a 5 días hábiles</strong> una vez que recibamos y aprobemos el artículo devuelto.</p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">Cómo iniciar un cambio o devolución</h2>
            <ol className="ml-5 list-decimal list-outside space-y-2 marker:text-zoa-slate-60">
              <li>Envía un correo a <a href="mailto:hola@zoa.mx" className={legalLink}>hola@zoa.mx</a> con tu número de pedido y motivo.</li>
              <li>Espera nuestra confirmación (máximo 48 h hábiles).</li>
              <li>Envía el artículo a nuestra dirección en Santa Fe, CDMX (Carretera Mex-Tol 5095).</li>
              <li>Una vez recibido e inspeccionado, procesamos tu cambio o reembolso.</li>
            </ol>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">Costo de envío de devolución</h2>
            <p>El costo del envío de retorno corre a cargo del cliente, excepto cuando el motivo sea un error de Zoa (artículo equivocado o defectuoso).</p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">Artículos no retornables</h2>
            <ul className="ml-5 list-disc list-outside space-y-1.5 marker:text-zoa-slate-60">
              <li>Artículos en oferta o liquidación marcados como <em className="not-italic font-medium text-zoa-slate">final sale</em>.</li>
              <li>Ropa interior o prendas de baño por higiene.</li>
              <li>Artículos personalizados o hechos a medida.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">¿Tienes dudas?</h2>
            <p>Escríbenos a <a href="mailto:hola@zoa.mx" className={legalLink}>hola@zoa.mx</a> o contáctanos por WhatsApp al <a href="https://wa.me/525521068191" target="_blank" rel="noopener noreferrer" className={legalLink}>55 2106 8191</a>. Estamos para ayudarte.</p>
          </section>
        </div>

        <div className="mt-14 border-t border-zoa-line pt-8">
          <Link href="/" className="cursor-pointer font-sans text-xs tracking-wide text-zoa-slate-60 transition-colors hover:text-zoa-slate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate">
            ← Volver a la tienda
          </Link>
        </div>
      </div>
    </div>
  );
}
