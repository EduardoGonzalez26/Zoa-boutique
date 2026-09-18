// ─────────────────────────────────────────────────────────────────────────────
//  lib/skydropx.ts
//  Skydropx Pro API — OAuth2 + quotation + shipment creation.
//  Based on official docs: https://app.skydropx.com/mx/es-MX/api-docs
// ─────────────────────────────────────────────────────────────────────────────

const BASE = "https://api-pro.skydropx.com";

// ── Token cache (valid 2h) ────────────────────────────────────────────────────
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getBearerToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const clientId     = (process.env.SKYDROPX_API_KEY    ?? "").trim();
  const clientSecret = (process.env.SKYDROPX_API_SECRET ?? "").trim();

  if (!clientId || !clientSecret) {
    throw new Error("Skydropx credentials not set in environment variables");
  }

  console.log(`[Skydropx] Using client_id: ${clientId.slice(0, 8)}... (len=${clientId.length})`);

  const res = await fetch(`${BASE}/api/v1/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type:    "client_credentials",
      client_id:     clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`[Skydropx] Token request failed — status: ${res.status}, body: ${err}`);
    throw new Error(`Skydropx token error (${res.status}): ${err}`);
  }

  const data = await res.json() as { access_token: string; expires_in: number };
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;
  return cachedToken;
}

// ── Origin address for quotations ─────────────────────────────────────────────
function getOriginQuotationAddress() {
  return {
    country_code: "MX",
    postal_code:  process.env.SKYDROPX_PICKUP_ZIP      ?? "52764",
    area_level1:  process.env.SKYDROPX_PICKUP_STATE    ?? "Estado de México",
    area_level2:  process.env.SKYDROPX_PICKUP_CITY     ?? "Huixquilucan",
    area_level3:  process.env.SKYDROPX_PICKUP_COLONIA  ?? "Jesús del Monte",
  };
}

// ── Origin address for shipments (needs full contact info) ────────────────────
function getOriginShipmentAddress() {
  const street  = process.env.SKYDROPX_PICKUP_STREET    ?? "Avenida Deportivo";
  const number  = process.env.SKYDROPX_PICKUP_NUMBER    ?? "1";
  const apt     = process.env.SKYDROPX_PICKUP_APARTMENT ?? "Casa 11";
  const colonia = process.env.SKYDROPX_PICKUP_COLONIA   ?? "Jesús del Monte";
  return {
    name:    process.env.SKYDROPX_PICKUP_NAME ?? "Zoa Boutique",
    company: "Zoa Boutique",
    street1: `${street} #${number}`,
    street2: apt ? `Int. ${apt}` : "",
    phone:   process.env.SKYDROPX_PICKUP_PHONE ?? "5521068191",
    email:   "hola@zoa.mx",
    reference: [apt, colonia].filter(Boolean).join(", "),
  };
}

export interface CustomerAddress {
  fullName:    string;
  street:      string;
  numExterior: string;
  numInterior: string;
  colonia:     string;
  city:        string;
  state:       string;
  zip:         string;
  phone:       string;
  email:       string;
}

// ── Standard parcel — Bolsa mensajería NeiPack 28×35 cm, ~1 kg ──────────────
const PARCEL = {
  weight:        1.0,
  height:        10,
  width:         28,
  length:        35,
  mass_unit:     "KG",
  distance_unit: "CM",
};

interface SkydropxShipmentResult {
  trackingNumber: string | null;
  labelUrl:       string | null;
  carrier:        string | null;
  service:        string | null;
  cost:           number | null;
  rawShipment:    unknown;
  pickupNumber:   string | null;  // Num. de recolección programada
  pickupDate:     string | null;  // Fecha YYYY-MM-DD de la recolección
  pickupError:    string | null;  // Error if pickup scheduling failed
}

// ── Pro API shipment response shape (only the fields we read) ────────────────
type SkydropxIncluded = {
  type?: string;
  attributes?: {
    tracking_number?: string | null;
    label_url?: string | null;
  };
};

type SkydropxProResponse = {
  data?: {
    id?: string;
    attributes?: {
      master_tracking_number?: string | null;
      tracking_number?: string | null;
      label_url?: string | null;
    };
  };
  included?: SkydropxIncluded[];
  tracking_number?: string | null;
  label_url?: string | null;
  id?: string;
};

