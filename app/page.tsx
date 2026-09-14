import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import HeroSection from "@/components/HeroSection";
import { getGroupedProducts } from "@/lib/googleSheets";
import type { Product } from "@/lib/types";

export const metadata: Metadata = {
  title: "Zoa — Moda Femenina",
  description: "Descubre la nueva colección de Zoa. Moda femenina con carácter y elegancia. Envíos a todo México.",
};

export const revalidate = 60;

async function getProductsWithFallback(): Promise<Product[]> {
  try {
    return await getGroupedProducts();
  } catch {
    return [];
  }
}

// Reusable Carousel Component
function ProductCarousel({ title, products, seeAllHref, categorySlug }: {
  title: string;
  products: Product[];
  seeAllHref?: string;
  categorySlug?: string;
}) {
  if (!products.length) return null;
  return (
    <section className="py-10 md:py-14 max-w-7xl mx-auto">
      <div className="px-5 lg:px-10 mb-8 flex items-center justify-between">
        <h2 className="font-serif text-3xl md:text-5xl text-[var(--color-charcoal)] tracking-tight">{title}</h2>
        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 border border-[var(--color-charcoal)] font-sans text-[10px] tracking-[0.2em] uppercase text-[var(--color-charcoal)] hover:bg-[var(--color-charcoal)] hover:text-[var(--color-cream)] transition-all duration-300 rounded-md"
          >
            Ver todo →
          </Link>
        )}
      </div>

      {/* Horizontal Carousel */}
      <div className="carousel-wrap">
        {/* Spacer matches section header padding: px-5 lg:px-10 */}
        <div aria-hidden className="shrink-0 w-5 lg:w-10" />
        {products.map((product) => (
          <div key={product.id} className="carousel-item snap-start shrink-0 w-[155px] sm:w-[195px] md:w-[240px] lg:w-[220px]">
            <ProductCard product={product} />
          </div>
        ))}
        <div aria-hidden className="shrink-0 w-5 lg:w-10" />
      </div>
    </section>
  );
}

export default async function HomePage() {
  const products = await getProductsWithFallback();

  // Carruseles por categoría
  const blusas     = products.filter(p => p.category === "Blusas");
  const sweaters   = products.filter(p => p.category === "Sweaters");
  const sacos      = products.filter(p => p.category === "Sacos");
  const pantalones = products.filter(p => p.category === "Pantalones");
  const finalDeTemporada = products.filter(p =>
    (p.collection || "").includes("Primavera") || (p.collection || "").includes("Verano")
  );

  return (
    <main className="bg-white">
      {/* SECTION 1: HERO */}
      <HeroSection />

      {/* SECTION 2: COLLECTION BADGES */}
      <section className="py-8 border-b border-[var(--color-stone-100)] bg-white max-w-7xl mx-auto">
        <div className="w-full overflow-x-auto snap-x snap-mandatory flex gap-3 px-6 md:justify-center [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {[
            { label: "Primavera / Verano", slug: "Primavera / Verano" },
            { label: "Esenciales",         slug: "Esenciales" },
            { label: "Outlet",             slug: "Outlet" },
            { label: "Recomendados",       slug: "Recomendados" },
          ].map(({ label, slug }) => (
            <Link
              key={slug}
              href={`/tienda?coleccion=${encodeURIComponent(slug)}`}
              className="snap-center shrink-0 cursor-pointer px-6 py-2.5 border border-[var(--color-stone-200)] rounded-full text-[10px] font-sans tracking-[0.2em] uppercase text-[var(--color-stone-600)] hover:border-[var(--color-charcoal)] hover:bg-[var(--color-charcoal)] hover:text-white transition-all duration-300"
            >
              {label}
            </Link>
          ))}
        </div>
      </section>

      {/* SECTION 3: LO NUEVO */}
      {products.length > 0 && (
        <ProductCarousel
          title="Lo nuevo"
          products={[...products].reverse().slice(0, 8)}
          seeAllHref="/tienda"
        />
      )}

      {/* BANNER DÍA DE LAS MADRES — 10 de mayo */}
      <section className="relative w-full aspect-[4/5] md:aspect-[21/9] bg-[var(--color-cream-dark)] overflow-hidden flex items-center justify-center my-6">
        {/* Background image */}
        <div className="absolute inset-0">
          <Image
            src="/bannerzoa.png"
            alt="Día de las Madres — Zoa"
            fill
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
        </div>
        <div className="relative z-20 text-left px-8 md:px-16 lg:px-24 max-w-2xl">
          <p className="font-sans text-[9px] tracking-[0.5em] uppercase text-[var(--color-gold)] mb-4">
            10 de mayo · Día de las Madres
          </p>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white leading-tight mb-4">
            ¡Mamá se verá<br /><em>espectacular!</em>
          </h2>
          <p className="font-sans text-sm text-white/80 mb-3 leading-relaxed">
            Usa el cupón <strong className="text-[var(--color-gold)] tracking-widest">MAMA15</strong> y llévate el <strong className="text-white">15% OFF</strong> en toda la tienda.
          </p>
          <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg mb-8">
            <span className="font-sans text-[11px] tracking-[0.15em] uppercase text-white/60">Código:</span>
            <span className="font-sans text-base font-bold tracking-[0.3em] text-[var(--color-gold)]">MAMA15</span>
          </div>
          <div>
            <Link
              href="/tienda"
              className="inline-block px-10 py-4 rounded-md bg-white text-black font-sans text-[10px] tracking-[0.25em] uppercase hover:bg-[var(--color-gold)] hover:text-white transition-colors duration-300"
            >
              Regalar ahora →
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 5: LO MÁS PEDIDO */}
      {products.length > 0 && (
        <ProductCarousel
          title="Lo más pedido"
          products={[...products].sort(() => 0.5 - Math.random()).slice(0, 8)}
          seeAllHref="/tienda"
        />
      )}

      {/* SECTION 6: BLUSAS */}
      {blusas.length > 0 && (
        <ProductCarousel title="Blusas" products={blusas} seeAllHref="/tienda?categoria=Blusas" />
      )}

      {/* SECTION 7: SWEATERS */}
      {sweaters.length > 0 && (
        <ProductCarousel title="Sweaters" products={sweaters} seeAllHref="/tienda?categoria=Sweaters" />
      )}


      {/* SECTION 9: PANTALONES */}
      {pantalones.length > 0 && (
        <ProductCarousel title="Pantalones" products={pantalones} seeAllHref="/tienda?categoria=Pantalones" />
      )}

      {/* SECTION 10: DE TEMPORADA */}
      {finalDeTemporada.length > 0 && (
        <ProductCarousel title="De Temporada" products={finalDeTemporada} seeAllHref="/tienda?coleccion=Primavera-25" />
      )}
    </main>
  );
}
