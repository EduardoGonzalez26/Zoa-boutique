import Link from "next/link";
import { Instagram, Phone, MapPin } from "lucide-react";
import Overline from "@/components/ui/Overline";
import NewsletterForm from "@/components/NewsletterForm";

export default function Footer() {
  const year = new Date().getFullYear();

  const categories = [
    "Blusas", "Sweaters", "Sacos", "Chamarras",
    "Pantalones", "Vestidos", "Faldas", "Chalecos", "Mallones",
  ];

  const legal = [
    { href: "/blog",          label: "Blog" },
    { href: "/privacidad",   label: "Aviso de privacidad" },
    { href: "/terminos",     label: "Términos y condiciones" },
    { href: "/devoluciones", label: "Cambios y devoluciones" },
    { href: "https://tracking.skydropx.com/es-MX/page/zoa", label: "Rastrear envío", external: true },
    { href: "/sitemap.xml",  label: "Sitemap" },
  ];

  // v4.1 · Overlines de columna en forest; links con hover forest (subrayado intacto)
  const columnTitle = "flex items-baseline justify-between gap-3 pb-4 font-sans text-[10px] font-medium uppercase tracking-[0.25em] text-zoa-forest";
  const columnIndex = "font-sans text-[10px] tracking-[0.2em] text-zoa-forest tabular";
  const columnLink = "block py-1.5 font-sans text-sm text-zoa-slate-60 transition-colors duration-200 hover:text-zoa-forest hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate";

  return (
    <footer className="bg-zoa-surface text-zoa-slate">
      {/* ── Logo gigante como elemento gráfico (logozoa.svg enmascarado) ── */}
      <div aria-hidden className="overflow-hidden px-5 pt-10 md:px-10 xl:px-20">
        <span className="zoa-logo zoa-logo-footer select-none text-zoa-forest/[0.07]" />
      </div>

      {/* ── Círculo Zoa ── */}
      <div className="container-zoa">
        <div className="hairline-t grid grid-cols-1 gap-8 pt-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <Overline>Únete al círculo Zoa</Overline>
            <p className="mt-4 max-w-sm font-sans text-[15px] leading-[1.7] text-zoa-slate-60">
              Novedades, piezas únicas y precios especiales antes que nadie. Escríbenos y te sumamos
              a la lista.
            </p>
          </div>
          <div className="md:col-span-7 md:pl-10">
            <NewsletterForm />
            <p className="mt-3 font-sans text-[11px] tracking-wide text-zoa-slate-60">
              Te contactamos por WhatsApp. Sin spam, sin correos automáticos.
            </p>
          </div>
        </div>
      </div>

      {/* ── Columnas ── */}
      <div className="container-zoa grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">

        {/* Brand */}
        <div className="space-y-4 sm:col-span-2 lg:col-span-1">
          <div className={columnTitle}>
            <span>Zoa</span>
            <span className={columnIndex}>00</span>
          </div>
          <p className="max-w-xs font-sans text-sm leading-relaxed text-zoa-slate-60">
            Piezas atemporales para la mujer contemporánea.
          </p>

          {/* Contacto */}
          <div className="flex items-start gap-2 pt-1 font-sans text-sm text-zoa-slate-60">
            <MapPin size={13} aria-hidden className="mt-0.5 shrink-0" />
            <span>Almacén, Santa Fe, CDMX,<br />Carretera Mex-Tol 5095</span>
          </div>
          <div className="flex items-center gap-2 font-sans text-sm text-zoa-slate-60">
            <Phone size={13} aria-hidden className="shrink-0" />
            <a
              href="tel:5521068191"
              className="transition-colors duration-200 hover:text-zoa-forest hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate"
            >
              5521068191
            </a>
          </div>

          {/* Social */}
          <div className="flex items-center gap-4 pt-1">
            <a
              href="https://instagram.com/zoa.mx"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex h-11 w-11 items-center justify-center text-zoa-slate transition-colors duration-200 hover:text-zoa-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate"
            >
              <Instagram size={17} strokeWidth={1.5} />
            </a>
            <a
              href="https://tiktok.com/@zoa.mx"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className="flex h-11 w-11 items-center justify-center text-zoa-slate transition-colors duration-200 hover:text-zoa-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.88a8.28 8.28 0 0 0 4.84 1.55V6.98a4.86 4.86 0 0 1-1.07-.29z" />
              </svg>
            </a>
            <a
              href="https://wa.me/525521068191"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="flex h-11 w-11 items-center justify-center text-zoa-slate transition-colors duration-200 hover:text-zoa-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Categorías */}
        <div>
          <h4 className={columnTitle}>
            <span>Tienda</span>
            <span className={columnIndex}>01</span>
          </h4>
          <Link href="/tienda" className={`${columnLink} mb-2`}>
            Todos los productos
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/tienda?categoria=${encodeURIComponent(cat)}`}
              className={columnLink}
            >
              {cat}
            </Link>
          ))}
        </div>

        {/* Colecciones */}
        <div>
          <h4 className={columnTitle}>
            <span>Colecciones</span>
            <span className={columnIndex}>02</span>
          </h4>
          {[
            { label: "Primavera-Verano", slug: "primavera-verano" },
            { label: "Otoño-Invierno",  slug: "otono-invierno"  },
            { label: "Esenciales",      slug: "esenciales"       },
            { label: "Outlet",          slug: "outlet"           },
            { label: "Recomendados",    slug: "recomendados"     },
          ].map(({ label, slug }) => (
            <Link key={slug} href={`/colecciones/${slug}`} className={columnLink}>
              {label}
            </Link>
          ))}
        </div>

        {/* Legal & SEO */}
        <div>
          <h4 className={columnTitle}>
            <span>Información</span>
            <span className={columnIndex}>03</span>
          </h4>
          {legal.map(({ href, label, external }) => (
            external ? (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={columnLink}
              >
                {label}
              </a>
            ) : (
              <Link key={href} href={href} className={columnLink}>
                {label}
              </Link>
            )
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="hairline-t">
        <div className="container-zoa flex flex-col items-center justify-between gap-3 py-6 md:flex-row">
          <p className="font-sans text-[11px] uppercase tracking-[0.18em] text-zoa-slate">
            © {year} Zoa — zoa.mx
          </p>
          <p className="font-sans text-[11px] tracking-wide text-zoa-slate-60">
            Envíos en México · Gratis en compras ≥ $3,000 MXN
          </p>
          {/* Developer credit */}
          <p className="font-sans text-[11px] tracking-wide text-zoa-slate-60">
            Desarrollado por{" "}
            <a
              href="https://webi.mx"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zoa-slate-60 transition-colors duration-200 hover:text-zoa-forest hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate"
            >
              webi.mx
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