/**
 * Creates a Skydropx shipment:
 * 1. Gets OAuth token
 * 2. Creates a quotation using postal_code / area_level fields (Pro API format)
 * 3. Polls for rates until is_completed = true
 * 4. Creates the shipment with the cheapest rate
 */
export async function createSkydropxShipment(
  destination: CustomerAddress,
  orderRef?: string,
): Promise<SkydropxShipmentResult> {
  const token = await getBearerToken();

  const headers = {
    "Content-Type":  "application/json",
    "Authorization": `Bearer ${token}`,
  };

  // ── 1. Create quotation (Pro API format) ──────────────────────────────────
  //    Requires: quotation wrapper, postal_code, area_level1/2/3, parcels[]
  const originQ = getOriginQuotationAddress();

  const quotationBody = {
    quotation: {
      address_from: originQ,
      address_to: {
        country_code: "MX",
        postal_code:  destination.zip,
        area_level1:  destination.state,
        area_level2:  destination.city,
        area_level3:  destination.colonia || "Centro",
      },
      parcels: [PARCEL],
    },
  };

  console.log("[Skydropx] Quotation body:", JSON.stringify(quotationBody, null, 2));

  const quotRes = await fetch(`${BASE}/api/v1/quotations`, {
    method:  "POST",
    headers,
    body:    JSON.stringify(quotationBody),
  });

  if (!quotRes.ok) {
    const err = await quotRes.text();
    console.error(`[Skydropx] Quotation failed — status: ${quotRes.status}, body: ${err}`);
    throw new Error(`Skydropx quotation error (${quotRes.status}): ${err}`);
  }

  const quotData = await quotRes.json() as {
    id: string;
    is_completed: boolean;
    rates: Array<{
      id: string;
      status: string;
      total: string;
      amount: string;
      provider_name: string;
      provider_service_name: string;
      days: number;
    }>;
  };

  console.log(`[Skydropx] Quotation created: id=${quotData.id}, is_completed=${quotData.is_completed}`);

  // ── 2. Poll for rates until is_completed = true (max ~6s) ─────────────────
  let quotResult = quotData;
  if (!quotResult.is_completed) {
    for (let attempt = 0; attempt < 4; attempt++) {
      await new Promise((r) => setTimeout(r, 1500));
      const pollRes = await fetch(`${BASE}/api/v1/quotations/${quotResult.id}`, { headers });
      quotResult = await pollRes.json() as typeof quotData;
      console.log(`[Skydropx] Poll attempt ${attempt + 1}: is_completed=${quotResult.is_completed}, rates=${quotResult.rates?.length ?? 0}`);
      if (quotResult.is_completed) break;
    }
  }

  // Filter only successful rates
  const availableRates = (quotResult.rates ?? []).filter(
    (r) => r.status === "approved" || r.status === "price_found_internal" || r.status === "price_found_external"
  );

  console.log(`[Skydropx] Available rates: ${availableRates.length} of ${quotResult.rates?.length ?? 0}`);

  if (!availableRates.length) {
    console.error("[Skydropx] All rates:", JSON.stringify(quotResult.rates, null, 2));
    throw new Error("Skydropx: no approved rates returned");
  }


  // ── 3. Select cheapest pickup-capable carrier ────────────────────────────
  // Carriers confirmed (via GET /api/v1/pickups/coverage) as NOT supporting
  // pickup-via-API for this Skydropx account. Verified 2026-04-30.
  const NO_PICKUP_CARRIERS = new Set([
    "imile",              // coverage: "No matching carrier found: IMILE"
    "ivoy",               // last-mile only, no pickup
    "mercadoenvios",      // marketplace only
    "ninetynineminutes",  // coverage: "No matching carrier found: NINETYNINEMINUTES"
    "99minutos",          // alternate slug
    "estafeta",           // coverage OK but POST returns 422 "solicita via soporte"
                          //   → account-specific block; contact Skydropx to enable
    // Confirmed carriers that DO support pickup-API (do not add here):
    //   ampm   → coverage returns AMPM / PLATAFORMAS (window 09:00–19:00)
    //   fedex  → coverage returns FEDEX / STANDARD_OVERNIGHT (08:30–18:00)
  ]);

  const pickupRates = availableRates.filter(
    (r) => !NO_PICKUP_CARRIERS.has(r.provider_name.toLowerCase()),
  );

  const ratesPool = pickupRates.length > 0 ? pickupRates : availableRates;

  if (pickupRates.length === 0) {
    console.warn(
      "[Skydropx] No pickup-capable carrier found — falling back to cheapest overall.",
      "All rates:", availableRates.map((r) => `${r.provider_name}=$${r.total}`).join(", "),
    );
  } else {
    const excluded = availableRates
      .filter((r) => NO_PICKUP_CARRIERS.has(r.provider_name.toLowerCase()))
      .map((r) => `${r.provider_name}=$${r.total}`)
      .join(", ");
    if (excluded) console.log(`[Skydropx] Excluded no-pickup carriers: ${excluded}`);
  }

  const cheapest = ratesPool.sort(
    (a, b) => parseFloat(a.total) - parseFloat(b.total),
  )[0];

  const pickupOk = pickupRates.length > 0;
  console.log(
    `[Skydropx] Selected rate: ${cheapest.provider_name} / ${cheapest.provider_service_name}` +
    ` — $${cheapest.total} (${cheapest.days} days)` +
    (pickupOk ? "" : " [FALLBACK — no pickup carrier available]"),
  );



  // ── 4. Create shipment ────────────────────────────────────────────────────
  const originS = getOriginShipmentAddress();
  const destStreet = [
    destination.street,
    destination.numExterior ? `#${destination.numExterior}` : "",
  ].filter(Boolean).join(" ");

  const shipBody = {
    rate_id: cheapest.id,
    address_from: originS,
    address_to: {
      name:      destination.fullName,
      street1:   destStreet,
      street2:   destination.numInterior ? `Int. ${destination.numInterior}` : "",
      phone:     destination.phone,
      email:     destination.email,
      reference: [
        destination.numInterior ? `Int. ${destination.numInterior}` : "",
        destination.colonia,
      ].filter(Boolean).join(", ") || destination.city || "N/A",
    },
    label_format: "pdf",
    consignment_note: "53101600",  // SAT ClaveProdServ: Ropa/Prendas de vestir
    consignment_note_packaging_code: "4G",  // Caja de cartón corrugado
    package_type:     "4G",        // UN code: caja de cartón corrugado
    ...(orderRef ? { reference: orderRef } : {}),
  };

  // Wrap in "shipment" object as required by the Pro API
  const wrappedShipBody = { shipment: shipBody };

  console.log("[Skydropx] Shipment body:", JSON.stringify(wrappedShipBody, null, 2));

  const shipRes = await fetch(`${BASE}/api/v1/shipments`, {
    method:  "POST",
    headers,
    body:    JSON.stringify(wrappedShipBody),
  });

  if (!shipRes.ok) {
    const err = await shipRes.text();
    console.error(`[Skydropx] Shipment creation failed — status: ${shipRes.status}, body: ${err}`);
    throw new Error(`Skydropx shipment error (${shipRes.status}): ${err}`);
  }

  const shipData = await shipRes.json() as Record<string, unknown>;
  console.log("[Skydropx] Shipment created — full response:", JSON.stringify(shipData));

  // ── Extract tracking info using the REAL Pro API field names ─────────────
  // Confirmed from debug endpoint:
  //   • tracking  → data.attributes.master_tracking_number  (NOT tracking_number)
  //   • label_url → included[type=package].attributes.label_url  (NOT data.attributes)
  //   • id        → data.id  (UUID string) ✅
  function extract(d: SkydropxProResponse) {
    const trackingNumber: string | null =
      d?.data?.attributes?.master_tracking_number          // ← real Pro API field
      ?? d?.data?.attributes?.tracking_number              // fallback legacy
      ?? d?.included?.find((i) => i.type === "package")
           ?.attributes?.tracking_number                   // fallback from included package
      ?? d?.tracking_number
      ?? null;

    // label_url lives in the included "package" object, not in shipment attributes
    const pkg = d?.included?.find((i) => i.type === "package");
    const labelUrl: string | null =
      pkg?.attributes?.label_url
      ?? d?.data?.attributes?.label_url                    // fallback
      ?? d?.label_url
      ?? null;

    const shipmentId: string | null = d?.data?.id ?? d?.id ?? null;
    return { trackingNumber, labelUrl, shipmentId };
  }

  const initial = extract(shipData as SkydropxProResponse);
  let trackingNumber = initial.trackingNumber;
  let labelUrl       = initial.labelUrl;
  const shipmentId   = initial.shipmentId;

  console.log(`[Skydropx] Initial extract — shipmentId:${shipmentId} tracking:${trackingNumber} label:${labelUrl}`);

  // ── 5. Schedule pickup IMMEDIATELY (uses shipmentId, not label) ───────────
  // We do this before polling for the label so the pickup is registered ASAP.
  let pickupResult: { pickupNumber: string | null; pickupDate: string | null } = {
    pickupNumber: null,
    pickupDate:   null,
  };
  let pickupError: string | null = null;

  if (shipmentId) {
    try {
      pickupResult = await schedulePickup(headers, shipmentId);
      console.log("[Skydropx] Pickup scheduled:", pickupResult.pickupNumber, pickupResult.pickupDate);
    } catch (err) {
      pickupError = err instanceof Error ? err.message : String(err);
      console.error("[Skydropx] Pickup scheduling failed (non-fatal):", pickupError);
    }
  } else {
    pickupError = "Could not extract shipment ID";
    console.warn("[Skydropx] Could not extract shipment ID — skipping pickup scheduling");
  }

  // ── 6. Poll for label URL if not yet ready (max 3 × 3 s = 9 s) ──────────
  // master_tracking_number is available immediately; label may take a few seconds.
  if (shipmentId && !labelUrl) {
    for (let attempt = 0; attempt < 3; attempt++) {
      await new Promise((r) => setTimeout(r, 3000));
      const pollRes = await fetch(`${BASE}/api/v1/shipments/${shipmentId}`, { headers });
      if (pollRes.ok) {
        const polled = extract(await pollRes.json());
        console.log(`[Skydropx] Label poll ${attempt + 1}: tracking=${polled.trackingNumber} label=${polled.labelUrl}`);
        trackingNumber = polled.trackingNumber ?? trackingNumber;
        labelUrl       = polled.labelUrl       ?? labelUrl;
        if (labelUrl) break;
      } else {
        console.warn(`[Skydropx] Label poll ${attempt + 1} failed: ${pollRes.status}`);
      }
    }
  }

  console.log(`[Skydropx] Final — shipmentId:${shipmentId} tracking:${trackingNumber} label:${labelUrl} pickup:${pickupResult.pickupNumber} pickupError:${pickupError}`);

  return {
    trackingNumber,
    labelUrl,
    carrier:      cheapest.provider_name,
    service:      cheapest.provider_service_name,
    cost:         parseFloat(cheapest.total),
    rawShipment:  shipData,
    pickupNumber: pickupResult.pickupNumber,
    pickupDate:   pickupResult.pickupDate,
    pickupError,
  };
}

