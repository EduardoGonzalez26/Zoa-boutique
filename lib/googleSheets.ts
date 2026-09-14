// ─────────────────────────────────────────────────────────────────────────────
//  Zoa — Google Sheets Reader (Public Sheet — no auth needed)
//
//  Reads from the public Google Sheets JSON export endpoint.
//  The sheet must be shared as "Anyone with the link can view".
//
//  For WRITING (stock deduction after payment), we use a Google Apps Script
//  web app deployed from the same sheet (see APPS_SCRIPT_URL env var).
//
//  Pestaña: "Oficial" — Columns A–T:
//  A:NUM  B:SKU  C:NOMBRE  D:DESCRIPCIÓN  E:MARCA
//  F:XS  G:S  H:M  I:L  J:LOV  K:XL  L:COLOR
//  M:PRECIO  N:DESCUENTO%  O:CATEGORÍA  P:COLECCIÓN
//  Q:DE FRENTE  R:CLOSE UP  S:DE LADO  T:DE ESPALDAS
// ─────────────────────────────────────────────────────────────────────────────

import type { CartItem, Product } from "./types";

const SHEET_NAME = process.env.GOOGLE_SHEET_NAME ?? "Oficial";

function getSpreadsheetId(): string {
  const id = process.env.GOOGLE_SHEET_ID;
  if (!id) {
    throw new Error(
      "GOOGLE_SHEET_ID no está configurada. Agrega la variable en Vercel → Settings → Environment Variables."
    );
  }
  return id;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function toInt(val: unknown): number {
  if (val === null || val === undefined || val === "") return 0;
  return parseInt(String(val), 10) || 0;
}

function toFloat(val: unknown): number {
  if (val === null || val === undefined || val === "") return 0;
  return parseFloat(String(val).replace(/,/g, "").replace(/\$/g, "")) || 0;
}

/**
 * Minimal RFC 4180 CSV parser.
 * Handles quoted fields (which may contain commas) and escaped quotes ("").
 * Returns an array of rows, each row is an array of string cell values.
 */
function parseCSV(text: string): string[][] {
  const result: string[][] = [];
  const src = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < src.length) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"' && src[i + 1] === '"') { field += '"'; i += 2; }
      else if (ch === '"') { inQuotes = false; i++; }
      else { field += ch; i++; }
    } else {
      if (ch === '"') { inQuotes = true; i++; }
      else if (ch === ',') { row.push(field); field = ""; i++; }
      else if (ch === "\n") { row.push(field); result.push(row); row = []; field = ""; i++; }
      else { field += ch; i++; }
    }
  }
  if (field || row.length > 0) { row.push(field); result.push(row); }

  return result;
}

/**
 * Fetches all rows from the "Oficial" sheet via CSV export.
 * CSV has NO column-type inference — every value is returned as a plain string.
 * This is more robust than the gviz/tq endpoint, which silently converts
 * mixed-type values (e.g. "106A" in a mostly-numeric column) to null.
 */
async function fetchSheetRows(): Promise<string[][]> {
  // CSV export — no auth required if sheet is public
  const url = `https://docs.google.com/spreadsheets/d/${getSpreadsheetId()}/export?format=csv&sheet=${encodeURIComponent(SHEET_NAME)}`;

  const res = await fetch(url, {
    next: { revalidate: 60 }, // ISR: refetch every 60 s
  });

  if (!res.ok) {
    throw new Error(`Google Sheets CSV fetch failed: ${res.status} ${res.statusText}`);
  }

  const text = await res.text();
  const rows = parseCSV(text);

  // First row is the header — skip it
  return rows.slice(1);
}


