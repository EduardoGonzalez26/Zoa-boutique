// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/vendido
//  Special internal endpoint for physical store sales.
//  No payment or shipping needed — just deducts stock and logs the sale.
//
//  Body: { items: CartItem[], sellerNote?: string }
//  Returns: { ok: true, orderId: string }
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import type { CartItem } from "@/lib/types";
import { deductStock, logSale } from "@/lib/googleSheets";

export async function POST(req: NextRequest) {
  // ── Check env vars first ─────────────────────────────────────────────────
  if (!process.env.APPS_SCRIPT_URL) {
    return NextResponse.json(
      { error: "⚠️ APPS_SCRIPT_URL no está configurada en Vercel. Ve a Settings → Environment Variables y agégala." },
      { status: 503 }
    );
  }

  try {
    const body = await req.json() as {
      items: CartItem[];
      sellerNote?: string;
    };

    const { items, sellerNote } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No hay productos en el carrito." }, { status: 400 });
    }

    const orderId  = `TIENDA-${Date.now()}`;
    const total    = items.reduce((acc, i) => acc + i.product.price * i.quantity, 0);

    // 1. Deduct stock from Google Sheets
    try {
      await deductStock(items);
    } catch (stockErr) {
      console.error("[vendido] Stock deduction failed:", stockErr);
      return NextResponse.json({ error: "Error al descontar inventario. Verifica APPS_SCRIPT_URL." }, { status: 500 });
    }

    // 2. Log the sale to the "Ventas" sheet
    try {
      await logSale({
        orderId,
        date:          new Date().toISOString(),
        customerName:  "Venta Física",
        customerEmail: "-",
        customerPhone: "-",
        address:       sellerNote ?? "Venta en tienda física",
        items:         items.map((ci) => ({
          name:  ci.product.name,
          sku:   ci.product.id,
          size:  ci.size,
          qty:   ci.quantity,
          price: ci.product.price,
        })),
        total,
        paymentMethod: "VENDIDO",
        status:        "sold_physical",
        vipCode:       "VENDIDO",
      });
    } catch (logErr) {
      console.error("[vendido] Sale log failed:", logErr);
      // Non-fatal — stock was already deducted
    }

    return NextResponse.json({ ok: true, orderId, total });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error interno";
    console.error("[vendido]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
