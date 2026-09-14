import type { Metadata } from "next";
import { Suspense } from "react";
import TiendaClient from "@/components/TiendaClient";
import { getGroupedProducts } from "@/lib/googleSheets";
import type { Product } from "@/lib/types";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Tienda | Zoa",
  description:
    "Explora toda la colección de Zoa. Blusas, vestidos, pantalones, sacos y más. Envíos a todo México.",
};

async function getProductsWithFallback(): Promise<Product[]> {
  try {
    return await getGroupedProducts();
  } catch {
    return [];
  }
}

export default async function TiendaPage() {
  const products = await getProductsWithFallback();

  return (
    <Suspense fallback={
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[var(--color-stone-200)] border-t-[var(--color-gold)] rounded-full animate-spin" />
      </div>
    }>
      <TiendaClient products={products} />
    </Suspense>
  );
}
