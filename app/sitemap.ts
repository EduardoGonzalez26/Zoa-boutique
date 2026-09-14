import type { MetadataRoute } from "next";
import { getGroupedProducts } from "@/lib/googleSheets";
import { BLOG_ARTICLES } from "@/lib/blog";

const BASE_URL = "https://zoa.mx";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`,             lastModified: new Date(), changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE_URL}/tienda`,       lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE_URL}/blog`,         lastModified: new Date(), changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE_URL}/privacidad`,   lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE_URL}/terminos`,     lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE_URL}/devoluciones`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
  ];

  // Blog articles
  const blogPages: MetadataRoute.Sitemap = BLOG_ARTICLES.map((a) => ({
    url: `${BASE_URL}/blog/${a.slug}`,
    lastModified: new Date(a.date),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  // Collection pages
  const collectionSlugs = [
    "primavera-verano", "otono-invierno", "esenciales", "outlet", "recomendados",
  ];
  const collectionPages: MetadataRoute.Sitemap = collectionSlugs.map((slug) => ({
    url: `${BASE_URL}/colecciones/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // Dynamic product pages from Google Sheets
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const products = await getGroupedProducts();
    productPages = products.map((p) => ({
      url: `${BASE_URL}/product/${p.id}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch {
    // If Sheets is unavailable, omit product pages gracefully
  }

  return [...staticPages, ...blogPages, ...collectionPages, ...productPages];
}
