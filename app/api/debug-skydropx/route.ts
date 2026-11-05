// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/debug-skydropx
//  Diagnóstico interno de SOLO LECTURA: lista los últimos envíos y recolecciones.
//
//  Auth: header `x-internal-secret` = INTERNAL_API_SECRET.
//  En production, sin secreto responde 404 (no revela que existe).
//
//  Ya NO crea pickups ni ejecuta POST contra Skydropx desde un GET.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import {
  isInternalAuthorized,
  unauthorizedResponse,
} from "../_lib/internal";

const BASE = "https://api-pro.skydropx.com";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!isInternalAuthorized(req, "INTERNAL_API_SECRET")) {
    return unauthorizedResponse({ notFoundInProduction: true });
  }

  if (!process.env.SKYDROPX_API_KEY || !process.env.SKYDROPX_API_SECRET) {
    return NextResponse.json(
      { error: "Skydropx no está configurado." },
      { status: 503 },
    );
  }

  try {
    // ── 1. OAuth token ──────────────────────────────────────────────────────
    const tokenRes = await fetch(`${BASE}/api/v1/oauth/token`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type:    "client_credentials",
        client_id:     process.env.SKYDROPX_API_KEY,
        client_secret: process.env.SKYDROPX_API_SECRET,
      }),
      cache: "no-store",
    });

    if (!tokenRes.ok) {
      console.error("[debug-skydropx] Token request failed:", tokenRes.status);
      return NextResponse.json(
        { error: "Token failed" },
        { status: 502 },
      );
    }

    const tokenData = await tokenRes.json() as { access_token?: string };
    if (!tokenData.access_token) {
      return NextResponse.json(
        { error: "Token missing in response" },
        { status: 502 },
      );
    }

    const headers = {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${tokenData.access_token}`,
    };

    // ── 2. Most recent shipments (solo lectura) ─────────────────────────────
    const shipListRes = await fetch(`${BASE}/api/v1/shipments?per_page=15`, {
      headers,
      cache: "no-store",
    });
    const shipListData = await shipListRes.json();

    // ── 3. Most recent pickups (solo lectura) ───────────────────────────────
    const pickupListRes = await fetch(`${BASE}/api/v1/pickups?per_page=3`, {
      headers,
      cache: "no-store",
    });
    const pickupListData = await pickupListRes.json();

    return NextResponse.json(
      {
        ok: true,
        shipments: {
          status: shipListRes.status,
          data: shipListData,
        },
        pickups: {
          status: pickupListRes.status,
          data: pickupListData,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[debug-skydropx] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
