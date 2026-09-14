import { NextResponse } from "next/server";
import { getProducts } from "@/lib/googleSheets";

// GET /api/debug-sheet
// Returns the first 10 products + any products matching ?sku=XXX
// REMOVE this endpoint after debugging.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const skuQuery = (searchParams.get("sku") ?? "").toLowerCase();

    const products = await getProducts();

    const matched = skuQuery
      ? products.filter(
          (p) =>
            (p.sku ?? "").toLowerCase().includes(skuQuery) ||
            p.id.toLowerCase().includes(skuQuery) ||
            p.name.toLowerCase().includes(skuQuery)
        )
      : products.slice(0, 10);

    return NextResponse.json({
      total: products.length,
      matched: matched.length,
      query: skuQuery || "(none — showing first 10)",
      products: matched.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category,
        collection: p.collection,
        stock: p.stock,
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
