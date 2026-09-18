// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/reviews  — publish review directly + notify admin by email
//  GET  /api/reviews?productId=  — fetch approved reviews for a product
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";

const SHEET_ID = process.env.GOOGLE_SHEET_ID ?? "";
const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL ?? "";

// ── GET: fetch real reviews for a product ─────────────────────────────────────
export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get("productId") ?? "";

  try {
    if (!SHEET_ID) {
      console.warn("[reviews] GOOGLE_SHEET_ID no está configurada — no se pueden leer reseñas.");
      return NextResponse.json({ reviews: [] });
    }

    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Rese%C3%B1as`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return NextResponse.json({ reviews: [] });

    const text = await res.text();
    const json = JSON.parse(text.replace(/^[^(]+\(/, "").replace(/\);?$/, ""));
    const rows: string[][] = (json.table?.rows ?? []).map(
      (row: { c: Array<{ v: unknown } | null> }) =>
        (row.c ?? []).map((cell) => (cell ? String(cell.v ?? "") : ""))
    );

    // Columns: A=orderId, B=productId, C=name, D=rating, E=text, F=date, G=approved
    const reviews = rows
      .filter((r) => r[1] === productId && r[6]?.toLowerCase() !== "false")
      .map((r) => ({
        name:   r[2] || "Clienta verificada",
        rating: parseFloat(r[3]) || 5,
        text:   r[4] || "",
        date:   r[5] || "",
        orderId: r[0] || "",
      }));

    return NextResponse.json({ reviews });
  } catch {
    return NextResponse.json({ reviews: [] });
  }
}

// ── POST: save review directly + email admin ──────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      orderId?:  string;
      productId: string;
      productName?: string;
      name:      string;
      rating:    number;
      text:      string;
    };

    const { orderId, productId, productName, name, rating, text } = body;

    if (!productId || !name || !rating || !text) {
      return NextResponse.json({ error: "Todos los campos son requeridos." }, { status: 400 });
    }
    if (text.trim().length < 10) {
      return NextResponse.json({ error: "Tu reseña debe tener al menos 10 caracteres." }, { status: 400 });
    }

    const date = new Date().toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });

    // ── 1. Save to Reseñas sheet via Apps Script ───────────────────────────────
    if (APPS_SCRIPT_URL) {
      try {
        await fetch(APPS_SCRIPT_URL, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "saveReview",
            review: { orderId: orderId ?? "", productId, name: name.trim(), rating, text: text.trim(), date, approved: "true" },
          }),
        });
      } catch (e) {
        console.error("[reviews] Save to sheet failed:", e);
      }
    }

    // ── 2. Email admin notification ────────────────────────────────────────────
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY!);
      // Mismo remitente configurable que payment-success (permite usar un dominio verificado en Resend).
      const from = process.env.RESEND_FROM_EMAIL ?? "Zoa <hola@zoa.mx>";
      await resend.emails.send({
        from,
        to:   ["carmen@zoa.mx", "zoa6521@gmail.com"],
        subject: `⭐ Nueva reseña en ${productName ?? productId}`,
        html: `
          <div style="font-family:sans-serif;max-width:500px;margin:auto;border:1px solid #eee;padding:24px;">
            <h2 style="font-size:18px;margin:0 0 16px;">Nueva reseña publicada</h2>
            <p><strong>Producto:</strong> ${productName ?? productId}</p>
            <p><strong>Clienta:</strong> ${name.trim()}</p>
            <p><strong>Calificación:</strong> ${"★".repeat(Math.round(rating))} (${rating}/5)</p>
            ${orderId ? `<p><strong>Número de orden (ingresado):</strong> ${orderId}</p>` : ""}
            <blockquote style="border-left:3px solid #c8a97e;margin:12px 0;padding:8px 16px;color:#444;">
              ${text.trim()}
            </blockquote>
            <p style="font-size:12px;color:#999;margin-top:16px;">
              Si deseas eliminar esta reseña, pídelo al equipo de desarrollo.
            </p>
          </div>
        `,
      });
    } catch (e) {
      console.error("[reviews] Email notification failed:", e);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al guardar la reseña.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
