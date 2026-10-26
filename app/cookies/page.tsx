import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Cookies",
  description: "Política de cookies y tecnologías similares de Zoa: carrito en almacenamiento local, cookies de MercadoPago al pagar y CDN de imágenes.",
};

const legalLink = "font-medium text-zoa-slate underline decoration-zoa-slate decoration-2 underline-offset-2 transition-colors hover:text-zoa-forest hover:decoration-zoa-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate";

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-zoa-sand pt-28 pb-20">
      <div className="mx-auto w-full max-w-[70ch] px-5 md:px-0">
        <div className="hairline-b mb-10 pt-10 pb-8">
          <p className="overline-forest">Legal</p>
          <h1 className="mt-5 text-balance font-display text-[clamp(2rem,4.5vw,3.25rem)] font-normal leading-[0.98] tracking-[-0.02em] text-zoa-slate">
            Política de Cookies
          </h1>
          <p className="mt-4 font-sans text-[11px] uppercase tracking-[0.16em] text-zoa-slate-60 tabular">Última actualización: septiembre 2026</p>
        </div>

        <div className="space-y-10 font-sans text-[15px] leading-[1.75] text-zoa-slate-60">
          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">1. ¿Qué son las cookies y tecnologías similares?</h2>
            <p>Las cookies son pequeños archivos que los sitios web guardan en tu navegador. También existen tecnologías similares, como el almacenamiento local (<span className="tabular">localStorage</span>), que permite guardar información en tu propio dispositivo. Esta política describe qué usamos en zoa.mx, en el marco de transparencia de nuestro <Link href="/privacidad" className={legalLink}>Aviso de Privacidad</Link>.</p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">2. Inventario de cookies y tecnologías que usamos</h2>
            <ul className="ml-5 list-disc list-outside space-y-1.5 marker:text-zoa-slate-60">
              <li><strong className="font-medium text-zoa-slate">Carrito de compras</strong> (clave <span className="tabular">zoa-cart</span> en almacenamiento local, necesario): guarda los artículos de tu carrito en tu propio navegador. No contiene datos personales ni de pago, y subsiste hasta que vacías el carrito o limpias los datos de navegación.</li>
              <li><strong className="font-medium text-zoa-slate">Cookies de MercadoPago</strong> (terceros, necesarias al pagar): se activan únicamente al iniciar el pago, para procesar la transacción y prevenir fraudes. Su tratamiento se rige por la <a href="https://www.mercadopago.com.mx/privacidad" target="_blank" rel="noopener noreferrer" className={legalLink}>declaración de privacidad de MercadoPago</a>.</li>
              <li><strong className="font-medium text-zoa-slate">CDN de Cloudinary</strong>: las imágenes del sitio se entregan desde la red de distribución de Cloudinary; no se usa con fines publicitarios.</li>
              <li><strong className="font-medium text-zoa-slate">Enlaces a WhatsApp/Meta</strong>: los botones de contacto solo se activan si haces clic; a partir de ese momento aplican las políticas de esas plataformas.</li>
              <li><strong className="font-medium text-zoa-slate">Búsqueda de direcciones (OpenStreetMap)</strong>: al escribir tu dirección en el checkout, tu navegador consulta el servicio Nominatim de OpenStreetMap para sugerir coincidencias; se usa solo para completar tu dirección de entrega.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">3. Cookies que no usamos</h2>
            <p>Actualmente no utilizamos cookies de analítica, publicidad ni marketing (por ejemplo, Google Analytics o píxeles de redes sociales). Si en el futuro incorporamos alguna, actualizaremos esta política y, cuando corresponda, solicitaremos tu consentimiento. El detalle del tratamiento de datos está en nuestro <Link href="/privacidad" className={legalLink}>Aviso de Privacidad</Link>.</p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">4. Cómo gestionarlas o eliminarlas</h2>
            <p>Puedes bloquear, eliminar o administrar cookies y datos locales desde la configuración de tu navegador (Chrome, Safari, Firefox o Edge, según el que uses). Ten en cuenta que bloquear tecnologías necesarias puede impedir que el carrito conserve los artículos o que el pago se complete correctamente.</p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">5. Cambios a esta política</h2>
            <p>Podemos actualizar esta política para reflejar cambios en el sitio o en la legislación aplicable. La versión vigente estará publicada en zoa.mx con su fecha de actualización.</p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">6. Contacto</h2>
            <p>Si tienes dudas sobre esta política, escríbenos a <a href="mailto:privacidad@zoa.mx" className={legalLink}>privacidad@zoa.mx</a>.</p>
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
