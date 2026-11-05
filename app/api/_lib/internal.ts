// ─────────────────────────────────────────────────────────────────────────────
//  Autorización de endpoints internos
//
//  Los endpoints que no debe invocar el navegador exigen el header
//  `x-internal-secret`. En producción el secreto es obligatorio (falla
//  cerrado); en development se permite la ausencia de la env para no bloquear
//  el trabajo local, con un aviso en logs.
//
//  Envs:
//   - INTERNAL_API_SECRET      → /api/vendido, /api/debug-sheet, /api/debug-skydropx
//   - INTERNAL_WEBHOOK_SECRET  → /api/webhooks/payment-success
// ─────────────────────────────────────────────────────────────────────────────

import { timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

export type InternalSecretEnv =
  | "INTERNAL_API_SECRET"
  | "INTERNAL_WEBHOOK_SECRET";

/** Comparación en tiempo constante (evita filtrar longitud/contenido). */
export function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left, "utf8");
  const b = Buffer.from(right, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function isInternalAuthorized(
  req: NextRequest,
  envName: InternalSecretEnv,
): boolean {
  const expected = process.env[envName];

  if (!expected) {
    if (process.env.NODE_ENV === "production") return false;
    console.warn(
      `[internal] ${envName} no está configurada; se permite acceso en development.`,
    );
    return true;
  }

  const provided = req.headers.get("x-internal-secret") ?? "";
  return safeEqual(provided, expected);
}

/**
 * Respuesta para peticiones no autorizadas.
 * - Endpoints internos de negocio: 401 siempre.
 * - Endpoints de debug: en production se oculta su existencia con 404.
 */
export function unauthorizedResponse(options?: {
  notFoundInProduction?: boolean;
}): Response {
  if (options?.notFoundInProduction && process.env.NODE_ENV === "production") {
    return new Response(null, { status: 404 });
  }
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
