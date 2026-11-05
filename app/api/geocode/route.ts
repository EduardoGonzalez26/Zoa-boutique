// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/geocode?q=...
//
//  Proxy server-side a Nominatim (OpenStreetMap). El navegador NUNCA llama a
//  Nominatim directamente y su IP no se reenvía.
//
//  - User-Agent identificable (política de uso de Nominatim).
//  - countrycodes=mx, limit=5, Accept-Language: es.
//  - Caché en memoria (10 min) + caché de Next (24 h).
//  - Rate limit básico por IP hasheada (10 req/min) y throttle global de 1 req/s.
//
//  Respuesta: { results: [{ label, street, colonia, city, state, zip }] }
// ─────────────────────────────────────────────────────────────────────────────

import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT =
  process.env.GEOCODE_USER_AGENT?.trim() ||
  "ZoaBoutique/1.0 (+https://zoa.mx; hola@zoa.mx)";

const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX = 200;
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX_REQUESTS = 10;
const RATE_MAX_KEYS = 500;
const NOMINATIM_MIN_INTERVAL_MS = 1_100;

interface NominatimAddress {
  house_number?: string;
  road?: string;
  pedestrian?: string;
  footway?: string;
  path?: string;
  residential?: string;
  cycleway?: string;
  neighbourhood?: string;
  suburb?: string;
  quarter?: string;
  city_district?: string;
  borough?: string;
  hamlet?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
  state_district?: string;
  postcode?: string;
}

interface NominatimItem {
  display_name?: string;
  address?: NominatimAddress;
}

export interface GeocodeResult {
  label: string;
  street: string;
  colonia: string;
  city: string;
  state: string;
  zip: string;
}

const resultCache = new Map<string, { expiresAt: number; results: GeocodeResult[] }>();
const rateHits = new Map<string, number[]>();

// ── Rate limit ───────────────────────────────────────────────────────────────

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (rateHits.get(key) ?? []).filter(
    (timestamp) => now - timestamp < RATE_WINDOW_MS,
  );

  if (recent.length >= RATE_MAX_REQUESTS) {
    rateHits.set(key, recent);
    return true;
  }

  recent.push(now);
  rateHits.set(key, recent);

  // Limpieza acotada para que el Map no crezca sin límite.
  if (rateHits.size > RATE_MAX_KEYS) {
    for (const [ip, timestamps] of rateHits) {
      if (timestamps.every((timestamp) => now - timestamp >= RATE_WINDOW_MS)) {
        rateHits.delete(ip);
      }
    }
  }

  return false;
}

// ── Throttle global (Nominatim: máximo ~1 req/s) ─────────────────────────────

let nominatimQueue: Promise<void> = Promise.resolve();
let lastNominatimCall = 0;

function acquireNominatimSlot(): Promise<void> {
  const slot = nominatimQueue.then(async () => {
    const wait = Math.max(
      0,
      lastNominatimCall + NOMINATIM_MIN_INTERVAL_MS - Date.now(),
    );
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
    lastNominatimCall = Date.now();
  });

  nominatimQueue = slot.catch(() => undefined);
  return slot;
}

// ── Mapping ──────────────────────────────────────────────────────────────────

function toGeocodeResult(item: NominatimItem): GeocodeResult | null {
  const address = item.address ?? {};
  const displayName = (item.display_name ?? "").trim();

  const road =
    address.road ||
    address.pedestrian ||
    address.footway ||
    address.path ||
    address.residential ||
    address.cycleway ||
    "";
  const houseNumber = address.house_number ?? "";
  let street = [road, houseNumber].filter(Boolean).join(" ").trim();
  if (!street) street = displayName.split(",")[0]?.trim() ?? "";

  const colonia =
    address.neighbourhood ||
    address.suburb ||
    address.quarter ||
    address.city_district ||
    address.borough ||
    address.hamlet ||
    "";

  const city =
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.county ||
    "";

  const state = address.state || address.state_district || "";
  const zip = address.postcode || "";
  const label = displayName || street;

  if (!label) return null;

  return {
    label,
    street,
    colonia,
    city,
    state,
    zip,
  };
}

// ── Nominatim ────────────────────────────────────────────────────────────────

async function searchNominatim(query: string): Promise<GeocodeResult[]> {
  await acquireNominatimSlot();

  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("countrycodes", "mx");
  url.searchParams.set("limit", "5");
  url.searchParams.set("accept-language", "es");

  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept": "application/json",
      "Accept-Language": "es",
    },
    next: { revalidate: 86_400 },
    signal: AbortSignal.timeout(8_000),
  });

  if (!res.ok) {
    throw new Error(`Nominatim HTTP ${res.status}`);
  }

  const data = (await res.json()) as NominatimItem[];
  if (!Array.isArray(data)) return [];

  const seen = new Set<string>();
  const results: GeocodeResult[] = [];

  for (const item of data) {
    const mapped = toGeocodeResult(item);
    if (!mapped) continue;

    const dedupeKey = `${mapped.label}|${mapped.street}|${mapped.zip}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    results.push(mapped);

    if (results.length >= 5) break;
  }

  return results;
}

// ── Handler ──────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const query = (req.nextUrl.searchParams.get("q") ?? "").trim();

  if (query.length < 3) {
    return NextResponse.json({ results: [] });
  }
  if (query.length > 200) {
    return NextResponse.json(
      { results: [], error: "La búsqueda es demasiado larga." },
      { status: 400 },
    );
  }

  // La IP sólo se usa como clave de rate limit (hasheada); no se envía a
  // Nominatim ni se registra en logs.
  const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "";
  const remoteIp = forwardedFor || req.headers.get("x-real-ip") || "anon";
  const rateKey = createHash("sha256").update(remoteIp).digest("hex").slice(0, 24);

  if (isRateLimited(rateKey)) {
    return NextResponse.json(
      { results: [], error: "Demasiadas búsquedas. Intenta de nuevo en un minuto." },
      {
        status: 429,
        headers: { "Retry-After": "60" },
      },
    );
  }

  const cacheKey = query.toLowerCase();
  const cached = resultCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ results: cached.results });
  }

  try {
    const results = await searchNominatim(query);

    if (resultCache.size >= CACHE_MAX) {
      const oldest = resultCache.keys().next().value;
      if (oldest !== undefined) resultCache.delete(oldest);
    }
    resultCache.set(cacheKey, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      results,
    });

    return NextResponse.json({ results });
  } catch (error) {
    // No se registra la dirección consultada (dato personal).
    console.error(
      "[geocode] Nominatim error:",
      error instanceof Error ? error.message : "unknown",
    );
    return NextResponse.json(
      { results: [], error: "No pudimos buscar direcciones. Escribe la dirección a mano." },
      { status: 502 },
    );
  }
}
