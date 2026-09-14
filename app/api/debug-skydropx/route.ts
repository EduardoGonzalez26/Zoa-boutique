// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/debug-skydropx?secret=zoa_debug
//  Read-only diagnostic: lists the most recent Skydropx shipments and pickups.
//
//  Add &test_pickup=1 to also attempt POST /api/v1/pickups with the most
//  recent shipment ID — returns the full raw response so we can see errors.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";

const BASE = "https://api-pro.skydropx.com";

export const maxDuration = 60;

// Next business day in YYYY-MM-DD
function nextBusinessDay(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== "zoa_debug") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const log: Record<string, unknown> = {};

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
    });
    const tokenData = await tokenRes.json();
    log.step1_token = { status: tokenRes.status, ok: tokenRes.ok };
    if (!tokenRes.ok) return NextResponse.json({ error: "Token failed", log, tokenData });

    const token = (tokenData as { access_token: string }).access_token;
    const headers = {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${token}`,
    };

    // ── 2. Most recent shipments ────────────────────────────────────────────
    const shipListRes  = await fetch(`${BASE}/api/v1/shipments?per_page=15`, { headers });
    const shipListData = await shipListRes.json();
    log.step2_shipments_list = { status: shipListRes.status, raw: shipListData };

    // ── 3. Most recent pickups ──────────────────────────────────────────────
    const pickupListRes  = await fetch(`${BASE}/api/v1/pickups?per_page=3`, { headers });
    const pickupListData = await pickupListRes.json();
    log.step3_pickups_list = { status: pickupListRes.status, raw: pickupListData };

    // ── 4. Test pickup creation (always runs) ──────────────────────────────
    // Uses correct Pro API format: reference_shipment_id, packages,
    // total_weight, scheduled_from, scheduled_to
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const shipments: any[] = (shipListData as any)?.data ?? [];

      // Always use the MOST RECENT shipment (last in array) to test pickup
      // with the actual carrier from the latest purchase
      const candidate = shipments[shipments.length - 1] ?? null;

      const latestId: string | null = candidate?.id ?? null;
      const latestCarrier: string = candidate?.attributes?.carrier_name ?? "unknown";
      const latestStatus: string = candidate?.attributes?.workflow_status ?? "unknown";

      if (!latestId) {
        log.step4_test_pickup = { error: "No shipment found to test with" };
      } else {
        const scheduledDate = nextBusinessDay();
        const timeFrom = process.env.SKYDROPX_PICKUP_TIME_FROM ?? "08:00";
        const timeTo   = process.env.SKYDROPX_PICKUP_TIME_TO   ?? "18:00";

        // Pro API format (per official docs)
        const pickupBody = {
          reference_shipment_id: latestId,
          packages:              1,
          total_weight:          "1.0",
          scheduled_from:        `${scheduledDate} ${timeFrom}:00`,
          scheduled_to:          `${scheduledDate} ${timeTo}:00`,
        };

        const pickupRes = await fetch(`${BASE}/api/v1/pickups`, {
          method:  "POST",
          headers,
          body:    JSON.stringify(pickupBody),
        });
        const pickupRaw = await pickupRes.json();

        log.step4_test_pickup = {
          shipment_id_used:  latestId,
          carrier_used:      latestCarrier,
          shipment_status:   latestStatus,
          scheduled_date:    scheduledDate,
          request_body:      pickupBody,
          response_status:   pickupRes.status,
          response_ok:       pickupRes.ok,
          response_raw:      pickupRaw,
        };
      }
    }

    // ── 5. Probe pickup capability for ONE shipment per carrier ────────────
    //   For each distinct carrier_name in recent shipments, pick the most
    //   recent shipment of that carrier and:
    //     (a) GET /api/v1/pickups/coverage?shipment_id=... → does carrier
    //         support pickup scheduling?
    //     (b) POST /api/v1/pickups → does the account have pickup-by-API
    //         enabled for this carrier?
    //   This tells us unambiguously whether the problem is:
    //     - carrier-specific (some work, some don't), or
    //     - account-wide (all return "via soporte" → need to call Skydropx)
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const shipments: any[] = (shipListData as any)?.data ?? [];
      const byCarrier = new Map<string, any>();
      for (const s of shipments) {
        const c = (s?.attributes?.carrier_name ?? "unknown").toLowerCase();
        // keep the most recent one per carrier (list is chronological asc)
        byCarrier.set(c, s);
      }

      const scheduledDate = nextBusinessDay();
      const timeFrom = process.env.SKYDROPX_PICKUP_TIME_FROM ?? "08:00";
      const timeTo   = process.env.SKYDROPX_PICKUP_TIME_TO   ?? "18:00";

      const perCarrier: Record<string, unknown> = {};

      for (const [carrier, ship] of byCarrier.entries()) {
        const shipId: string = ship?.id;
        if (!shipId) continue;

        // (a) Coverage probe
        let coverage: unknown;
        try {
          const covRes = await fetch(
            `${BASE}/api/v1/pickups/coverage?shipment_id=${shipId}`,
            { headers },
          );
          coverage = {
            status: covRes.status,
            ok:     covRes.ok,
            body:   await covRes.json(),
          };
        } catch (e) {
          coverage = { error: String(e) };
        }

        // (b) POST /pickups probe (attempt real scheduling)
        let postProbe: unknown;
        try {
          const body = {
            reference_shipment_id: shipId,
            packages:              1,
            total_weight:          "1.0",
            scheduled_from:        `${scheduledDate} ${timeFrom}:00`,
            scheduled_to:          `${scheduledDate} ${timeTo}:00`,
          };
          const postRes = await fetch(`${BASE}/api/v1/pickups`, {
            method:  "POST",
            headers,
            body:    JSON.stringify(body),
          });
          postProbe = {
            status: postRes.status,
            ok:     postRes.ok,
            body:   await postRes.json(),
          };
        } catch (e) {
          postProbe = { error: String(e) };
        }

        perCarrier[carrier] = {
          shipment_id:     shipId,
          shipment_source: ship?.attributes?.source,
          shipment_status: ship?.attributes?.workflow_status,
          coverage,
          post_pickup:     postProbe,
        };
      }

      log.step5_per_carrier_probe = perCarrier;
    }

    return NextResponse.json({ ok: true, log }, { status: 200 });

  } catch (err) {
    return NextResponse.json({ error: String(err), log }, { status: 500 });
  }
}
