// ─────────────────────────────────────────────────────────────────────────────
//  Zoa — Basic Auth para /admin
//
//  Protege únicamente las rutas del panel interno. Si ADMIN_USER o
//  ADMIN_PASSWORD no están configuradas, falla cerrado con 503.
//
//  La comparación usa SHA-256 + XOR sin cortocircuito para no filtrar
//  información por tiempos de respuesta. Web Crypto mantiene el middleware
//  compatible con el runtime Edge de Next.js.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse, type NextRequest } from "next/server";

export const config = {
  matcher: ["/admin/:path*", "/admin"],
};

const REALM = 'Basic realm="Zoa Admin"';

function unauthorized(): NextResponse {
  return new NextResponse("No autorizado", {
    status: 401,
    headers: {
      "WWW-Authenticate": REALM,
      "Cache-Control": "no-store",
    },
  });
}

function notConfigured(): NextResponse {
  return new NextResponse("Admin no configurado", {
    status: 503,
    headers: { "Cache-Control": "no-store" },
  });
}

function decodeBase64Utf8(value: string): string {
  try {
    const binary = atob(value);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return "";
  }
}

async function digest(value: string): Promise<Uint8Array> {
  const encoded = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", encoded);
  return new Uint8Array(hash);
}

/** Compara dos strings en tiempo constante (sobre sus digests SHA-256). */
async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const [digestA, digestB] = await Promise.all([digest(a), digest(b)]);
  let diff = digestA.length ^ digestB.length;
  for (let i = 0; i < digestA.length; i += 1) {
    diff |= digestA[i] ^ digestB[i];
  }
  return diff === 0;
}

export async function middleware(request: NextRequest) {
  const adminUser = process.env.ADMIN_USER;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUser || !adminPassword) {
    return notConfigured();
  }

  const authorization = request.headers.get("authorization");
  const match = authorization?.match(/^Basic\s+(.+)$/i);
  if (!match) {
    return unauthorized();
  }

  const decoded = decodeBase64Utf8(match[1].trim());
  const separator = decoded.indexOf(":");
  if (separator < 0) {
    return unauthorized();
  }

  const username = decoded.slice(0, separator);
  const password = decoded.slice(separator + 1);

  const [userOk, passwordOk] = await Promise.all([
    timingSafeEqual(username, adminUser),
    timingSafeEqual(password, adminPassword),
  ]);

  if (!userOk || !passwordOk) {
    return unauthorized();
  }

  return NextResponse.next();
}
