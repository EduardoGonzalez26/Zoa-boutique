import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Términos y Condiciones | Zoa",
  description: "Términos y condiciones de uso de Zoa — moda femenina en México.",
};

const legalLink = "font-medium text-zoa-slate underline decoration-zoa-slate decoration-2 underline-offset-2 transition-colors hover:text-zoa-forest hover:decoration-zoa-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate";

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-zoa-sand pt-28 pb-20">
      <div className="mx-auto w-full max-w-[70ch] px-5 md:px-0">
        <div className="hairline-b mb-10 pt-10 pb-8">
          <p className="overline-forest">Legal</p>
          <h1 className="mt-5 text-balance font-display text-[clamp(2rem,4.5vw,3.25rem)] font-normal leading-[0.98] tracking-[-0.02em] text-zoa-slate">
            Términos y Condiciones
          </h1>
          <p className="mt-4 font-sans text-[11px] uppercase tracking-[0.16em] text-zoa-slate-60 tabular">Última actualización: marzo 2025</p>
        </div>

        <div className="space-y-10 font-sans text-[15px] leading-[1.75] text-zoa-slate-60">
          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">1. Aceptación de los términos</h2>
            <p>Al acceder y utilizar el sitio web de <strong className="font-medium text-zoa-slate">Zoa</strong> (zoa.mx), aceptas los presentes términos y condiciones en su totalidad. Si no estás de acuerdo con alguno de ellos, te pedimos que no utilices nuestro sitio.</p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">2. Uso del sitio</h2>
            <p>El contenido de este sitio es exclusivamente para uso personal y no comercial. Queda prohibida la reproducción, distribución o modificación del contenido sin el consentimiento previo y por escrito de Zoa.</p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">3. Productos y precios</h2>
            <p>Nos reservamos el derecho de modificar los precios en cualquier momento sin previo aviso. Los precios mostrados incluyen IVA y están expresados en pesos mexicanos (MXN). Zoa no se hace responsable por errores tipográficos en los precios publicados.</p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">4. Proceso de compra</h2>
            <p>Al realizar un pedido, garantizas que toda la información proporcionada es veraz y completa. Zoa se reserva el derecho de rechazar o cancelar cualquier pedido en caso de error en los precios, disponibilidad o información fraudulenta.</p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">5. Servicio de Probador a Domicilio</h2>
            <p>El servicio &quot;Probador a Domicilio&quot; requiere un depósito de $300 MXN al momento de la reserva. Este depósito se aplicará o reembolsará conforme a las políticas vigentes comunicadas al momento de la compra.</p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">6. Limitación de responsabilidad</h2>
            <p>Zoa no será responsable por daños directos, indirectos, incidentales o consecuentes que resulten del uso o la imposibilidad de uso de nuestros productos o servicios.</p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">7. Legislación aplicable</h2>
            <p>Estos términos se rigen por las leyes de los Estados Unidos Mexicanos. Cualquier controversia será resuelta ante los tribunales competentes de la Ciudad de México.</p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">8. Contacto</h2>
            <p>Para cualquier duda o aclaración, escríbenos a <a href="mailto:hola@zoa.mx" className={legalLink}>hola@zoa.mx</a> o llámanos al <a href="tel:5521068191" className={legalLink}>55 2106 8191</a>.</p>
          </section>
        </div>

        <div className="mt-14 border-t border-zoa-line pt-8">
          <Link href="/" className="cursor-pointer font-sans text-xs tracking-wide text-zoa-slate-60 transition-colors hover:text-zoa-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate">
            ← Volver a la tienda
          </Link>
        </div>
      </div>
    </div>
  );
}
