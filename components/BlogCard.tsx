"use client";

import Link from "next/link";
import { useState } from "react";
import type { BlogArticle } from "@/lib/blog";

const CATEGORY_COLORS: Record<string, string> = {
  Tendencias: "#C9A96E",
  Estilo:     "#8B6E4E",
  Guías:      "#6B8B6E",
};

export default function BlogCard({ article }: { article: BlogArticle }) {
  const [hovered, setHovered] = useState(false);
  const [imgHovered, setImgHovered] = useState(false);

  return (
    <Link
      href={`/blog/${article.slug}`}
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
    >
      <article
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: "#FFFFFF",
          border: "1px solid #EDE8E2",
          overflow: "hidden",
          transition: "box-shadow 0.3s",
          boxShadow: hovered ? "0 8px 32px rgba(0,0,0,0.10)" : "none",
        }}
      >
        {/* Image */}
        <div style={{ height: "220px", overflow: "hidden", background: "#EDE8E2" }}>
          <img
            src={article.coverImage}
            alt={article.title}
            onMouseEnter={() => setImgHovered(true)}
            onMouseLeave={() => setImgHovered(false)}
            style={{
              width: "100%", height: "100%", objectFit: "cover", display: "block",
              transition: "transform 0.5s",
              transform: imgHovered ? "scale(1.04)" : "scale(1)",
            }}
          />
        </div>

        {/* Content */}
        <div style={{ padding: "24px" }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "12px" }}>
            <span style={{
              fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase",
              padding: "3px 10px", background: CATEGORY_COLORS[article.category] ?? "#C9A96E",
              color: "#FAF8F5", fontFamily: "sans-serif",
            }}>
              {article.category}
            </span>
            <span style={{ fontSize: "11px", color: "#A89F95", fontFamily: "sans-serif" }}>
              {new Date(article.date).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}
            </span>
          </div>

          <h2 style={{
            margin: "0 0 10px", fontFamily: "Georgia, serif", fontSize: "18px",
            fontWeight: 400, color: "#1C1917", lineHeight: 1.4,
          }}>
            {article.title}
          </h2>

          <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#6E655C", lineHeight: 1.7, fontFamily: "sans-serif" }}>
            {article.excerpt}
          </p>

          <span style={{
            fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase",
            color: "#C9A96E", fontFamily: "sans-serif", borderBottom: "1px solid #C9A96E", paddingBottom: "2px",
          }}>
            Leer artículo · {article.readTime}
          </span>
        </div>
      </article>
    </Link>
  );
}
