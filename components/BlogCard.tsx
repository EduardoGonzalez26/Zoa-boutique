import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ImageReveal from "@/components/ui/ImageReveal";
import Overline from "@/components/ui/Overline";
import type { BlogArticle } from "@/lib/blog";

interface BlogCardProps {
  article: BlogArticle;
  /** Primera pieza del índice: split a sangre 7/5. */
  featured?: boolean;
  priority?: boolean;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogCard({ article, featured = false, priority = false }: BlogCardProps) {
  const dateLabel = formatDate(article.date);

  // ── Destacado: imagen a sangre (7) + panel de texto (5) ──
  if (featured) {
    return (
      <article className="grid grid-cols-1 gap-8 md:grid-cols-12 md:items-center md:gap-12">
        <Link
          href={`/blog/${article.slug}`}
          aria-label={article.title}
          className="group block cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate focus-visible:ring-offset-2 focus-visible:ring-offset-zoa-sand md:col-span-7"
        >
          <ImageReveal
            src={article.coverImage}
            alt={article.title}
            sizes="(max-width: 768px) 100vw, 58vw"
            priority={priority}
            className="aspect-[4/3] w-full sm:aspect-[16/10] md:aspect-[4/3]"
          />
        </Link>

        <div className="md:col-span-5 md:pl-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Overline tone="forest">{article.category}</Overline>
            <span aria-hidden className="h-px w-6 bg-zoa-forest-35" />
            <span className="font-sans text-[11px] tracking-wide text-zoa-slate-60 tabular">{dateLabel}</span>
          </div>

          <h2 className="mt-5 text-balance font-display text-[clamp(1.75rem,3.4vw,2.9rem)] font-normal leading-[1.04] tracking-[-0.02em] text-zoa-slate">
            <Link
              href={`/blog/${article.slug}`}
              className="link-underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate"
            >
              {article.title}
            </Link>
          </h2>

          <p className="mt-5 font-sans text-[15px] leading-[1.7] text-zoa-slate-60">
            {article.excerpt}
          </p>

          <Link
            href={`/blog/${article.slug}`}
            className="link-underline mt-8 inline-flex cursor-pointer items-center gap-2 font-sans text-[10px] uppercase tracking-[0.18em] text-zoa-slate transition-colors duration-200 hover:text-zoa-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate"
          >
            Leer artículo · {article.readTime}
            <ArrowRight size={12} aria-hidden />
          </Link>
        </div>
      </article>
    );
  }

  // ── Rejilla estándar con hairline ──
  return (
    <Link
      href={`/blog/${article.slug}`}
      className="group block cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zoa-slate focus-visible:ring-offset-2 focus-visible:ring-offset-zoa-sand"
    >
      <article className="hairline-t pt-5">
        <div className="relative mb-5 aspect-[4/3] w-full overflow-hidden bg-zoa-surface">
          <ImageReveal
            src={article.coverImage}
            alt={article.title}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="h-full w-full"
            imgClassName="object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Overline tone="forest">{article.category}</Overline>
          <span aria-hidden className="h-px w-5 bg-zoa-forest-35" />
          <span className="font-sans text-[11px] tracking-wide text-zoa-slate-60 tabular">{dateLabel}</span>
        </div>

        <h2 className="mt-4 font-display text-[clamp(1.25rem,2vw,1.6rem)] font-normal leading-[1.12] tracking-[-0.01em] text-zoa-slate">
          <span className="relative after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-zoa-forest after:transition-transform after:duration-300 after:ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:after:scale-x-100">
            {article.title}
          </span>
        </h2>

        <p className="mt-3 font-sans text-[13px] leading-[1.7] text-zoa-slate-60">
          {article.excerpt}
        </p>

        <span className="mt-6 inline-flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.18em] text-zoa-slate transition-colors duration-200 group-hover:text-zoa-forest">
          Leer artículo · {article.readTime}
          <ArrowRight
            size={12}
            aria-hidden
            className="transition-transform duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:translate-x-1"
          />
        </span>
      </article>
    </Link>
  );
}
