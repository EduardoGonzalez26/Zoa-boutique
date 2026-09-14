import Link from "next/link";
import { Instagram, Phone, MapPin } from "lucide-react";

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

  return (
    <footer className="bg-[var(--color-charcoal)] text-[var(--color-stone-400)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

        {/* Brand */}
        <div className="sm:col-span-2 lg:col-span-1 space-y-4">
          <p
            className="text-2xl tracking-[0.3em] uppercase text-[var(--color-cream)]"
            style={{ fontFamily: "var(--font-marcellus), Georgia, serif", fontWeight: 400 }}
          >
            Zoa
          </p>
          <p className="text-sm leading-relaxed tracking-wide max-w-xs">
            Piezas atemporales para la mujer contemporánea.
          </p>

          {/* Contact */}
          <div className="flex items-start gap-2 text-sm pt-1">
            <MapPin size={13} className="mt-0.5 shrink-0 text-[var(--color-stone-600)]" />
            <span>Almacén, Santa Fe, CDMX,<br />Carretera Mex-Tol 5095</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone size={13} className="shrink-0 text-[var(--color-stone-600)]" />
            <a href="tel:5521068191" className="hover:text-[var(--color-gold)] transition-colors">
              5521068191
            </a>
          </div>

          {/* Social */}
          <div className="flex items-center gap-4 pt-1">
            <a href="https://instagram.com/zoa.mx" target="_blank" rel="noopener noreferrer"
              aria-label="Instagram" className="hover:text-[var(--color-gold)] transition-colors duration-300">
              <Instagram size={17} strokeWidth={1.5} />
            </a>
            <a href="https://tiktok.com/@zoa.mx" target="_blank" rel="noopener noreferrer"
              aria-label="TikTok" className="hover:text-[var(--color-gold)] transition-colors duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.88a8.28 8.28 0 0 0 4.84 1.55V6.98a4.86 4.86 0 0 1-1.07-.29z" />
              </svg>
            </a>
            <a href="https://wa.me/525521068191" target="_blank" rel="noopener noreferrer"
              aria-label="WhatsApp" className="hover:text-[var(--color-gold)] transition-colors duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Categorías */}
        <div className="space-y-2">
          <h4 className="text-[var(--color-cream)] text-[11px] tracking-[0.25em] uppercase font-sans mb-4">Tienda</h4>
          <Link href="/tienda" className="block text-sm hover:text-[var(--color-gold)] transition-colors duration-300 mb-3">
            Todos los productos
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/tienda?categoria=${encodeURIComponent(cat)}`}
              className="block text-sm tracking-wide hover:text-[var(--color-gold)] transition-colors duration-300"
            >
              {cat}
            </Link>
          ))}
        </div>

        {/* Colecciones */}
        <div className="space-y-2">
          <h4 className="text-[var(--color-cream)] text-[11px] tracking-[0.25em] uppercase font-sans mb-4">Colecciones</h4>
          {[
            { label: "Primavera-Verano", slug: "primavera-verano" },
            { label: "Otoño-Invierno",  slug: "otono-invierno"  },
            { label: "Esenciales",      slug: "esenciales"       },
            { label: "Outlet",          slug: "outlet"           },
            { label: "Recomendados",    slug: "recomendados"     },
          ].map(({ label, slug }) => (
            <Link key={slug} href={`/colecciones/${slug}`}
              className="block text-sm hover:text-[var(--color-gold)] transition-colors duration-300">
              {label}
            </Link>
          ))}
        </div>

        {/* Legal & SEO */}
        <div className="space-y-2">
          <h4 className="text-[var(--color-cream)] text-[11px] tracking-[0.25em] uppercase font-sans mb-4">Información</h4>
          {legal.map(({ href, label, external }) => (
            external ? (
              <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                className="block text-sm tracking-wide hover:text-[var(--color-gold)] transition-colors duration-300">
                {label}
              </a>
            ) : (
              <Link key={href} href={href}
                className="block text-sm tracking-wide hover:text-[var(--color-gold)] transition-colors duration-300">
                {label}
              </Link>
            )
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[var(--color-stone-600)]/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-5 flex flex-col md:flex-row justify-between items-center gap-2">
        <p className="text-[11px] tracking-[0.2em] uppercase">
          © {year} Zoa — zoa.mx
        </p>
        <p className="text-[11px] tracking-wide text-[var(--color-stone-600)]">
          Envíos en México · Gratis en compras ≥ $3,000 MXN
        </p>
        {/* Developer credit */}
        <p className="text-[11px] tracking-wide text-[var(--color-stone-600)]">
          Desarrollado por{" "}
          <a
            href="https://webi.mx"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "inherit", textDecoration: "none" }}
            className="hover:text-[var(--color-stone-400)] transition-colors"
          >
            webi.mx
          </a>
        </p>
        </div>
      </div>
    </footer>
  );
}
