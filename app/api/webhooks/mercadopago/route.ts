// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/webhooks/mercadopago
//  Listens for MercadoPago payment events (IPN / Webhook).
//
//  Flow:
//  1. Receive webhook notification from MP
//  2. Verify it's a payment.approved event
//  3. Fetch payment details from MP API
//  4. Deduct stock in Google Sheets
//  5. Create Skydropx shipment → get tracking number
//  6. Send Email notification to buyer + admin
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { Payment } from "mercadopago";
import { mpClient } from "@/lib/mercadopago";
import { deductStock } from "@/lib/googleSheets";
import { createSkydropxShipment } from "@/lib/skydropx";
import type { CartItem, Product, Size, WebhookPayload } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body: WebhookPayload = await req.json();

    console.log("[webhook/mp] Received:", body.type, body.action, body.data?.id);

    // Only handle payment events
    if (body.type !== "payment") {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      return NextResponse.json({ error: "Missing payment ID" }, { status: 400 });
    }

    // ── Fetch Payment Details from MP API ──────────────────────────────────
    const paymentClient = new Payment(mpClient);
    const payment = await paymentClient.get({ id: paymentId });

    console.log("[webhook/mp] Payment status:", payment.status, "amount:", payment.transaction_amount);

    if (payment.status !== "approved") {
      return NextResponse.json({ received: true, status: payment.status }, { status: 200 });
    }

    // ── Extract cart metadata ──────────────────────────────────────────────
    const metadata = payment.metadata as {
      items?:    { productId: string; size: string; quantity: number }[];
      address?:  {
        fullName: string; street: string;
        numExterior?: string; numInterior?: string;
        colonia: string; city: string; state: string;
        zip: string; phone: string; email: string;
      };
      isVip?:    boolean;
      vipCode?:  string;
      total?:    number;
    } | null;

    if (!metadata?.items?.length) {
      console.warn("[webhook/mp] No cart items in metadata — skipping");
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // ── Deduct Stock from Google Sheets ────────────────────────────────────
    const cartItems: CartItem[] = metadata.items.map((item) => ({
      product:  { id: item.productId } as Product,
      size:     item.size as Size,
      quantity: item.quantity,
    }));

    await deductStock(cartItems);
    console.log("[webhook/mp] Stock deducted for", cartItems.length, "items");

    // ── Create Skydropx Shipment ───────────────────────────────────────────
    let trackingNumber: string | null = null;
    let labelUrl:       string | null = null;
    let carrier:        string | null = null;

    if (metadata.address && process.env.SKYDROPX_API_KEY) {
      try {
        const shipment = await createSkydropxShipment(
          {
            ...metadata.address,
            numExterior: metadata.address.numExterior ?? "",
            numInterior: metadata.address.numInterior ?? "",
          },
          `ZOA-${paymentId}`,
        );
        trackingNumber = shipment.trackingNumber;
        labelUrl       = shipment.labelUrl;
        carrier        = shipment.carrier;
        console.log("[webhook/mp] Skydropx shipment created:", trackingNumber, carrier);
      } catch (skydropxErr) {
        // Log but don't fail — stock already deducted
        console.error("[webhook/mp] Skydropx error (non-fatal):", skydropxErr);
      }
    } else if (!process.env.SKYDROPX_API_KEY) {
      console.warn("[webhook/mp] SKYDROPX_API_KEY not set — skipping shipment");
    }

    // ── Trigger email notifications ────────────────────────────────────────
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://zoa.mx";
      await fetch(`${baseUrl}/api/webhooks/payment-success`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId,
          status:        payment.status,
          items:         cartItems,
          address:       metadata.address ?? {},
          total:         metadata.total   ?? payment.transaction_amount,
          vipCode:       metadata.vipCode ?? "",
          trackingNumber,
          labelUrl,
          carrier,
        }),
      });
    } catch (emailErr) {
      console.error("[webhook/mp] Email error:", emailErr);
    }

    return NextResponse.json({
      received: true, stockDeducted: true, trackingNumber, carrier,
    }, { status: 200 });

  } catch (err) {
    console.error("[webhook/mp] Unhandled error:", err);
    return NextResponse.json({ received: true, error: "Internal error" }, { status: 200 });
  }
}
