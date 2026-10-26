import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Términos y Condiciones",
  description: "Términos y condiciones de compra y uso de Zoa: precios en MXN, pagos, envíos, derecho de revocación y garantías.",
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
          <p className="mt-4 font-sans text-[11px] uppercase tracking-[0.16em] text-zoa-slate-60 tabular">Última actualización: septiembre 2026 · Conforme a la LFPC</p>
        </div>

        <div className="space-y-10 font-sans text-[15px] leading-[1.75] text-zoa-slate-60">
          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">1. Aceptación de los términos</h2>
            <p>Al acceder y utilizar el sitio web de <strong className="font-medium text-zoa-slate">Zoa</strong> (zoa.mx), aceptas los presentes términos y condiciones en su totalidad. Si no estás de acuerdo con alguno de ellos, te pedimos que no utilices nuestro sitio. La compra de productos se rige además por la Ley Federal de Protección al Consumidor (LFPC) y la legislación aplicable.</p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">2. Identidad y datos de contacto</h2>
            <p><strong className="font-medium text-zoa-slate">Zoa</strong>, con domicilio en Carr. México - Toluca 5095, Oficina B706, La Rosita, El Yaqui, Cuajimalpa de Morelos, 05320 Ciudad de México, CDMX. Para dudas o aclaraciones escríbenos a <a href="mailto:hola@zoa.mx" className={legalLink}>hola@zoa.mx</a> o llámanos al <a href="tel:+525643848889" className={legalLink}>+52 56 4384 8889</a>.</p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">3. Canal de reclamaciones</h2>
            <p>Para quejas o reclamaciones formales puedes escribir a cualquiera de estos correos: <a href="mailto:carmen@carmeli.mx" className={legalLink}>carmen@carmeli.mx</a>, <a href="mailto:carmeli6521@gmail.com" className={legalLink}>carmeli6521@gmail.com</a> y <a href="mailto:jgegmz@gmail.com" className={legalLink}>jgegmz@gmail.com</a>. Daremos seguimiento por escrito y, cuando proceda, repondremos el producto o devolveremos el precio pagado conforme a la legislación aplicable.</p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">4. Uso del sitio</h2>
            <p>El contenido de este sitio es exclusivamente para uso personal y no comercial. Queda prohibida la reproducción, distribución o modificación del contenido sin el consentimiento previo y por escrito de Zoa.</p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">5. Productos y precios</h2>
            <p>Los precios se expresan en pesos mexicanos (MXN) e incluyen IVA. El costo de envío aplicable se calcula y se muestra de forma total antes de que confirmes el pago. Nos reservamos el derecho de modificar precios y disponibilidad en cualquier momento; el precio aplicable es el mostrado al confirmar tu pedido. Procuramos que la información del catálogo sea exacta; ante un error evidente de precio o disponibilidad te lo informaremos antes de enviar tu pedido para que puedas confirmar o cancelar la compra.</p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">6. Proceso de compra y confirmación</h2>
            <p>Al realizar un pedido garantizas que toda la información proporcionada es veraz y completa. Una vez confirmado el pago recibirás un correo con el detalle de tu pedido. Podemos rechazar o cancelar pedidos por errores evidentes de precio o disponibilidad, información fraudulenta o uso indebido del sitio; en su caso, el importe pagado se reembolsará por la misma forma de pago.</p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">7. Pagos</h2>
            <p>El pago se procesa a través de MercadoPago. Zoa no almacena datos de tarjetas bancarias ni credenciales de pago: son tratados directamente por MercadoPago conforme a su propia declaración de privacidad.</p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">8. Envíos y entregas</h2>
            <p>Realizamos envíos dentro de la República Mexicana. Los plazos de entrega son estimados y comienzan a contar desde la confirmación del pago; pueden variar por la paquetería, la zona de entrega o causas ajenas a Zoa. El costo de envío se muestra antes de pagar y los pedidos que califiquen para envío sin costo lo verán reflejado en el carrito.</p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">9. Cambios, devoluciones y reembolsos</h2>
            <p>Puedes solicitar cambios dentro de los plazos y condiciones publicados en nuestra <Link href="/devoluciones" className={legalLink}>Política de Cambios y Devoluciones</Link>. Los reembolsos por defectos de fabricación, producto equivocado o daño en el envío se rigen por la <Link href="/reembolsos" className={legalLink}>Política de Reembolsos</Link>.</p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">10. Derecho de revocación</h2>
            <p>Conforme a la legislación aplicable, tienes derecho a revocar tu compra dentro de los <strong className="font-medium text-zoa-slate">5 días hábiles</strong> contados a partir de la entrega del bien o de la firma del contrato, lo que suceda al final. Para ejercerlo, escríbenos a <a href="mailto:hola@zoa.mx" className={legalLink}>hola@zoa.mx</a> con tu número de pedido. Se reembolsará el precio pagado conforme a la legislación aplicable; los gastos de flete y seguro de la devolución corren a cargo del consumidor. Consulta el procedimiento en la <Link href="/reembolsos" className={legalLink}>Política de Reembolsos</Link>.</p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">11. Garantía</h2>
            <p>Todos nuestros productos cuentan con <strong className="font-medium text-zoa-slate">garantía conforme a la legislación aplicable</strong>. Las condiciones y el alcance de la garantía se informan al momento de la compra. Para hacerla válida, escríbenos a <a href="mailto:hola@zoa.mx" className={legalLink}>hola@zoa.mx</a> con tu número de pedido y el motivo.</p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">12. Servicio de Probador a Domicilio</h2>
            <p>El servicio &quot;Probador a Domicilio&quot; requiere un depósito de $300 MXN al momento de la reserva. Este depósito se aplicará o reembolsará conforme a las condiciones informadas al momento de la compra.</p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">13. Propiedad intelectual</h2>
            <p>Los textos, fotografías, ilustraciones, marcas, logotipos, diseño y demás contenido del sitio son propiedad de Zoa o se utilizan con autorización, y están protegidos por la legislación aplicable. Queda prohibida su reproducción, distribución o modificación sin el consentimiento previo y por escrito de Zoa.</p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">14. Limitación de responsabilidad</h2>
            <p>Nada en estos términos limita los derechos irrenunciables que la legislación reconoce a los consumidores. Zoa no será responsable por daños indirectos, incidentales o consecuentes que resulten del uso o la imposibilidad de uso de nuestros productos o servicios, salvo en lo que la ley disponga.</p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">15. Legislación aplicable y jurisdicción</h2>
            <p>Estos términos se rigen por las leyes de los Estados Unidos Mexicanos. Cualquier controversia será resuelta ante los tribunales competentes de la Ciudad de México, sin perjuicio de los derechos y vías de reclamación que la legislación reconoce a los consumidores.</p>
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
