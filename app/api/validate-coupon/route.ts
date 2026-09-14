// POST /api/validate-coupon
// Body: { code: string }
// Returns: { ok: true, type: "interno"|"porcentaje"|"fijo", discount: number, code: string }
//       or { ok: false, error: string }

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json() as { code: string };

    if (!code?.trim()) {
      return NextResponse.json({ ok: false, error: "Ingresa un código de cupón." });
    }

    const appsScriptUrl = process.env.APPS_SCRIPT_URL;
    if (!appsScriptUrl) {
      return NextResponse.json({ ok: false, error: "APPS_SCRIPT_URL no configurada." }, { status: 503 });
    }

    const res = await fetch(appsScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "validateCoupon", code: code.trim().toUpperCase() }),
      redirect: "follow",
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al validar cupón";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
