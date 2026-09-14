import { NextResponse } from "next/server";

/**
 * POST /api/shipping-rates
 * Fetches shipping rate options from Skydropx for a given order.
 *
 * Body: { zip: string; weight?: number; length?: number; width?: number; height?: number }
 * Skydropx doc: https://skydropx.com/docs
 */

const SKYDROPX_BASE = "https://api.skydropx.com/v1";
const API_KEY    = process.env.SKYDROPX_API_KEY    ?? "";

// Origin: Zoa warehouse — Santa Fe, CDMX
const ORIGIN = {
  zip_code:     "05300",  // Álvaro Obregón / Santa Fe
  country_code: "MX",
};

export async function POST(req: Request) {
  if (!API_KEY) {
    return NextResponse.json({ error: "Skydropx not configured" }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const {
    zip = "",
    weight = 0.5,
    length = 30,
    width  = 25,
    height = 5,
  } = body as {
    zip?: string;
    weight?: number;
    length?: number;
    width?: number;
    height?: number;
  };

  if (!zip) {
    return NextResponse.json({ error: "zip is required" }, { status: 400 });
  }

  try {
    const res = await fetch(`${SKYDROPX_BASE}/quotations`, {
      method: "POST",
      headers: {
        "Authorization": `Token token=${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        zipcode_from: ORIGIN.zip_code,
        zipcode_to:   zip,
        parcel: {
          weight,        // kg
          length,        // cm
          width,         // cm
          height,        // cm
          distance_unit: "CM",
          mass_unit:     "KG",
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[Skydropx] error:", errText);
      return NextResponse.json({ error: "Error al cotizar envío", detail: errText }, { status: 502 });
    }

    const data = await res.json();
    // data.data is an array of carrier rate objects
    const rates = (data.data ?? []).map((r: Record<string, unknown>) => ({
      carrier:     r.carrier,
      service:     r.service_level_name,
      total:       r.total_price,
      currency:    "MXN",
      days:        r.days,
      logo:        r.carrier_logo_url ?? null,
    }));

    return NextResponse.json({ rates });
  } catch (err) {
    console.error("[Skydropx] fetch error:", err);
    return NextResponse.json({ error: "Error de red al cotizar envío" }, { status: 500 });
  }
}
