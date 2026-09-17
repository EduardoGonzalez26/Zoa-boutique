import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BLOG_ARTICLES, getArticleBySlug } from "@/lib/blog";
import BlogCard from "@/components/BlogCard";
import ReadingProgress from "@/components/ReadingProgress";
import Overline from "@/components/ui/Overline";
import Button from "@/components/ui/Button";

// Generate static pages at build time
export async function generateStaticParams() {
  return BLOG_ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return { title: "Artículo no encontrado | Zoa" };

  return {
    title: `${article.title} | Zoa Blog`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      url: `https://zoa.mx/blog/${article.slug}`,
      type: "article",
      images: [{ url: article.ogImage ?? `https://zoa.mx${article.coverImage}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt,
      images: [article.ogImage ?? `https://zoa.mx${article.coverImage}`],
    },
  };
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const relatedArticles = BLOG_ARTICLES.filter((a) => a.slug !== slug).slice(0, 2);
  const dateLabel = new Date(article.date).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="min-h-screen bg-zoa-sand pt-24 md:pt-28">
      {/* ── Imagen de portada a sangre ── */}
      <div className="relative h-[clamp(260px,42vw,520px)] w-full overflow-hidden bg-zoa-surface">
        <Image
          src={article.coverImage}
          alt={article.title}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      <div className="container-zoa">
        {/* Breadcrumb hairline */}
        <nav
          aria-label="Breadcrumb"
          className="hairline-b flex flex-wrap items-center gap-2 py-5 font-sans text-[10px] uppercase tracking-[0.18em] text-zoa-slate-60"
        >
          <Link href="/" className="link-underline cursor-pointer transition-colors hover:text-zoa-slate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate">
            Inicio
          </Link>
          <span aria-hidden>/</span>
          <Link href="/blog" className="link-underline cursor-pointer transition-colors hover:text-zoa-slate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate">
            Blog
          </Link>
          <span aria-hidden>/</span>
          <span className="text-zoa-slate">{article.category}</span>
        </nav>

        {/* ── Cabecera del artículo ── */}
        <header className="pb-10 pt-12 md:pt-16">
          <Overline>{article.category}</Overline>
          <h1 className="mt-6 max-w-4xl text-balance font-display text-[clamp(2.25rem,5.5vw,4.75rem)] font-normal leading-[0.98] tracking-[-0.02em] text-zoa-slate">
            {article.title}
          </h1>
        </header>

        {/* ── Cuerpo de lectura con raíl de metadatos ── */}
        <div className="flex gap-12 pb-16 md:pb-24">
          <aside className="hidden w-44 shrink-0 lg:block">
            <div className="hairline-l sticky top-32 space-y-6 pl-5">
              <div>
                <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-zoa-slate-60">Publicado</p>
                <p className="mt-1.5 font-sans text-[12px] text-zoa-slate tabular">{dateLabel}</p>
              </div>
              <div>
                <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-zoa-slate-60">Lectura</p>
                <p className="mt-1.5 font-sans text-[12px] text-zoa-slate tabular">{article.readTime}</p>
              </div>
              <div>
                <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-zoa-slate-60">Autoría</p>
                <p className="mt-1.5 font-sans text-[12px] text-zoa-slate">{article.author}</p>
              </div>
              <div className="hairline-t pt-6">
                <Button variant="link-arrow" href="/blog" className="pb-1">
                  Volver al blog
                </Button>
              </div>
            </div>
          </aside>

          <div className="min-w-0 max-w-[68ch] flex-1">
            {/* Lead / excerpt */}
            <p className="hairline-b pb-8 font-display text-[clamp(1.25rem,1.9vw,1.55rem)] leading-[1.45] tracking-[-0.01em] text-zoa-slate">
              {article.excerpt}
            </p>

            {/* Progreso de lectura + cuerpo */}
            <ReadingProgress>
              <div
                className="pt-8 text-[16px] leading-[1.85] text-zoa-slate-60"
                dangerouslySetInnerHTML={{ __html: article.content
                  .replace(/<h2>/g, '<h2 class="mt-12 mb-4 font-display text-[clamp(1.5rem,2.6vw,2rem)] font-normal leading-[1.12] tracking-[-0.02em] text-zoa-slate">')
                  .replace(/<h3>/g, '<h3 class="mt-9 mb-3 font-display text-[clamp(1.15rem,1.8vw,1.35rem)] font-normal leading-[1.2] tracking-[-0.01em] text-zoa-slate">')
                  .replace(/<p>/g, '<p class="mb-5">')
                  .replace(/<ul>/g, '<ul class="mb-6 list-disc space-y-2 pl-5 marker:text-zoa-slate-60">')
                  .replace(/<ol>/g, '<ol class="mb-6 list-decimal space-y-2 pl-5 marker:text-zoa-slate-60">')
                  .replace(/<li>/g, '<li class="leading-[1.75]">')
                  .replace(/<blockquote>/g, '<blockquote class="my-8 border-l border-zoa-line-strong pl-5 font-display text-[1.15rem] italic leading-[1.6] text-zoa-slate">')
                  .replace(/<strong>/g, '<strong class="font-medium text-zoa-slate">')
                  .replace(/<em>/g, '<em class="font-medium not-italic text-zoa-slate">')
                  .replace(/<a /g, '<a class="text-zoa-slate underline decoration-zoa-slate decoration-1 underline-offset-4 transition-opacity hover:opacity-60" ')
                  .replace(/<hr \/>/g, '<hr class="my-10 border-zoa-line" />')
                }}
              />
            </ReadingProgress>

            {/* CTA final */}
            <div className="hairline-t mt-16 pt-10">
              <Overline>Colección 2026</Overline>
              <h2 className="mt-5 text-balance font-display text-[clamp(1.75rem,3.4vw,2.9rem)] font-normal leading-[1.04] tracking-[-0.02em] text-zoa-slate">
                Descubre la colección completa
              </h2>
              <div className="mt-8 flex flex-wrap items-center gap-6">
                <Button href="/tienda" variant="primary">
                  Ver la tienda
                </Button>
                <Link
                  href="/blog"
                  className="link-underline inline-flex cursor-pointer items-center gap-2 font-sans text-[10px] uppercase tracking-[0.18em] text-zoa-slate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate lg:hidden"
                >
                  <ArrowLeft size={12} aria-hidden />
                  Volver al blog
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Lecturas relacionadas ── */}
      {relatedArticles.length > 0 && (
        <section className="hairline-t">
          <div className="container-zoa py-[var(--space-section)]">
            <Overline>También te puede interesar</Overline>
            <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2">
              {relatedArticles.map((rel) => (
                <BlogCard key={rel.slug} article={rel} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: article.title,
            description: article.excerpt,
            image: article.ogImage ?? `https://zoa.mx${article.coverImage}`,
            datePublished: article.date,
            dateModified: article.date,
            author: { "@type": "Person", name: article.author },
            publisher: {
              "@type": "Organization",
              name: "Zoa",
              logo: { "@type": "ImageObject", url: "https://zoa.mx/icon.png" },
            },
            mainEntityOfPage: { "@type": "WebPage", "@id": `https://zoa.mx/blog/${slug}` },
          }),
        }}
      />
    </main>
  );
}
