import type { Metadata } from "next";
import Link from "next/link";
import { BLOG_ARTICLES } from "@/lib/blog";
import BlogCard from "@/components/BlogCard";

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
  return (
    <main style={{ background: "#FAF8F5", minHeight: "100vh", paddingTop: "80px" }}>
      {/* Hero */}
      <section style={{ background: "#1C1917", padding: "60px 24px", textAlign: "center" }}>
        <p style={{ margin: "0 0 12px", fontSize: "11px", letterSpacing: "0.3em", textTransform: "uppercase", color: "#C9A96E" }}>
          Zoa · Blog
        </p>
        <h1 style={{ margin: 0, fontFamily: "Georgia, serif", fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 400, color: "#FAF8F5", letterSpacing: "0.05em" }}>
          Moda, Estilo &amp; Tendencias
        </h1>
        <p style={{ margin: "16px auto 0", maxWidth: "500px", fontSize: "14px", color: "#A89F95", lineHeight: 1.7 }}>
          Guías, inspiración y consejos de estilo para mujeres que saben lo que quieren.
        </p>
      </section>

      {/* Articles grid */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "60px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "32px" }}>
          {BLOG_ARTICLES.map((article) => (
            <BlogCard key={article.slug} article={article} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "#1C1917", padding: "60px 24px", textAlign: "center" }}>
        <p style={{ margin: "0 0 8px", fontSize: "11px", letterSpacing: "0.3em", textTransform: "uppercase", color: "#C9A96E" }}>
          Colección 2026
        </p>
        <h2 style={{ margin: "0 0 16px", fontFamily: "Georgia, serif", fontSize: "28px", fontWeight: 400, color: "#FAF8F5" }}>
          Descubre nuestra tienda
        </h2>
        <p style={{ margin: "0 0 28px", fontSize: "14px", color: "#A89F95" }}>
          Más de 100 prendas listas para ti. Envíos a todo México.
        </p>
        <Link href="/tienda" style={{
          display: "inline-block", background: "#C9A96E", color: "#FAF8F5",
          padding: "14px 36px", fontSize: "12px", letterSpacing: "0.2em",
          textTransform: "uppercase", textDecoration: "none",
        }}>
          Ver colección →
        </Link>
      </section>
    </main>
  );
}
