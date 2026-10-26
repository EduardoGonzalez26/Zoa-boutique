// POST /api/validate-coupon
// Body: { code: string }
//
// Contrato:
// - Campañas (AMOR15, MAMA15, BUENFIN15, NAVIDAD15) se resuelven localmente con
//   lib/promotions.ts y solo son válidas dentro de su ventana anual:
//     { ok: true, type: "porcentaje", discount: 15, code, scope: "eligible" }
//   Fuera de ventana:
//     { ok: false, error: "Este código solo está activo durante su campaña." }
// - Cualquier otro código conserva el flujo legacy de Google Apps Script:
//     { ok: true, type: "interno"|"porcentaje"|"fijo", discount, code }
//     o { ok: false, error }

import { NextRequest, NextResponse } from "next/server";
import { getPromoByCode, getZoaNow, isPromoActive } from "@/lib/promotions";

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json() as { code?: string };

    if (!code?.trim()) {
      return NextResponse.json({ ok: false, error: "Ingresa un código de cupón." });
    }

    const normalizedCode = code.trim().toUpperCase();
    const promo = getPromoByCode(normalizedCode);

    // Campañas: resolución local, nunca Apps Script.
    if (promo) {
      if (!isPromoActive(promo, getZoaNow())) {
        return NextResponse.json({
          ok: false,
          error: "Este código solo está activo durante su campaña.",
        });
      }

      return NextResponse.json({
        ok: true,
        type: "porcentaje",
        discount: promo.discount,
        code: promo.code,
        scope: promo.excludeDiscounted ? "eligible" : "all",
      });
    }

    // Legacy: el resto de cupones sigue viviendo en Apps Script.
    const appsScriptUrl = process.env.APPS_SCRIPT_URL;
    if (!appsScriptUrl) {
      return NextResponse.json({ ok: false, error: "APPS_SCRIPT_URL no configurada." }, { status: 503 });
    }

    const res = await fetch(appsScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "validateCoupon", code: normalizedCode }),
      redirect: "follow",
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al validar cupón";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
