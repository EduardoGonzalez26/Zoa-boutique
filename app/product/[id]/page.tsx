import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProducts, getGroupedProductById } from "@/lib/googleSheets";
import ProductGalleryClient from "@/components/ProductGalleryClient";
import type { Product } from "@/lib/types";

export const revalidate = 60;

async function getProductWithFallback(id: string): Promise<Product | null> {
  try {
    // Decode in case SKU was URL-encoded (e.g. slashes, accents)
    return await getGroupedProductById(decodeURIComponent(id));
  } catch {
    return null;
  }
}

async function getProductsForCrossSell(): Promise<Product[]> {
  try {
    return await getProducts();
  } catch {
    return [];
  }
}

async function getAllProductIds(): Promise<string[]> {
  try {
    const products = await getProducts();
    return products.map((p) => p.id);
  } catch {
    return [];
  }
}

// ── Metadata ───────────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductWithFallback(id);
  if (!product) return { title: "Producto no encontrado | Zoa" };

  const formattedPrice = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(product.price);

  return {
    title: `${product.name} — ${product.category} | Zoa`,
    description: `${product.name} · ${product.category} de la colección ${product.collection}. ${formattedPrice} MXN. Envíos a todo México.`,
    openGraph: {
      title: `${product.name} | Zoa`,
      description: `${product.category} · ${product.collection} · ${formattedPrice}`,
      images: product.images[0] ? [{ url: product.images[0], width: 800, height: 1000, alt: product.name }] : [],
      type: "website",
    },
    alternates: { canonical: `https://zoa.mx/product/${id}` },
  };
}

// ── Static Params ──────────────────────────────────────────────────────────────
export async function generateStaticParams() {
  const ids = await getAllProductIds();
  return ids.map((id) => ({ id: encodeURIComponent(id) }));
}

// ── Page ────────────────────────────────────────────────────────────────────────
export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, allProducts] = await Promise.all([
    getProductWithFallback(id),
    getProductsForCrossSell(),
  ]);

  if (!product) notFound();

  return (
    // data-product-name is read by WhatsAppButton for smart context
    <div className="min-h-screen pt-28 md:pt-36" data-product-name={product.name}>
      <ProductGalleryClient product={product} allProducts={allProducts} />
    </div>
  );
}
