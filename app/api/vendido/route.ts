// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/vendido
//  Endpoint interno LEGADO para venta en tienda física.
//
//  @deprecated El flujo nuevo usa `registerPhysicalSale` desde una Server
//  Action autenticada del admin (sin endpoint público). Este endpoint se
//  conserva sólo por compatibilidad con clientes existentes.
//
//  Auth: header `x-internal-secret` = INTERNAL_API_SECRET (sin secreto → 401).
//
//  Body: { items: CartItem[], sellerNote?: string }
//  Returns: { ok: true, orderId: string, total: number }
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import type { CartItem, Size } from "@/lib/types";
import {
  PhysicalSaleWriteError,
  registerPhysicalSale,
} from "@/lib/physicalSale";
import {
  isInternalAuthorized,
  unauthorizedResponse,
} from "../_lib/internal";

export async function POST(req: NextRequest) {
  if (!isInternalAuthorized(req, "INTERNAL_API_SECRET")) {
    return unauthorizedResponse();
  }

  if (!process.env.APPS_SCRIPT_URL) {
    return NextResponse.json(
      {
        error:
          "APPS_SCRIPT_URL no está configurada en Railway. Agrega la variable de entorno y redeploy.",
      },
      { status: 503 },
    );
  }

  try {
    const body = (await req.json()) as {
      items?: CartItem[];
      sellerNote?: string;
    };

    const rawItems = Array.isArray(body.items) ? body.items : [];
    const items = rawItems.map((item) => ({
      // El precio y el stock se resuelven en servidor; aquí sólo viaja la identidad.
      productId:
        typeof item?.product?.id === "string" ? item.product.id.trim() : "",
      size: item?.size as Size,
      quantity: Number(item?.quantity),
    }));

    const result = await registerPhysicalSale({
      items,
      sellerNote: body.sellerNote,
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, code: result.code, error: result.message },
        { status: result.code === "OUT_OF_STOCK" ? 409 : 400 },
      );
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    if (err instanceof PhysicalSaleWriteError) {
      if (err.stage === "stock") {
        return NextResponse.json(
          { error: "Error al descontar inventario. La venta no se registró." },
          { status: 502 },
        );
      }

      return NextResponse.json(
        {
          ok: false,
          orderId: err.orderId,
          total: err.total,
          error:
            "El inventario se descontó, pero la venta no se pudo registrar en el Sheet. Anota el número de pedido y concilia manualmente.",
        },
        { status: 500 },
      );
    }

    console.error("[vendido] Unhandled error:", err);
    return NextResponse.json(
      { error: "Error interno al registrar la venta." },
      { status: 500 },
    );
  }
}
