import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Aviso de Privacidad",
  description: "Aviso de privacidad de Zoa conforme a la LFPDPPP: datos que tratamos, finalidades, transferencias, conservación y derechos ARCO.",
};

const legalLink = "font-medium text-zoa-slate underline decoration-zoa-slate decoration-2 underline-offset-2 transition-colors hover:text-zoa-forest hover:decoration-zoa-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate";

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-zoa-sand pt-28 pb-20">
      <div className="mx-auto w-full max-w-[70ch] px-5 md:px-0">
        <div className="hairline-b mb-10 pt-10 pb-8">
          <p className="overline-forest">Legal</p>
          <h1 className="mt-5 text-balance font-display text-[clamp(2rem,4.5vw,3.25rem)] font-normal leading-[0.98] tracking-[-0.02em] text-zoa-slate">
            Aviso de Privacidad
          </h1>
          <p className="mt-4 font-sans text-[11px] uppercase tracking-[0.16em] text-zoa-slate-60 tabular">Última actualización: septiembre 2026 · Conforme a la LFPDPPP</p>
        </div>

        <div className="space-y-10 font-sans text-[15px] leading-[1.75] text-zoa-slate-60">
          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">1. Identidad del responsable</h2>
            <p><strong className="font-medium text-zoa-slate">Zoa</strong>, con domicilio en Carr. México - Toluca 5095, Oficina B706, La Rosita, El Yaqui, Cuajimalpa de Morelos, 05320 Ciudad de México, CDMX, es responsable del tratamiento de tus datos personales conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP), publicada en el DOF el 20 de marzo de 2025, y a la normatividad que de ella derive. Para cualquier asunto relacionado con este aviso puedes escribir a <a href="mailto:privacidad@zoa.mx" className={legalLink}>privacidad@zoa.mx</a>.</p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">2. Datos personales que tratamos</h2>
            <ul className="ml-5 list-disc list-outside space-y-1.5 marker:text-zoa-slate-60">
              <li>Nombre completo</li>
              <li>Correo electrónico</li>
              <li>Número de teléfono</li>
              <li>Dirección de entrega</li>
              <li>Información de tu pedido (productos, tallas e importes)</li>
              <li>Reseñas, comentarios o fotografías que decidas compartirnos</li>
            </ul>
            <p className="mt-3">No almacenamos datos de tarjetas bancarias ni credenciales de pago. En las compras en línea, los datos de pago son tratados por MercadoPago como <strong className="font-medium text-zoa-slate">responsable independiente</strong>, conforme a su propia declaración de privacidad.</p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">3. Finalidades del tratamiento</h2>
            <p className="mb-2"><strong className="font-medium text-zoa-slate">Finalidades necesarias:</strong></p>
            <ul className="mb-3 ml-5 list-disc list-outside space-y-1.5 marker:text-zoa-slate-60">
              <li>Procesar y gestionar tu pedido: pago, preparación y envío</li>
              <li>Enviarte confirmaciones de compra y actualizaciones de entrega</li>
              <li>Atender dudas, cambios, devoluciones y garantías</li>
              <li>Cumplir obligaciones legales, fiscales y administrativas</li>
              <li>Mantener la seguridad del sitio y prevenir fraudes</li>
            </ul>
            <p className="mb-2"><strong className="font-medium text-zoa-slate">Finalidades que requieren tu consentimiento:</strong></p>
            <ul className="mb-3 ml-5 list-disc list-outside space-y-1.5 marker:text-zoa-slate-60">
              <li>Envío de newsletter y promociones</li>
              <li>Publicación de reseñas, comentarios o fotografías que decidas compartir</li>
              <li>Encuestas de satisfacción y publicidad personalizada</li>
            </ul>
            <p>Puedes negarte a estas finalidades, limitar el uso o divulgación de tus datos y revocar tu consentimiento en cualquier momento escribiendo a <a href="mailto:privacidad@zoa.mx" className={legalLink}>privacidad@zoa.mx</a> o usando el enlace de baja de nuestros correos. Tu decisión no afecta la compra ni la prestación de los servicios.</p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">4. Transferencias y comunicaciones de datos</h2>
            <p className="mb-3">Tus datos personales pueden comunicarse a:</p>
            <ul className="ml-5 list-disc list-outside space-y-1.5 marker:text-zoa-slate-60">
              <li><strong className="font-medium text-zoa-slate">MercadoPago</strong> (procesamiento de pagos) y <strong className="font-medium text-zoa-slate">Skydropx</strong> (logística): responsables independientes que tratan tus datos conforme a sus propias declaraciones de privacidad.</li>
              <li>Paqueterías y servicios de mensajería, para entregar tu pedido.</li>
              <li><strong className="font-medium text-zoa-slate">Resend</strong> (correos transaccionales) y <strong className="font-medium text-zoa-slate">Google</strong> (operación del catálogo y herramientas de trabajo): encargados que tratan datos por cuenta de Zoa con acuerdos de tratamiento.</li>
              <li><strong className="font-medium text-zoa-slate">Cloudinary</strong> (CDN de imágenes): encargado que aloja y entrega las imágenes del sitio.</li>
              <li><strong className="font-medium text-zoa-slate">Meta/WhatsApp</strong>: únicamente si decides contactarnos o compartir contenido a través de esos canales.</li>
            </ul>
            <p className="mt-3">No vendemos ni comercializamos tus datos. Estas comunicaciones pueden implicar transferencias internacionales a países como Estados Unidos e Israel. Al utilizar nuestros servicios, aceptas dichas transferencias; no se solicitará tu consentimiento para las transferencias que la legislación exceptúa.</p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">5. Conservación de los datos</h2>
            <p>Conservamos tus datos durante la relación comercial y, posteriormente, durante los plazos legales, fiscales y administrativos aplicables. Los datos relacionados con incumplimientos contractuales o responsabilidades derivadas se conservan por 72 meses. Al concluir los plazos, los datos quedan bloqueados durante el tiempo de prescripción de las acciones correspondientes y después se suprimen.</p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">6. Medidas de seguridad</h2>
            <p>Implementamos medidas de seguridad administrativas, técnicas y físicas para proteger tus datos personales, entre ellas controles de acceso, cifrado en tránsito, políticas internas y respaldos. Si ocurre una vulneración de seguridad que afecte de manera significativa tus derechos, te lo notificaremos sin dilación por los medios de contacto que tengas registrados.</p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">7. Cookies y tecnologías similares</h2>
            <p>El carrito se guarda en el almacenamiento local de tu navegador (clave <span className="tabular">zoa-cart</span>) y, al iniciar un pago, MercadoPago puede instalar cookies propias para procesar la transacción y prevenir fraudes. Actualmente no utilizamos cookies de analítica ni de marketing. Consulta el inventario completo y cómo gestionarlas en nuestra <Link href="/cookies" className={legalLink}>Política de Cookies</Link>.</p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">8. Derechos ARCO</h2>
            <p>Tienes derecho a Acceder, Rectificar, Cancelar u Oponerte al tratamiento de tus datos personales, así como a limitar su uso o divulgación y a revocar tu consentimiento. Para ejercerlos, envía un correo a <a href="mailto:privacidad@zoa.mx" className={legalLink}>privacidad@zoa.mx</a> con tu nombre, la petición concreta y los documentos que acrediten tu identidad o representación. Responderemos en un plazo máximo de 20 días hábiles y, si la solicitud procede, se ejecutará dentro de los 15 días hábiles siguientes. Si consideras que tu solicitud no fue atendida correctamente, puedes acudir ante la autoridad competente en materia de protección de datos personales: la Secretaría Anticorrupción y Buen Gobierno.</p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">9. Cambios al aviso</h2>
            <p>Podemos actualizar este aviso para reflejar cambios en nuestras prácticas o en la legislación aplicable. La versión vigente estará publicada en zoa.mx con su fecha de actualización. Este aviso se complementa con los <Link href="/terminos" className={legalLink}>Términos y Condiciones</Link>, la <Link href="/devoluciones" className={legalLink}>Política de Devoluciones</Link> y la <Link href="/reembolsos" className={legalLink}>Política de Reembolsos</Link>.</p>
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