function rowToProduct(row: string[]): Product {
  // Column mapping (0-indexed):
  // 0=NUM, 1=SKU, 2=NOMBRE, 3=DESC, 4=MARCA
  // 5=XS, 6=S, 7=M, 8=L, 9=LOV, 10=XL
  // 11=COLOR, 12=PRECIO, 13=DESCUENTO%
  // 14=CATEGORÍA, 15=COLECCIÓN
  // 16=FRENTE, 17=CLOSEUP, 18=LADO, 19=ESPALDAS

  const num = String(row[0] ?? "").trim();
  const rawSku = String(row[1] ?? "").trim();
  // NUM is always the unique ID — SKUs are duplicated across the Sheet
  // SKU is stored for display only (shown on product page)
  const sku = rawSku.startsWith("#") ? "" : rawSku;
  const id  = num; // Always use NUM — it is the only guaranteed-unique field

  const basePrice   = toFloat(row[12]);
  // Google Sheets gviz API returns percentage-formatted cells as decimals (e.g. 10% → 0.1)
  // Normalize: if the value is between 0 and 1 (exclusive), multiply by 100 to get the real %
  const rawDiscount  = toFloat(row[13]);
  const discountPct  = rawDiscount > 0 && rawDiscount < 1 ? rawDiscount * 100 : rawDiscount;
  const finalPrice   = discountPct > 0
    ? Math.round(basePrice * (1 - discountPct / 100))
    : basePrice;

  const rawCategory  = String(row[14] ?? "").trim();
  const rawCollection = String(row[15] ?? "").trim();
  // Products with a discount belong to Outlet (in addition to their own collection)
  // If the sheet already says Outlet, keep it; otherwise append
  const collection   = rawCollection;

  return {
    id,
    sku:           sku || undefined,   // display only — not used for routing
    name:          String(row[2] ?? "").trim(),
    description:   String(row[3] ?? "").trim() || undefined,
    brand:         String(row[4] ?? "").trim() || undefined,
    stock: {
      XS:  toInt(row[5]),
      S:   toInt(row[6]),
      M:   toInt(row[7]),
      L:   toInt(row[8]),
      LOV: toInt(row[9]),
      XL:  toInt(row[10]),
    },
    color:         String(row[11] ?? "").trim() || undefined,
    price:         finalPrice > 0 ? finalPrice : basePrice,
    originalPrice: discountPct > 0 ? basePrice : undefined,
    discount:      discountPct > 0 ? discountPct : undefined,
    category:      rawCategory,
    collection,
    images:        [row[16], row[17], row[18], row[19]]
                     .map((u) => (u ?? "").trim())
                     .filter((u) => u.startsWith("http")),
  };
}

// ── Read ─────────────────────────────────────────────────────────────────────

/**
 * Fetches all products from the "Oficial" sheet (public endpoint — no auth).
 * Products with zero stock in ALL sizes are included (shown as "Agotado").
 * Products without a name or category are excluded.
 */
export async function getProducts(): Promise<Product[]> {
  const rows = await fetchSheetRows();

  return rows
    .filter((row) => {
      if (!row[0] || !row[2]) return false; // need NUM + NOMBRE
      // If ALL 6 size cells are empty → no inventory defined → hide from site
      const sizeCells = [row[5], row[6], row[7], row[8], row[9], row[10]];
      const allEmpty = sizeCells.every((c) => c === "");
      return !allEmpty;
    })
    .map(rowToProduct)
    // Only exclude rows with a broken/missing ID or name.
    // Category is NOT required — some rows legitimately omit it.
    .filter((p) => p.name && p.id && !p.id.startsWith("#"));
}

// Mapa de nombre de color → hex para los swatches
const COLOR_HEX: Record<string, string> = {
  Negro: "#1C1917", Blanco: "#F5F0EB", Azul: "#2C4A8C", "Azul Fuerte": "#1A3270",
  Beige: "#D4B896", Gris: "#9A9490", Vino: "#7B2D3E", Rosa: "#E8A0B0",
  "Rosa palo": "#E8C4B8", Camel: "#C49A6C", Crema: "#EDE8E2", Verde: "#3A6B4A",
  "Verde olivo": "#6B6B3A", Terracota: "#C1704A", Nude: "#D4A990",
  Rojo: "#C0392B", Mostaza: "#D4A017", Hueso: "#F0EAD6", Arena: "#E8D5B0",
  Café: "#6F4E37", Morado: "#5B2C6F", Naranja: "#E67E22", Amarillo: "#F1C40F",
  Marfil: "#F0EAD6", Coral: "#E8856E", "Azul cielo": "#87CEEB",
};

