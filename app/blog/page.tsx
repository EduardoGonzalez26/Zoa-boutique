import type { Metadata } from "next";
import { BLOG_ARTICLES } from "@/lib/blog";
import BlogCard from "@/components/BlogCard";
import Overline from "@/components/ui/Overline";
import Reveal from "@/components/ui/Reveal";
import Button from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Blog de Moda | Zoa — Tendencias, Estilo y Guías",
  description: "Artículos sobre tendencias de moda femenina, cómo armar un guardarropa cápsula y guías de tallas. Todo lo que necesitas para vestir mejor.",
  openGraph: {
    title: "Blog de Moda | Zoa",
    description: "Tendencias, estilo y guías para mujeres que saben lo que quieren.",
    url: "https://zoa.mx/blog",
    type: "website",
  },
};

export default function BlogPage() {
  const [featured, ...rest] = BLOG_ARTICLES;

  return (
    <main className="min-h-screen bg-zoa-sand pt-28 md:pt-32">
      {/* ── Header editorial ── */}
      <section className="container-zoa">
        <nav aria-label="Breadcrumb" className="hairline-b flex items-center gap-2 pb-4 pt-6">
          <span className="font-sans text-[10px] uppercase tracking-[0.18em] text-zoa-slate-60">Inicio</span>
          <span aria-hidden className="font-sans text-[10px] text-zoa-slate-60">/</span>
          <span className="font-sans text-[10px] uppercase tracking-[0.18em] text-zoa-slate">Blog</span>
        </nav>

        <div className="flex flex-wrap items-end justify-between gap-8 pb-8 pt-10">
          <div className="min-w-0">
            <Overline>Zoa · Revista</Overline>
            <h1 className="mt-5 text-balance font-display text-[clamp(2.25rem,5.5vw,4.75rem)] font-normal leading-[0.98] tracking-[-0.02em] text-zoa-slate">
              Moda, estilo &amp; tendencias
            </h1>
          </div>
          <Reveal delay={0.1} className="shrink-0 pb-2">
            <Button variant="link-arrow" href="/tienda" className="pb-1">
              Ir a la tienda
            </Button>
          </Reveal>
        </div>
      </section>

      {BLOG_ARTICLES.length === 0 ? (
        <section className="container-zoa">
          <div className="hairline-t py-24">
            <Overline>Sin artículos</Overline>
            <p className="mt-4 font-display text-[clamp(1.75rem,3.4vw,2.9rem)] leading-[1.04] tracking-[-0.02em] text-zoa-slate">
              Muy pronto publicaremos nuevas guías
            </p>
          </div>
        </section>
      ) : (
        <>
          {/* ── Artículo destacado a sangre 7/5 ── */}
          {featured && (
            <section className="container-zoa pt-4 md:pt-10">
              <Reveal>
                <BlogCard article={featured} featured priority />
              </Reveal>
            </section>
          )}

          {/* ── Resto en rejilla de 3 con hairlines ── */}
          {rest.length > 0 && (
            <section className="container-zoa pt-[var(--space-section)]">
              <Overline className="mb-0">Todas las lecturas</Overline>
              <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((article, i) => (
                  <Reveal key={article.slug} offset={i} y={24}>
                    <BlogCard article={article} />
                  </Reveal>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* ── CTA final ── */}
      <section className="container-zoa py-[var(--space-section)]">
        <div className="hairline-t pt-12">
          <Overline>Colección 2026</Overline>
          <h2 className="mt-5 text-balance font-display text-[clamp(1.75rem,3.4vw,2.9rem)] font-normal leading-[1.04] tracking-[-0.02em] text-zoa-slate">
            Descubre nuestra tienda
          </h2>
          <p className="mt-4 max-w-md font-sans text-[15px] leading-[1.7] text-zoa-slate-60">
            Más de 100 prendas listas para ti. Envíos a todo México.
          </p>
          <div className="mt-8">
            <Button href="/tienda" variant="primary" size="lg">
              Ver colección
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
