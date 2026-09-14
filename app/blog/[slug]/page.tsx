import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BLOG_ARTICLES, getArticleBySlug } from "@/lib/blog";

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

  return (
    <main style={{ background: "#FAF8F5", minHeight: "100vh", paddingTop: "80px" }}>
      {/* Hero image */}
      <div style={{ height: "clamp(240px, 40vw, 440px)", overflow: "hidden", position: "relative" }}>
        <img
          src={article.coverImage}
          alt={article.title}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.55))" }} />
      </div>

      {/* Article content */}
      <div style={{ maxWidth: "740px", margin: "0 auto", padding: "0 24px 80px" }}>
        {/* Breadcrumb */}
        <nav style={{ display: "flex", gap: "8px", alignItems: "center", padding: "24px 0 32px", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#A89F95", fontFamily: "sans-serif" }}>
          <Link href="/" style={{ color: "#A89F95", textDecoration: "none" }}>Inicio</Link>
          <span>·</span>
          <Link href="/blog" style={{ color: "#A89F95", textDecoration: "none" }}>Blog</Link>
          <span>·</span>
          <span style={{ color: "#6E655C" }}>{article.category}</span>
        </nav>

        {/* Title block */}
        <header style={{ marginBottom: "36px" }}>
          <span style={{
            display: "inline-block", marginBottom: "16px",
            fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase",
            padding: "4px 12px", background: "#C9A96E", color: "#FAF8F5", fontFamily: "sans-serif",
          }}>
            {article.category}
          </span>

          <h1 style={{
            margin: "0 0 16px", fontFamily: "Georgia, serif",
            fontSize: "clamp(24px, 4vw, 38px)", fontWeight: 400,
            color: "#1C1917", lineHeight: 1.3, letterSpacing: "0.02em",
          }}>
            {article.title}
          </h1>

          <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap", fontSize: "12px", color: "#A89F95", fontFamily: "sans-serif" }}>
            <span>{new Date(article.date).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}</span>
            <span>·</span>
            <span>Lectura: {article.readTime}</span>
            <span>·</span>
            <span style={{ color: "#8B6E4E", fontStyle: "italic" }}>Por {article.author}</span>
          </div>
        </header>

        {/* Lead / excerpt */}
        <p style={{
          margin: "0 0 36px", fontSize: "17px", color: "#6E655C",
          lineHeight: 1.8, fontFamily: "Georgia, serif", fontStyle: "italic",
          borderLeft: "3px solid #C9A96E", paddingLeft: "20px",
        }}>
          {article.excerpt}
        </p>

        {/* Article body */}
        <div
          style={{
            fontSize: "15px", lineHeight: 1.9, color: "#3A3530", fontFamily: "sans-serif",
          }}
          dangerouslySetInnerHTML={{ __html: article.content
            .replace(/<h2>/g, '<h2 style="font-family:Georgia,serif;font-size:22px;font-weight:400;color:#1C1917;margin:40px 0 16px;letter-spacing:0.03em;">')
            .replace(/<h3>/g, '<h3 style="font-family:Georgia,serif;font-size:17px;font-weight:400;color:#1C1917;margin:28px 0 10px;">')
            .replace(/<p>/g, '<p style="margin:0 0 20px;">')
            .replace(/<ul>/g, '<ul style="margin:0 0 20px;padding-left:24px;">')
            .replace(/<ol>/g, '<ol style="margin:0 0 20px;padding-left:24px;">')
            .replace(/<li>/g, '<li style="margin-bottom:8px;">')
            .replace(/<a /g, '<a style="color:#C9A96E;text-decoration:underline;" ')
          }}
        />

        {/* Back to blog */}
        <div style={{ marginTop: "56px", paddingTop: "32px", borderTop: "1px solid #EDE8E2" }}>
          <Link href="/blog" style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase",
            color: "#C9A96E", textDecoration: "none", fontFamily: "sans-serif",
          }}>
            ← Volver al Blog
          </Link>
        </div>
      </div>

      {/* Related articles */}
      {relatedArticles.length > 0 && (
        <section style={{ borderTop: "1px solid #EDE8E2", background: "#FFFFFF", padding: "60px 24px" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <p style={{ margin: "0 0 32px", fontSize: "11px", letterSpacing: "0.3em", textTransform: "uppercase", color: "#A89F95", fontFamily: "sans-serif" }}>
              También te puede interesar
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
              {relatedArticles.map((rel) => (
                <Link key={rel.slug} href={`/blog/${rel.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div style={{ border: "1px solid #EDE8E2", overflow: "hidden", background: "#FAF8F5" }}>
                    <img src={rel.coverImage} alt={rel.title} style={{ width: "100%", height: "160px", objectFit: "cover", display: "block" }} />
                    <div style={{ padding: "20px" }}>
                      <p style={{ margin: "0 0 8px", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#A89F95", fontFamily: "sans-serif" }}>{rel.category}</p>
                      <h3 style={{ margin: 0, fontFamily: "Georgia, serif", fontSize: "16px", fontWeight: 400, color: "#1C1917", lineHeight: 1.4 }}>{rel.title}</h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Shop CTA */}
      <section style={{ background: "#1C1917", padding: "50px 24px", textAlign: "center" }}>
        <h2 style={{ margin: "0 0 16px", fontFamily: "Georgia, serif", fontSize: "24px", fontWeight: 400, color: "#FAF8F5" }}>
          Descubre nuestra colección
        </h2>
        <Link href="/tienda" style={{
          display: "inline-block", background: "#C9A96E", color: "#FAF8F5",
          padding: "12px 32px", fontSize: "11px", letterSpacing: "0.2em",
          textTransform: "uppercase", textDecoration: "none", marginTop: "8px",
        }}>
          Ver tienda →
        </Link>
      </section>

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