/**
 * Groups products by name. Products with the same name but different colors
 * are merged: the first one becomes the "main" product and the rest are stored
 * as `variants` with their id, color, hex and primary image.
 */
export async function getGroupedProducts(): Promise<Product[]> {
  const all = await getProducts();
  const groups = new Map<string, Product[]>();

  for (const p of all) {
    const key = p.name.trim().toLowerCase();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }

  const result: Product[] = [];

  for (const siblings of groups.values()) {
    const main = { ...siblings[0] };

    if (siblings.length > 1) {
      // Build variant list from ALL siblings (including the main one)
      main.variants = siblings.map((s) => ({
        id: s.id,
        color: s.color ?? "Único",
        hex: COLOR_HEX[s.color ?? ""] ?? "#D9D1C7",
        image: s.images[0] ?? "",
      }));
    }

    // Collect ALL sibling SKUs so any variant can be found by SKU search
    main.skus = siblings.map((s) => s.sku ?? "").filter(Boolean);

    result.push(main);
  }

  return result;
}

/**
 * Fetches a single product by NUM id, enriched with ALL color siblings as variants.
 * Use this on the product detail page so clicking a color swatch navigates to that variant.
 */
export async function getGroupedProductById(id: string): Promise<Product | null> {
  const all = await getProducts();
  const target = all.find((p) => p.id === id);
  if (!target) return null;

  // Find all siblings that share the same name (= same group)
  const nameKey = target.name.trim().toLowerCase();
  const siblings = all.filter((p) => p.name.trim().toLowerCase() === nameKey);

  if (siblings.length <= 1) return target; // solo un color — sin variantes

  return {
    ...target,
    variants: siblings.map((s) => ({
      id: s.id,
      color: s.color ?? "Único",
      hex: COLOR_HEX[s.color ?? ""] ?? "#D9D1C7",
      image: s.images[0] ?? "",
    })),
    skus: siblings.map((s) => s.sku ?? "").filter(Boolean),
  };
}

/**
 * Fetches a single product by ID (legacy — no variants).
 */
export async function getProductById(id: string): Promise<Product | null> {
  const all = await getProducts();
  return all.find((p) => p.id === id) ?? null;
}


// ── Write (Stock Deduction) ──────────────────────────────────────────────────

/**
 * Deducts stock via a Google Apps Script web app.
 * The Apps Script must be deployed from the same spreadsheet.
 *
 * If APPS_SCRIPT_URL is not set, this is a no-op (for development).
 *
 * Expected payload to the Apps Script:
 *   POST { items: [{ id: "SKU", size: "M", quantity: 1 }] }
 */
export async function deductStock(items: CartItem[]): Promise<void> {
  const appsScriptUrl = process.env.APPS_SCRIPT_URL;

  if (!appsScriptUrl) {
    throw new Error("APPS_SCRIPT_URL no está configurada. Agrega la variable en Vercel → Settings → Environment Variables.");
  }

  const payload = items.map((item) => ({
    id: item.product.id,
    size: item.size,
    quantity: item.quantity,
  }));

  const res = await fetch(appsScriptUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: payload }),
  });

  if (!res.ok) {
    console.error("[Zoa] Stock deduction failed:", res.status, await res.text());
  }
}

// ── Write (Sale Log) ─────────────────────────────────────────────────────────

export interface SaleRecord {
  orderId: string;
  date: string;           // ISO string
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  items: { name: string; sku: string; size: string; qty: number; price: number }[];
  total: number;
  paymentMethod: string;
  status: string;
  vipCode?: string;
}

/**
 * Logs a sale to the "Ventas" sheet tab via Google Apps Script.
 * The Apps Script appends a new row with all order details.
 * Non-fatal: if APPS_SCRIPT_URL is not set, this is a no-op.
 */
export async function logSale(sale: SaleRecord): Promise<void> {
  const appsScriptUrl = process.env.APPS_SCRIPT_URL;
  if (!appsScriptUrl) {
    console.warn("[Zoa] APPS_SCRIPT_URL not set — sale log skipped");
    return;
  }

  const res = await fetch(appsScriptUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "logSale", sale }),
  });

  if (!res.ok) {
    console.error("[Zoa] Sale log failed:", res.status, await res.text());
  }
}
