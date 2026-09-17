import type { Metadata } from "next";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
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
      <div className="flex min-h-screen items-center justify-center pt-28">
        <Loader2 size={20} aria-hidden className="animate-spin text-zoa-slate" />
      </div>
    }>
      <TiendaClient products={products} />
    </Suspense>
  );
}
