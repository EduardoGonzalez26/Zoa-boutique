import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Términos y Condiciones | Zoa",
  description: "Términos y condiciones de uso de Zoa — moda femenina en México.",
};

export default function TerminosPage() {
  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-[10px] tracking-[0.35em] uppercase text-[var(--color-stone-400)] font-sans mb-2">Legal</p>
          <h1 className="font-serif text-4xl text-[var(--color-charcoal)]">Términos y Condiciones</h1>
          <p className="text-xs font-sans text-[var(--color-stone-400)] mt-2">Última actualización: marzo 2025</p>
        </div>

        <div className="space-y-8 font-sans text-sm text-[var(--color-stone-600)] leading-relaxed">
          <section>
            <h2 className="font-serif text-xl text-[var(--color-charcoal)] mb-3">1. Aceptación de los términos</h2>
            <p>Al acceder y utilizar el sitio web de <strong>Zoa</strong> (zoa.mx), aceptas los presentes términos y condiciones en su totalidad. Si no estás de acuerdo con alguno de ellos, te pedimos que no utilices nuestro sitio.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[var(--color-charcoal)] mb-3">2. Uso del sitio</h2>
            <p>El contenido de este sitio es exclusivamente para uso personal y no comercial. Queda prohibida la reproducción, distribución o modificación del contenido sin el consentimiento previo y por escrito de Zoa.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[var(--color-charcoal)] mb-3">3. Productos y precios</h2>
            <p>Nos reservamos el derecho de modificar los precios en cualquier momento sin previo aviso. Los precios mostrados incluyen IVA y están expresados en pesos mexicanos (MXN). Zoa no se hace responsable por errores tipográficos en los precios publicados.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[var(--color-charcoal)] mb-3">4. Proceso de compra</h2>
            <p>Al realizar un pedido, garantizas que toda la información proporcionada es veraz y completa. Zoa se reserva el derecho de rechazar o cancelar cualquier pedido en caso de error en los precios, disponibilidad o información fraudulenta.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[var(--color-charcoal)] mb-3">5. Servicio de Probador a Domicilio</h2>
            <p>El servicio "Probador a Domicilio" requiere un depósito de $300 MXN al momento de la reserva. Este depósito se aplicará o reembolsará conforme a las políticas vigentes comunicadas al momento de la compra.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[var(--color-charcoal)] mb-3">6. Limitación de responsabilidad</h2>
            <p>Zoa no será responsable por daños directos, indirectos, incidentales o consecuentes que resulten del uso o la imposibilidad de uso de nuestros productos o servicios.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[var(--color-charcoal)] mb-3">7. Legislación aplicable</h2>
            <p>Estos términos se rigen por las leyes de los Estados Unidos Mexicanos. Cualquier controversia será resuelta ante los tribunales competentes de la Ciudad de México.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[var(--color-charcoal)] mb-3">8. Contacto</h2>
            <p>Para cualquier duda o aclaración, escríbenos a <a href="mailto:hola@zoa.mx" className="text-[var(--color-gold)] hover:underline">hola@zoa.mx</a> o llámanos al <a href="tel:5521068191" className="text-[var(--color-gold)] hover:underline">55 2106 8191</a>.</p>
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
