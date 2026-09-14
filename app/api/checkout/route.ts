// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/checkout
//  Creates a MercadoPago Checkout Pro preference.
//
//  Body: { items: CartItem[], vipCode?: string, buyerEmail?: string }
//  Response: { preferenceId, initPoint, sandboxInitPoint }
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { Preference } from "mercadopago";
import { mpClient } from "@/lib/mercadopago";
import type { CheckoutBody } from "@/lib/types";

const VIP_CODE = "PROBADOR";
const VIP_DEPOSIT = 300; // MXN
const SHIPPING_FLAT = 150; // MXN
const FREE_SHIPPING_THRESHOLD = 3000; // MXN

export async function POST(req: NextRequest) {
  try {
    const body: CheckoutBody = await req.json();
    const { items, vipCode, buyerEmail } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 });
    }

    const isVip = vipCode?.trim().toUpperCase() === VIP_CODE;

    // ── Build MP Preference Items ──────────────────────────────────────────────
    const preferenceItems = isVip
      ? [
          {
            id: "VIP-DEPOSIT",
            title: "Depósito Probador a Domicilio — Zoa",
            quantity: 1,
            unit_price: VIP_DEPOSIT,
            currency_id: "MXN",
          },
        ]
      : items.map((item) => ({
          id: item.product.id,
          title: `${item.product.name} — Talla ${item.size}`,
          quantity: item.quantity,
          unit_price: item.product.price,
          currency_id: "MXN",
          picture_url: item.product.images[0] ?? undefined,
        }));

    // ── Calculate shipping (only for non-VIP) ─────────────────────────────────
    const subtotal = items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    const shippingAmount = isVip
      ? 0
      : subtotal >= FREE_SHIPPING_THRESHOLD
      ? 0
      : SHIPPING_FLAT;

    // ── Serialize cart for metadata (for use in webhook) ──────────────────────
    const cartMetadata = {
      vipCode: vipCode ?? null,
      isVip,
      items: items.map((i) => ({
        productId: i.product.id,
        size: i.size,
        quantity: i.quantity,
      })),
    };

    // ── Create Preference ──────────────────────────────────────────────────────
    const preference = new Preference(mpClient);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? req.headers.get("origin") ?? "";

    const created = await preference.create({
      body: {
        items: preferenceItems,
        shipments: shippingAmount > 0
          ? { cost: shippingAmount, mode: "not_specified" }
          : undefined,
        payer: buyerEmail ? { email: buyerEmail } : undefined,
        back_urls: {
          success: `${baseUrl}/checkout/success`,
          failure: `${baseUrl}/checkout/failure`,
          pending: `${baseUrl}/checkout/pending`,
        },
        auto_return: "approved",
        notification_url: `${baseUrl}/api/webhooks/mercadopago`,
        // Store our cart data so the webhook can deduct stock
        metadata: cartMetadata,
        payment_methods: {
          excluded_payment_types: [],
          installments: 12,
        },
        statement_descriptor: "ZOA BOUTIQUE",
      },
    });

    return NextResponse.json(
      {
        preferenceId: created.id,
        initPoint: created.init_point,
        sandboxInitPoint: created.sandbox_init_point,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[/api/checkout] Error:", err);
    return NextResponse.json(
      { error: "No se pudo crear la preferencia de pago." },
      { status: 500 }
    );
  }
}
