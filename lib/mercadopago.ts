// ─────────────────────────────────────────────────
//  Zoa — MercadoPago SDK Initialization (Lazy)
// ─────────────────────────────────────────────────

import { MercadoPagoConfig } from "mercadopago";

let _client: MercadoPagoConfig | null = null;

/**
 * Returns a MercadoPago config instance. Lazy-initialized to avoid
 * crashing during Vercel build when env vars aren't available yet.
 */
export function getMpClient(): MercadoPagoConfig {
  if (!_client) {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN is not set");
    }
    _client = new MercadoPagoConfig({
      accessToken,
      options: { timeout: 5000 },
    });
  }
  return _client;
}

// Keep backward-compatible export (lazy getter)
export const mpClient = new Proxy({} as MercadoPagoConfig, {
  get(_target, prop) {
    return (getMpClient() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