// ── Pickup helpers ────────────────────────────────────────────────────────────

/**
 * Returns the next business day (Mon–Fri) as "YYYY-MM-DD" in Mexico City time.
 * If today is Friday → next Monday. Weekends → Monday.
 */
function nextBusinessDay(): string {
  const now = new Date();
  const candidate = new Date(now);
  candidate.setDate(candidate.getDate() + 1);

  // Skip weekends: 0 = Sunday, 6 = Saturday
  while (candidate.getDay() === 0 || candidate.getDay() === 6) {
    candidate.setDate(candidate.getDate() + 1);
  }

  const y = candidate.getFullYear();
  const m = String(candidate.getMonth() + 1).padStart(2, "0");
  const day = String(candidate.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Queries GET /api/v1/pickups/coverage to obtain the first valid pickup
 * date + time window for the carrier linked to this shipment.
 *
 * Returns null if the carrier does not support pickup-via-API for this
 * account (response: `success: false` / "No matching carrier found").
 */
async function getPickupCoverage(
  headers: Record<string, string>,
  shipmentId: string,
): Promise<{ date: string; startHour: string; endHour: string } | null> {
  try {
    const res = await fetch(
      `${BASE}/api/v1/pickups/coverage?shipment_id=${shipmentId}`,
      { headers },
    );
    const body = await res.json() as {
      success?: boolean;
      pickupDates?: Array<{ date: string; startHour: string; endHour: string }>;
      message?: string;
    };

    if (!res.ok || body.success === false) {
      console.warn(
        `[Skydropx] Pickup coverage not available (${res.status}):`,
        body.message ?? JSON.stringify(body),
      );
      return null;
    }

    const first = body.pickupDates?.[0];
    if (!first?.date || !first?.startHour || !first?.endHour) {
      console.warn("[Skydropx] Pickup coverage returned empty dates:", JSON.stringify(body));
      return null;
    }

    console.log(
      `[Skydropx] Pickup coverage → ${first.date} ${first.startHour}-${first.endHour}`,
    );
    return first;
  } catch (e) {
    console.warn("[Skydropx] Pickup coverage request failed:", e);
    return null;
  }
}

/**
 * Schedules a pickup via POST /api/v1/pickups/.
 *
 * Flow:
 *   1. GET /api/v1/pickups/coverage?shipment_id=... → obtain a carrier-
 *      valid date + time window. If the carrier does not support pickup
 *      via API, throw early (non-fatal to caller).
 *   2. POST /api/v1/pickups/ with the window from coverage (falls back to
 *      env-configured default window if coverage returns only a date).
 *
 * Non-fatal: caller should catch errors.
 */
async function schedulePickup(
  headers: Record<string, string>,
  shipmentId: string,
): Promise<{ pickupNumber: string | null; pickupDate: string | null }> {
  // ── Step 1. Ask the carrier which date/window it accepts ──────────────
  const coverage = await getPickupCoverage(headers, shipmentId);

  let scheduledDate: string;
  let timeFrom:      string;
  let timeTo:        string;

  if (coverage) {
    scheduledDate = coverage.date;
    // coverage may return "HH:MM" or "HH:MM:SS" — normalize to HH:MM
    timeFrom      = coverage.startHour.slice(0, 5);
    timeTo        = coverage.endHour.slice(0, 5);
  } else {
    // Fallback: carrier didn't return coverage — use env defaults.
    // This also catches any new carrier not yet in NO_PICKUP_CARRIERS.
    scheduledDate = nextBusinessDay();
    timeFrom      = process.env.SKYDROPX_PICKUP_TIME_FROM ?? "09:00";
    timeTo        = process.env.SKYDROPX_PICKUP_TIME_TO   ?? "18:00";
    console.warn(
      "[Skydropx] No coverage data — using fallback window",
      `${scheduledDate} ${timeFrom}-${timeTo}`,
    );
  }

  // ── Step 2. POST the pickup with the carrier-valid window ────────────
  const pickupBody = {
    reference_shipment_id: shipmentId,
    packages:              1,
    total_weight:          "1.0",
    scheduled_from:        `${scheduledDate} ${timeFrom}:00`,
    scheduled_to:          `${scheduledDate} ${timeTo}:00`,
  };

  console.log("[Skydropx] Scheduling pickup:", JSON.stringify(pickupBody, null, 2));

  const res = await fetch(`${BASE}/api/v1/pickups/`, {
    method:  "POST",
    headers,
    body:    JSON.stringify(pickupBody),
  });

  const raw = await res.json() as Record<string, unknown>;

  if (!res.ok) {
    console.error("[Skydropx] Pickup API error:", res.status, JSON.stringify(raw));
    throw new Error(`Skydropx pickup error (${res.status}): ${JSON.stringify(raw).slice(0, 300)}`);
  }

  console.log("[Skydropx] Pickup scheduled successfully — full response:", JSON.stringify(raw));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = raw as any;

  // Some carriers accept the POST but return status: "failed" with error_reason.
  // Treat that as an error so the caller surfaces it instead of silently saving
  // a "scheduled" pickup that was actually rejected by the carrier.
  const status: string | undefined       = p?.data?.attributes?.status;
  const errorReason: string | undefined  = p?.data?.attributes?.error_reason;
  if (status && status !== "scheduled" && status !== "collected") {
    throw new Error(
      `Skydropx pickup not scheduled (status=${status}): ${errorReason ?? "unknown"}`,
    );
  }

  const pickupNumber: string | null =
    p?.data?.attributes?.request_number   // ← Pro API returns this (e.g. "MUGA3093")
    ?? p?.data?.attributes?.confirmation_number
    ?? p?.data?.id
    ?? null;

  return { pickupNumber, pickupDate: scheduledDate };
}
