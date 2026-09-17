import type { Metadata } from "next";
import Image from "next/image";
import {
  Truck,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import ProductCard from "@/components/ProductCard";
import HeroSection from "@/components/HeroSection";
import Marquee from "@/components/Marquee";
import CollectionIndex, { type CollectionRow } from "@/components/CollectionIndex";
import Reveal from "@/components/ui/Reveal";
import ImageReveal from "@/components/ui/ImageReveal";
import SectionHeader from "@/components/ui/SectionHeader";
import Overline from "@/components/ui/Overline";
import Button from "@/components/ui/Button";
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

const FALLBACK_IMAGE = "/bannerzoa.png";

/** Hash puro y estable — usado para rotar el orden de "Lo más pedido" sin Math.random. */
function stableRank(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (Math.imul(h, 31) + id.charCodeAt(i)) | 0;
  return h;
}

// ── Carrusel de producto — cabecera editorial numerada + scroll horizontal ──
function ProductCarousel({
  index,
  overline,
  title,
  products,
  seeAllHref,
}: {
  index: string;
  overline: string;
  title: string;
  products: Product[];
  seeAllHref?: string;
}) {
  if (!products.length) return null;
  return (
    <section className="pt-[var(--space-section)]">
      <div className="container-zoa">
        <SectionHeader
          index={index}
          overline={overline}
          title={title}
          action={seeAllHref ? { label: "Ver todo", href: seeAllHref } : undefined}
        />

        {/* Carrusel horizontal nativo — dentro del wrapper: hereda max-width y gutter */}
        <div
          className="carousel-wrap pt-10"
          tabIndex={0}
          role="region"
          aria-label={`${title} — desplazable horizontalmente`}
        >
          {products.map((product, i) => (
            <div key={product.id} className="carousel-item w-[155px] shrink-0 sm:w-[195px] md:w-[240px] lg:w-[220px]">
              <ProductCard product={product} index={i + 1} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const HOME_COLLECTIONS = [
  { label: "Primavera / Verano", slug: "Primavera / Verano" },
  { label: "Esenciales",         slug: "Esenciales"         },
  { label: "Outlet",             slug: "Outlet"             },
  { label: "Recomendados",       slug: "Recomendados"       },
];

const PROMISES = [
  {
    icon: Truck,
    label: "Envíos a todo México",
    detail: "3–5 días hábiles · gratis en compras ≥ $3,000",
  },
  {
    icon: ShieldCheck,
    label: "Pago seguro Mercado Pago",
    detail: "Tarjetas, OXXO y transferencias · certificado SSL",
  },
  {
    icon: RefreshCw,
    label: "Cambios y devoluciones",
    detail: "Hasta 7 días hábiles desde la recepción de tu pedido",
  },
];

export default async function HomePage() {
  const products = await getProductsWithFallback();

  // ── Carruseles por categoría (mismos filtros/slices que v3) ──
  const blusas     = products.filter(p => p.category === "Blusas");
  const sweaters   = products.filter(p => p.category === "Sweaters");
  const pantalones = products.filter(p => p.category === "Pantalones");
  const finalDeTemporada = products.filter(p =>
    (p.collection || "").includes("Primavera") || (p.collection || "").includes("Verano")
  );

  // "Lo más pedido": orden estable derivado del id (equivalente al shuffle, sin azar impuro
  // — mantiene el cache de la página y evita renders no deterministas).
  const favoritos = [...products]
    .sort((a, b) => stableRank(a.id) - stableRank(b.id))
    .slice(0, 8);

  // ── Pieza editorial destacada (split 8/4) ──
  const featured = products.find(p => p.images?.[0] && Object.values(p.stock ?? {}).some(v => (v ?? 0) > 0))
    ?? products.find(p => p.images?.[0]);

  // ── Índice de colecciones con preview de imagen real ──
  const collectionRows: CollectionRow[] = HOME_COLLECTIONS.map(({ label, slug }) => {
    const matches = products.filter(p => (p.collection || "").toLowerCase().includes(slug.toLowerCase()));
    const withImage = matches.find(p => p.images?.[0]);
    return {
      label,
      slug,
      href: `/tienda?coleccion=${encodeURIComponent(slug)}`,
      image: withImage?.images[0] ?? FALLBACK_IMAGE,
      count: matches.length || undefined,
    };
  });

  return (
    <main className="bg-zoa-sand">
      {/* ══ 1 · HERO ══ */}
      <HeroSection />

      {/* ══ 2 · BANDA FOREST (fina) — única banda forest full-bleed de la home;
          el CTABanner de esta página queda slate (1 banda forest por página) ══ */}
      <Marquee variant="forest" />

      {/* ══ 3 · INTRO EDITORIAL — statement + métricas ══ */}
      <section className="container-zoa pt-[var(--space-section)]">
        <Reveal>
          <Overline>La casa</Overline>
        </Reveal>

        <Reveal delay={0.06}>
          <p className="mt-7 max-w-5xl text-balance font-display text-[clamp(2.25rem,5.5vw,4.75rem)] font-normal leading-[0.98] tracking-[-0.02em] text-zoa-slate">
            Moda con <span className="italic">carácter</span> para mujeres que no piden permiso.
          </p>
        </Reveal>

        <Reveal delay={0.12}>
          <p className="mt-7 max-w-xl font-sans text-[clamp(1rem,1.35vw,1.3rem)] leading-[1.6] text-zoa-slate-60">
            Cada pieza está elegida para acompañar decisiones: las tuyas. Selección editorial,
            producción corta y envíos a todo México.
          </p>
        </Reveal>

        {/* Métricas — cifras Bodoni tabulares separadas por hairlines */}
        <div className="mt-14 grid grid-cols-1 border-t border-zoa-line sm:grid-cols-3 md:mt-20">
          {[
            { value: "100+", label: "Piezas en catálogo" },
            { value: "3–5", label: "Días hábiles de entrega" },
            { value: "$3,000", label: "Envío gratis desde" },
          ].map((metric, i) => (
            <Reveal
              key={metric.label}
              offset={i}
              className={`flex flex-col justify-between gap-4 border-b border-zoa-line py-8 sm:border-b-0 ${
                i > 0 ? "sm:border-l sm:pl-8" : "sm:pr-8"
              } ${i === 1 ? "sm:pr-8" : ""}`}
            >
              <p className="font-display text-[clamp(2.5rem,6vw,5rem)] font-normal leading-[0.9] tracking-[-0.02em] text-zoa-forest tabular">
                {metric.value}
              </p>
              <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-zoa-slate-60">
                {metric.label}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══ 4 · COLECCIÓN DESTACADA — split asimétrico 8/4 ══ */}
      {featured && (
        <section className="container-zoa pt-[var(--space-section)]">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:items-center md:gap-14">
            {/* Imagen a sangre (8) */}
            <div className="md:col-span-8">
              <ImageReveal
                src={featured.images[0]}
                alt={featured.name}
                sizes="(max-width: 768px) 100vw, 62vw"
                className="aspect-[3/4] w-full sm:aspect-[16/11] md:aspect-[5/4]"
              />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-zoa-slate-60">
                  {featured.category} · {featured.collection}
                </p>
                <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-zoa-slate-60 tabular">
                  En foco / {String(1).padStart(2, "0")}
                </p>
              </div>
            </div>

            {/* Panel de texto (4) */}
            <div className="md:col-span-4 md:pl-2">
              <Reveal>
                <Overline>Destacado de la temporada</Overline>
              </Reveal>
              <Reveal delay={0.06}>
                <h2 className="mt-5 text-balance font-display text-[clamp(1.75rem,3.4vw,2.9rem)] font-normal leading-[1.04] tracking-[-0.02em] text-zoa-slate">
                  {featured.name}
                </h2>
              </Reveal>
              <Reveal delay={0.12}>
                <p className="mt-5 font-sans text-[15px] leading-[1.7] text-zoa-slate-60">
                  {featured.description?.trim()
                    ? featured.description
                    : "Una pieza pensada para sostener el día completo: corte limpio, caída real y un acabado que envejece bien."}
                </p>
              </Reveal>
              <Reveal delay={0.18}>
                <p className="mt-6 font-sans text-[15px] font-medium tracking-[0.01em] text-zoa-slate tabular">
                  {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(featured.price)}
                </p>
              </Reveal>
              <Reveal delay={0.24} className="mt-8 flex flex-col items-start gap-4">
                <Button variant="link-arrow" href={`/product/${encodeURIComponent(featured.id)}`}>
                  Ver la pieza
                </Button>
                <Button variant="outline" href="/tienda">
                  Toda la colección
                </Button>
              </Reveal>
            </div>
          </div>
        </section>
      )}

      {/* ══ 5 · ÍNDICE DE COLECCIONES con preview al hover ══ */}
      <section id="colecciones" className="container-zoa scroll-mt-24 pt-[var(--space-section)]">
        <SectionHeader
          overline="Explora por colección"
          title="Cuatro universos, un mismo criterio"
          action={{ label: "Ver todo", href: "/tienda" }}
        />
        <Reveal className="mt-10 md:mt-14">
          <CollectionIndex items={collectionRows} />
        </Reveal>
      </section>

      {/* ══ 6 · CARRUSELES DE PRODUCTO ══ */}
      {products.length > 0 && (
        <>
          <ProductCarousel
            index="01"
            overline="Nueva llegada"
            title="Lo nuevo"
            products={[...products].reverse().slice(0, 8)}
            seeAllHref="/tienda"
          />
          <ProductCarousel
            index="02"
            overline="Favoritos"
            title="Lo más pedido"
            products={favoritos}
            seeAllHref="/tienda"
          />
        </>
      )}

      {blusas.length > 0 && (
        <ProductCarousel
          index="03"
          overline="Blusas"
          title="Blusas"
          products={blusas}
          seeAllHref="/tienda?categoria=Blusas"
        />
      )}

      {sweaters.length > 0 && (
        <ProductCarousel
          index="04"
          overline="Sweaters"
          title="Sweaters"
          products={sweaters}
          seeAllHref="/tienda?categoria=Sweaters"
        />
      )}

      {pantalones.length > 0 && (
        <ProductCarousel
          index="05"
          overline="Pantalones"
          title="Pantalones"
          products={pantalones}
          seeAllHref="/tienda?categoria=Pantalones"
        />
      )}

      {finalDeTemporada.length > 0 && (
        <ProductCarousel
          index="06"
          overline="De temporada"
          title="De Temporada"
          products={finalDeTemporada}
          seeAllHref="/tienda?coleccion=Primavera-25"
        />
      )}

      {/* ══ 7 · BANDA WINE — Día de las Madres (única banda wine de la home) ══ */}
      <section className="mt-[var(--space-section)] bg-zoa-wine text-zoa-surface">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Texto (7) */}
          <div className="order-2 flex items-center px-5 py-16 md:px-10 md:py-24 lg:order-1 lg:col-span-7 xl:px-20 2xl:px-[calc((100vw_-_1600px)/2_+_5rem)]">
            <div className="w-full max-w-2xl">
              <Reveal>
                <Overline tone="inverse">10 de mayo · Día de las Madres</Overline>
              </Reveal>

              <Reveal delay={0.06}>
                <h2 className="mt-6 text-balance font-display text-[clamp(2.25rem,5.5vw,4.75rem)] font-normal leading-[0.98] tracking-[-0.02em] text-zoa-surface">
                  ¡Mamá se verá espectacular!
                </h2>
              </Reveal>

              <Reveal delay={0.12}>
                <p className="mt-6 max-w-md font-sans text-[15px] leading-[1.7] text-zoa-slate-inverse-60">
                  Usa el cupón <strong className="font-medium tracking-[0.08em] text-zoa-surface">MAMA15</strong> y llévate el{" "}
                  <strong className="font-medium text-zoa-surface">15% OFF</strong> en toda la tienda.
                </p>
              </Reveal>

              {/* Chip del cupón — hairline inverse */}
              <Reveal delay={0.18}>
                <div className="mt-8 inline-flex items-center gap-4 border border-zoa-line-inverse-35 px-5 py-3">
                  <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-zoa-slate-inverse-60">
                    Código
                  </span>
                  <span aria-hidden className="h-4 w-px bg-zoa-line-inverse-35" />
                  <span className="font-sans text-base font-medium tracking-[0.3em] text-zoa-surface">
                    MAMA15
                  </span>
                </div>
              </Reveal>

              <Reveal delay={0.24} className="mt-10">
                <Button href="/tienda" variant="inverse" size="lg">
                  Regalar ahora
                </Button>
              </Reveal>
            </div>
          </div>

          {/* Imagen del banner a sangre (5) */}
          <div className="relative order-1 aspect-[4/5] w-full sm:aspect-[16/10] lg:order-2 lg:col-span-5 lg:aspect-auto lg:min-h-[620px]">
            <Image
              src="/bannerzoa.png"
              alt="Día de las Madres — Zoa"
              fill
              sizes="(max-width: 1024px) 100vw, 42vw"
              className="object-cover object-center"
            />
          </div>
        </div>
      </section>

      {/* ══ 8 · PROMESAS DE SERVICIO ══ */}
      <section className="container-zoa py-[var(--space-section)]">
        <div className="grid grid-cols-1 border-t border-zoa-line md:grid-cols-3">
          {PROMISES.map(({ icon: Icon, label, detail }, i) => (
            <Reveal
              key={label}
              offset={i}
              className={`flex flex-col gap-4 border-b border-zoa-line py-10 md:border-b-0 ${
                i > 0 ? "md:border-l md:pl-10" : "md:pr-10"
              } ${i === 1 ? "md:pr-10" : ""}`}
            >
              <Icon size={20} strokeWidth={1.4} aria-hidden className="text-zoa-forest" />
              <div>
                <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-zoa-slate">
                  {label}
                </p>
                <p className="mt-2 max-w-xs font-sans text-[13px] leading-[1.7] text-zoa-slate-60">
                  {detail}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Cierre editorial */}
        <Reveal className="mt-14 flex flex-wrap items-center justify-between gap-6 border-t border-zoa-line pt-8">
          <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-zoa-slate-60">
            Zoa · Boutique editorial
          </p>
          <Button variant="link-arrow" href="/blog">
            Leer el blog
          </Button>
        </Reveal>
      </section>
    </main>
  );
}
