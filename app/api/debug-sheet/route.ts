// GET /api/debug-sheet?sku=XXX
// Diagnóstico interno de solo lectura.
//
// Auth: header `x-internal-secret` = INTERNAL_API_SECRET.
// En production, sin secreto responde 404 (no revela que existe).

import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/lib/googleSheets";
import {
  isInternalAuthorized,
  unauthorizedResponse,
} from "../_lib/internal";

export async function GET(req: NextRequest) {
  if (!isInternalAuthorized(req, "INTERNAL_API_SECRET")) {
    return unauthorizedResponse({ notFoundInProduction: true });
  }

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
    console.error("[debug-sheet] Error:", err);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 },
    );
  }
}
