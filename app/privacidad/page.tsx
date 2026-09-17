import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Aviso de Privacidad | Zoa",
  description: "Aviso de privacidad de Zoa conforme a la LFPDPPP — moda femenina México.",
};

const legalLink = "font-medium text-zoa-slate underline decoration-zoa-slate decoration-2 underline-offset-2 transition-colors hover:decoration-zoa-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate";

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-zoa-sand pt-28 pb-20">
      <div className="mx-auto w-full max-w-[70ch] px-5 md:px-0">
        <div className="hairline-b mb-10 pt-10 pb-8">
          <p className="overline">Legal</p>
          <h1 className="mt-5 text-balance font-display text-[clamp(2rem,4.5vw,3.25rem)] font-normal leading-[0.98] tracking-[-0.02em] text-zoa-slate">
            Aviso de Privacidad
          </h1>
          <p className="mt-4 font-sans text-[11px] uppercase tracking-[0.16em] text-zoa-slate-60 tabular">Última actualización: marzo 2025 · Conforme a la LFPDPPP</p>
        </div>

        <div className="space-y-10 font-sans text-[15px] leading-[1.75] text-zoa-slate-60">
          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">1. Identidad del responsable</h2>
            <p><strong className="font-medium text-zoa-slate">Zoa</strong>, con domicilio en Carretera Mex-Tol 5095, Santa Fe, Ciudad de México, es responsable del tratamiento de tus datos personales conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).</p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">2. Datos personales que recopilamos</h2>
            <ul className="ml-5 list-disc list-outside space-y-1.5 marker:text-zoa-slate-60">
              <li>Nombre completo</li>
              <li>Correo electrónico</li>
              <li>Número de teléfono</li>
              <li>Dirección de envío</li>
              <li>Información de pago (procesada de forma segura por MercadoPago)</li>
              <li>Datos de navegación y preferencias de compra</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">3. Finalidades del tratamiento</h2>
            <p className="mb-2"><strong className="font-medium text-zoa-slate">Finalidades primarias (necesarias):</strong></p>
            <ul className="mb-3 ml-5 list-disc list-outside space-y-1.5 marker:text-zoa-slate-60">
              <li>Procesar y gestionar tus pedidos</li>
              <li>Enviar confirmaciones de compra y actualizaciones de envío</li>
              <li>Gestionar devoluciones y garantías</li>
              <li>Cumplir obligaciones legales y fiscales</li>
            </ul>
            <p className="mb-2"><strong className="font-medium text-zoa-slate">Finalidades secundarias (opcionales):</strong></p>
            <ul className="ml-5 list-disc list-outside space-y-1.5 marker:text-zoa-slate-60">
              <li>Envío de newsletter y promociones</li>
              <li>Encuestas de satisfacción</li>
              <li>Publicidad personalizada</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">4. Transferencia de datos</h2>
            <p>Tus datos podrán ser compartidos con proveedores de servicios de pago (MercadoPago), paquetería y logística (Skydropx), y plataformas de comunicación, únicamente para las finalidades señaladas. No vendemos ni cedemos tus datos a terceros sin tu consentimiento.</p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">5. Derechos ARCO</h2>
            <p>Tienes derecho a Acceder, Rectificar, Cancelar u Oponerte al tratamiento de tus datos personales. Para ejercer tus derechos, envía un correo a <a href="mailto:privacidad@zoa.mx" className={legalLink}>privacidad@zoa.mx</a> con tu nombre, solicitud y documentación de identidad.</p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">6. Cookies</h2>
            <p>Utilizamos cookies técnicas necesarias para el funcionamiento del sitio. Puedes desactivarlas desde la configuración de tu navegador, aunque esto puede afectar la experiencia de compra.</p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">7. Cambios al aviso</h2>
            <p>Zoa se reserva el derecho de actualizar este aviso en cualquier momento. Los cambios serán publicados en zoa.mx con la fecha de actualización correspondiente.</p>
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
