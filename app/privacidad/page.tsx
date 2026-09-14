import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Aviso de Privacidad | Zoa",
  description: "Aviso de privacidad de Zoa conforme a la LFPDPPP — moda femenina México.",
};

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-[10px] tracking-[0.35em] uppercase text-[var(--color-stone-400)] font-sans mb-2">Legal</p>
          <h1 className="font-serif text-4xl text-[var(--color-charcoal)]">Aviso de Privacidad</h1>
          <p className="text-xs font-sans text-[var(--color-stone-400)] mt-2">Última actualización: marzo 2025 · Conforme a la LFPDPPP</p>
        </div>

        <div className="space-y-8 font-sans text-sm text-[var(--color-stone-600)] leading-relaxed">
          <section>
            <h2 className="font-serif text-xl text-[var(--color-charcoal)] mb-3">1. Identidad del responsable</h2>
            <p><strong>Zoa</strong>, con domicilio en Carretera Mex-Tol 5095, Santa Fe, Ciudad de México, es responsable del tratamiento de tus datos personales conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[var(--color-charcoal)] mb-3">2. Datos personales que recopilamos</h2>
            <ul className="list-disc list-outside ml-4 space-y-1">
              <li>Nombre completo</li>
              <li>Correo electrónico</li>
              <li>Número de teléfono</li>
              <li>Dirección de envío</li>
              <li>Información de pago (procesada de forma segura por MercadoPago)</li>
              <li>Datos de navegación y preferencias de compra</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[var(--color-charcoal)] mb-3">3. Finalidades del tratamiento</h2>
            <p className="mb-2"><strong>Finalidades primarias (necesarias):</strong></p>
            <ul className="list-disc list-outside ml-4 space-y-1 mb-3">
              <li>Procesar y gestionar tus pedidos</li>
              <li>Enviar confirmaciones de compra y actualizaciones de envío</li>
              <li>Gestionar devoluciones y garantías</li>
              <li>Cumplir obligaciones legales y fiscales</li>
            </ul>
            <p className="mb-2"><strong>Finalidades secundarias (opcionales):</strong></p>
            <ul className="list-disc list-outside ml-4 space-y-1">
              <li>Envío de newsletter y promociones</li>
              <li>Encuestas de satisfacción</li>
              <li>Publicidad personalizada</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[var(--color-charcoal)] mb-3">4. Transferencia de datos</h2>
            <p>Tus datos podrán ser compartidos con proveedores de servicios de pago (MercadoPago), paquetería y logística (Skydropx), y plataformas de comunicación, únicamente para las finalidades señaladas. No vendemos ni cedemos tus datos a terceros sin tu consentimiento.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[var(--color-charcoal)] mb-3">5. Derechos ARCO</h2>
            <p>Tienes derecho a Acceder, Rectificar, Cancelar u Oponerte al tratamiento de tus datos personales. Para ejercer tus derechos, envía un correo a <a href="mailto:privacidad@zoa.mx" className="text-[var(--color-gold)] hover:underline">privacidad@zoa.mx</a> con tu nombre, solicitud y documentación de identidad.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[var(--color-charcoal)] mb-3">6. Cookies</h2>
            <p>Utilizamos cookies técnicas necesarias para el funcionamiento del sitio. Puedes desactivarlas desde la configuración de tu navegador, aunque esto puede afectar la experiencia de compra.</p>
          </section>

          <section>
            <h2 className="font-serif text-xl text-[var(--color-charcoal)] mb-3">7. Cambios al aviso</h2>
            <p>Zoa se reserva el derecho de actualizar este aviso en cualquier momento. Los cambios serán publicados en zoa.mx con la fecha de actualización correspondiente.</p>
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
