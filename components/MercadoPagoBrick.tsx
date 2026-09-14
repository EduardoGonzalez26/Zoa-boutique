"use client";

/**
 * MercadoPagoBrick — Client-only Payment Brick component for Zoa.
 *
 * Uses Checkout Bricks (NOT Checkout Pro). No preferenceId is required
 * before rendering. The Brick itself collects card/payment data and
 * calls our /api/process-payment endpoint via onSubmit.
 *
 * MUST be imported with next/dynamic({ ssr: false }) to prevent the SSR error:
 *   "Expected the PUBLIC_KEY to render the MercadoPago SDK React"
 */

import { useEffect, useState } from "react";
import type { CartItem } from "@/lib/types";

interface MercadoPagoBrickProps {
  items: CartItem[];
  amount: number;
  onSuccess?: (paymentId: string) => void;
  onError?: (err: Error) => void;
}

// ── Type stubs for the MP SDK ─────────────────────────────────────────────────
type MPModule = {
  initMercadoPago: (key: string, opts?: { locale: string }) => void;
  Payment: React.ComponentType<{
    initialization: { amount: number };
    customization?: Record<string, unknown>;
    onSubmit: (data: { formData: Record<string, unknown> }) => Promise<void>;
    onError?: (err: unknown) => void;
    onReady?: () => void;
  }>;
};

export default function MercadoPagoBrick({ items, amount, onSuccess, onError }: MercadoPagoBrickProps) {
  const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY as string;
  const [mpModule, setMpModule] = useState<MPModule | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    import("@mercadopago/sdk-react")
      .then((mod) => {
        // initMercadoPago must be called once, before any brick renders
        mod.initMercadoPago(publicKey, { locale: "es-MX" });
        setMpModule(mod as unknown as MPModule);
      })
      .catch((err: Error) => {
        console.error("[MercadoPagoBrick] SDK load failed:", err);
        onError?.(err);
      });
  // Only run on mount — intentionally omit publicKey/onError from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── SDK loading ───────────────────────────────────────────────────────────
  if (!mpModule) {
    return (
      <div className="flex items-center justify-center py-10 gap-3">
        <div className="w-5 h-5 border-2 border-[var(--color-charcoal)] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-sans text-[var(--color-stone-400)]">Cargando pasarela de pago…</span>
      </div>
    );
  }

  const { Payment } = mpModule;

  return (
    <div className="space-y-3">
      {paymentError && (
        <p className="text-xs text-red-500 font-sans text-center">{paymentError}</p>
      )}

      {/* 
        Checkout Brick — No preferenceId needed.
        The Brick itself collects all payment data.
        onSubmit sends formData to our server for processing.
      */}
      <Payment
        initialization={{ amount }}
        customization={{
          paymentMethods: {
            creditCard: "all",
            debitCard: "all",
            ticket: "all",          // OXXO, Rapipago, etc.
            bankTransfer: "all",
          },
          visual: {
            style: {
              customVariables: {
                theme: "default",
                textPrimaryColor: "var(--color-charcoal)",
              },
            },
          },
        }}
        onSubmit={async ({ formData }) => {
          setPaymentError(null);
          try {
            const res = await fetch("/api/process-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                formData,
                items: items.map((i) => ({
                  id: i.product.id,
                  name: i.product.name,
                  price: i.product.price,
                  size: i.size,
                  quantity: i.quantity,
                })),
              }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Error al procesar el pago");
            onSuccess?.(data.paymentId ?? data.id);
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Error inesperado";
            setPaymentError(msg);
            onError?.(err as Error);
          }
        }}
        onError={(err) => {
          console.error("[MercadoPago Brick error]", err);
          setPaymentError("Error en la pasarela de pago. Intenta de nuevo.");
          onError?.(err instanceof Error ? err : new Error("MP Brick error"));
        }}
      />
    </div>
  );
}
