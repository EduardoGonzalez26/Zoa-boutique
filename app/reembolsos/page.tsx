import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Reembolsos",
  description: "Política de reembolsos de Zoa: derecho de revocación, defectos de fabricación, plazos de 3 a 5 días hábiles y forma de pago.",
};

const legalLink = "font-medium text-zoa-slate underline decoration-zoa-slate decoration-2 underline-offset-2 transition-colors hover:text-zoa-forest hover:decoration-zoa-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate";

export default function ReembolsosPage() {
  return (
    <div className="min-h-screen bg-zoa-sand pt-28 pb-20">
      <div className="mx-auto w-full max-w-[70ch] px-5 md:px-0">
        <div className="hairline-b mb-10 pt-10 pb-8">
          <p className="overline-forest">Legal</p>
          <h1 className="mt-5 text-balance font-display text-[clamp(2rem,4.5vw,3.25rem)] font-normal leading-[0.98] tracking-[-0.02em] text-zoa-slate">
            Política de Reembolsos
          </h1>
          <p className="mt-4 font-sans text-[11px] uppercase tracking-[0.16em] text-zoa-slate-60 tabular">Última actualización: septiembre 2026</p>
        </div>

        <div className="space-y-10 font-sans text-[15px] leading-[1.75] text-zoa-slate-60">
          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">1. Derecho de revocación</h2>
            <p>Conforme a la legislación aplicable, tienes derecho a revocar tu compra dentro de los <strong className="font-medium text-zoa-slate">5 días hábiles</strong> contados a partir de la entrega del bien o de la firma del contrato, lo que suceda al final. Para ejercerlo, escríbenos a <a href="mailto:hola@zoa.mx" className={legalLink}>hola@zoa.mx</a> con tu número de pedido. Se reembolsará el precio pagado conforme a la legislación aplicable; los gastos de flete y seguro de la devolución corren a cargo del consumidor.</p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">2. Reembolsos por defecto, producto equivocado o daño en el envío</h2>
            <p>Si tu pedido llegó con un defecto de fabricación, con una pieza diferente a la ordenada o con daño evidente durante el envío, puedes solicitar una reposición, un cambio o una devolución con reembolso, según el caso y la disponibilidad. Cuando el motivo sea imputable a Zoa, el costo del envío de retorno corre por nuestra cuenta.</p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">3. Forma de reembolso</h2>
            <p>El reembolso se realiza por la misma forma de pago original. Si pagaste con tarjeta, el abono se reflejará en tu estado de cuenta conforme a los plazos del banco emisor.</p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">4. Plazos</h2>
            <p>Una vez que recibimos e inspeccionamos la pieza, revisamos y procesamos tu reembolso en un plazo de <strong className="font-medium text-zoa-slate">3 a 5 días hábiles</strong>. Te informaremos por correo cuando el reembolso haya sido autorizado.</p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">5. Cómo solicitarlo</h2>
            <p>Escribe a <a href="mailto:hola@zoa.mx" className={legalLink}>hola@zoa.mx</a> con tu número de pedido y el motivo; es el mismo canal que usamos para cambios y devoluciones (consulta la <Link href="/devoluciones" className={legalLink}>Política de Cambios y Devoluciones</Link>). Si tu caso requiere una reclamación formal, puedes escribir también a <a href="mailto:carmen@carmeli.mx" className={legalLink}>carmen@carmeli.mx</a>, <a href="mailto:carmeli6521@gmail.com" className={legalLink}>carmeli6521@gmail.com</a> o <a href="mailto:jgegmz@gmail.com" className={legalLink}>jgegmz@gmail.com</a>.</p>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">6. Artículos no retornables</h2>
            <ul className="ml-5 list-disc list-outside space-y-1.5 marker:text-zoa-slate-60">
              <li>Artículos en oferta o liquidación marcados como <em className="not-italic font-medium text-zoa-slate">final sale</em>.</li>
              <li>Ropa interior o prendas de baño por higiene.</li>
              <li>Artículos personalizados o hechos a medida.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-sans text-lg font-medium text-zoa-slate">7. Documentos relacionados</h2>
            <p>Esta política complementa los <Link href="/terminos" className={legalLink}>Términos y Condiciones</Link> y la <Link href="/devoluciones" className={legalLink}>Política de Cambios y Devoluciones</Link>.</p>
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
