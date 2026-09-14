import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cambios y Devoluciones | Zoa",
  description: "Política de cambios y devoluciones de Zoa — moda femenina en México.",
};

export default function DevolucionesPage() {
  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-[10px] tracking-[0.35em] uppercase text-[var(--color-stone-400)] font-sans mb-2">Legal</p>
          <h1 className="font-serif text-4xl text-[var(--color-charcoal)]">Cambios y Devoluciones</h1>
          <p className="text-xs font-sans text-[var(--color-stone-400)] mt-2">Última actualización: marzo 2025</p>
        </div>

        {/* Quick Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { number: "7", label: "días hábiles para solicitar cambio" },
            { number: "0", label: "costo de cambio por talla disponible" },
            { number: "3–5", label: "días hábiles para reembolso" },
          ].map(({ number, label }) => (
            <div key={label} className="border border-[var(--color-stone-100)] p-4 text-center">
              <p className="font-serif text-3xl text-[var(--color-charcoal)]">{number}</p>
              <p className="text-[11px] font-sans text-[var(--color-stone-400)] mt-1 leading-snug">{label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-8 font-sans text-sm text-[var(--color-stone-600)] leading-relaxed">
          <section>
            <h2 className="font-serif text-xl text-[var(--color-charcoal)] mb-3">Política de cambios</h2>
            <p className="mb-3">Aceptamos cambios de talla o color dentro de los <strong>7 días hábiles</strong> posteriores a la recepción de tu pedido, siempre que:</p>
            <ul className="list-disc list-outside ml-4 space-y-1">
              <li>El artículo esté sin usar, sin lavar y con todas las etiquetas originales.</li>
              <li>Presente el embalaje original.</li>
              <li>No sea artículo de liquidación ni de temporada pasada marcado como final sale.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[var(--color-charcoal)] mb-3">Política de devoluciones</h2>
            <p className="mb-3">Las devoluciones aplican únicamente en los siguientes casos:</p>
            <ul className="list-disc list-outside ml-4 space-y-1">
              <li>Artículo recibido con defecto de fabricación.</li>
              <li>Artículo diferente al ordenado.</li>
              <li>Daño evidente durante el envío.</li>
            </ul>
            <p className="mt-3">El reembolso se realiza al mismo método de pago original en un plazo de <strong>3 a 5 días hábiles</strong> una vez que recibamos y aprobemos el artículo devuelto.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[var(--color-charcoal)] mb-3">Cómo iniciar un cambio o devolución</h2>
            <ol className="list-decimal list-outside ml-4 space-y-2">
              <li>Envía un correo a <a href="mailto:hola@zoa.mx" className="text-[var(--color-gold)] hover:underline">hola@zoa.mx</a> con tu número de pedido y motivo.</li>
              <li>Espera nuestra confirmación (máximo 48 h hábiles).</li>
              <li>Envía el artículo a nuestra dirección en Santa Fe, CDMX (Carretera Mex-Tol 5095).</li>
              <li>Una vez recibido e inspeccionado, procesamos tu cambio o reembolso.</li>
            </ol>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[var(--color-charcoal)] mb-3">Costo de envío de devolución</h2>
            <p>El costo del envío de retorno corre a cargo del cliente, excepto cuando el motivo sea un error de Zoa (artículo equivocado o defectuoso).</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[var(--color-charcoal)] mb-3">Artículos no retornables</h2>
            <ul className="list-disc list-outside ml-4 space-y-1">
              <li>Artículos en oferta o liquidación marcados como <em>final sale</em>.</li>
              <li>Ropa interior o prendas de baño por higiene.</li>
              <li>Artículos personalizados o hechos a medida.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[var(--color-charcoal)] mb-3">¿Tienes dudas?</h2>
            <p>Escríbenos a <a href="mailto:hola@zoa.mx" className="text-[var(--color-gold)] hover:underline">hola@zoa.mx</a> o contáctanos por WhatsApp al <a href="https://wa.me/525521068191" target="_blank" rel="noopener noreferrer" className="text-[var(--color-gold)] hover:underline">55 2106 8191</a>. Estamos para ayudarte.</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-[var(--color-stone-100)]">
          <Link href="/" className="text-xs font-sans text-[var(--color-stone-400)] hover:text-[var(--color-charcoal)] tracking-wide transition-colors">
            ← Volver a la tienda
          </Link>
        </div>
      </div>
    </div>
  );
}
