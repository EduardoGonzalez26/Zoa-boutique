// ─────────────────────────────────────────────────────────────────────────────
//  Zoa — Google Sheets Reader (CSV público — sin auth)
//
//  Dos modos de lectura del catálogo:
//  1. GOOGLE_SHEET_PUBLIC_CSV_URL definida → se lee esa URL publicada
//     ("Publicar en la web"). El archivo maestro puede seguir privado.
//  2. Sin esa env → fallback local al export CSV por GOOGLE_SHEET_ID
//     (requiere que la hoja sea visible con el enlace).
//
//  Best sellers:
//  - GOOGLE_SHEET_PUBLIC_BESTSELLERS_CSV_URL definida → se lee esa pestaña
//    pública sin PII (solo Producto/Nombre y Unidades/Cantidad).
//  - Sin ella se conserva el comportamiento histórico (gviz de "Ventas").
//
//  For WRITING (stock deduction after payment), we use a Google Apps Script
//  web app deployed from the same sheet (see APPS_SCRIPT_URL env var).
//  Apps Script escribe en el archivo privado; no requiere hoja pública.
//
//  Pestaña: "Oficial" — Columns A–T:
//  A:NUM  B:SKU  C:NOMBRE  D:DESCRIPCIÓN  E:MARCA
//  F:XS  G:S  H:M  I:L  J:LOV  K:XL  L:COLOR
//  M:PRECIO  N:DESCUENTO%  O:CATEGORÍA  P:COLECCIÓN
//  Q:DE FRENTE  R:CLOSE UP  S:DE LADO  T:DE ESPALDAS
// ─────────────────────────────────────────────────────────────────────────────

import type { BestSeller, Brand, CartItem, Product, SaleConsent } from "./types";

const SHEET_NAME = process.env.GOOGLE_SHEET_NAME ?? "Oficial";
const VENTAS_SHEET_NAME = process.env.GOOGLE_SHEET_VENTAS ?? "Ventas";

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
 * Descarga y parsea una URL CSV. CSV no infiere tipos: todo llega como string,
 * lo que evita que gviz convierta valores mixtos (p. ej. "106A") a null.
 */
async function fetchCsvRows(
  url: string,
  fresh: boolean,
  revalidateSeconds: number,
  label: string,
): Promise<string[][]> {
  const res = await fetch(
    url,
    fresh
      ? { cache: "no-store" }
      : { next: { revalidate: revalidateSeconds } },
  );

  if (!res.ok) {
    throw new Error(`${label} CSV fetch failed: ${res.status} ${res.statusText}`);
  }

  const text = await res.text();
  return parseCSV(text.replace(/^\uFEFF/, ""));
}

/**
 * Fetches all rows from the "Oficial" sheet via CSV.
 *
 * Prioridad:
 * 1. `GOOGLE_SHEET_PUBLIC_CSV_URL` (URL publicada de la pestaña Oficial).
 * 2. Fallback: export CSV por `GOOGLE_SHEET_ID` (hoja compartida por enlace).
 *
 * La primera fila siempre es el encabezado y se descarta.
 */
async function fetchSheetRows(fresh = false): Promise<string[][]> {
  const publicCsvUrl = process.env.GOOGLE_SHEET_PUBLIC_CSV_URL?.trim();
  const url =
    publicCsvUrl ||
    `https://docs.google.com/spreadsheets/d/${getSpreadsheetId()}/export?format=csv&sheet=${encodeURIComponent(SHEET_NAME)}`;

  const rows = await fetchCsvRows(url, fresh, 60, "Google Sheets Oficial");

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
export async function getProducts(
  options: { fresh?: boolean } = {},
): Promise<Product[]> {
  const rows = await fetchSheetRows(options.fresh === true);

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

// ── Read (Best Sellers) ──────────────────────────────────────────────────────

/**
 * Fetches the "Ventas" tab (sales log written by the Apps Script).
 *
 * IMPORTANT: this tab is NOT the first sheet, and the /export?sheet= endpoint
 * silently falls back to the first sheet for any non-first tab. The gviz
 * endpoint DOES resolve tabs by name, so it is used here. If the tab is
 * missing/renamed the fallback returns the "Oficial" header — we detect that
 * and return [] so the UI keeps its static fallback.
 */
async function fetchVentasRows(fresh = false): Promise<string[][]> {
  const id = getSpreadsheetId();
  const url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(VENTAS_SHEET_NAME)}`;

  const res = await fetch(
    url,
    fresh
      ? { cache: "no-store" }
      : { next: { revalidate: 300 } }, // las ventas cambian con poca frecuencia
  );

  if (!res.ok) {
    throw new Error(`Google Sheets ventas fetch failed: ${res.status} ${res.statusText}`);
  }

  const rows = parseCSV((await res.text()).replace(/^\uFEFF/, ""));
  const header = (rows[0] ?? []).join(" ").toLowerCase();
  const isVentas = header.includes("productos") && header.includes("fecha");
  return isVentas ? rows.slice(1) : [];
}

/** Nombre comparable: minúsculas, sin acentos y con espacios colapsados. */
function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

/** Estados que NO deben contar para best sellers (pedidos sin surtir/cancelados). */
const NON_COUNTABLE_STATUSES = new Set([
  "pending_fulfillment",
  "processing",
  "cancelled",
  "canceled",
  "rejected",
  "failed",
]);

/** Estados finales conocidos del log de ventas. */
const SALE_STATUSES = [
  "approved",
  "sold_physical",
  "pending_fulfillment",
  "processing",
  "pending",
  "rejected",
  "cancelled",
  "canceled",
  "failed",
] as const;

export type SaleLogStatus = (typeof SALE_STATUSES)[number] | "unknown";

/**
 * Zoa y Carmeli comparten la pestaña "Ventas". Sólo contamos pedidos de Zoa:
 * los generados por process-payment (`ZOA-…`) y por la tienda física
 * (`ZOA-TIENDA-…`). Si no hay filas nuevas con esos prefijos se conserva el
 * comportamiento anterior (contar toda la hoja) como fallback.
 */
function isZoaSaleRow(row: string[]): boolean {
  return row.some((cell) => {
    const value = cell.trim().toUpperCase();
    return (
      value.startsWith("ZOA-") ||
      value.startsWith("ZOA-TIENDA-") ||
      /(^|\s)ZOA-(TIENDA-)?\d/.test(value)
    );
  });
}

function isCountableSaleRow(row: string[]): boolean {
  return !row.some((cell) =>
    NON_COUNTABLE_STATUSES.has(cell.trim().toLowerCase()),
  );
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Busca el estado de un pedido en el log de ventas (lectura fresca, sin caché).
 *
 * Se usa como marca de idempotencia del webhook de MercadoPago: si el pedido
 * ya tiene una fila con estado final, el evento no se vuelve a procesar.
 * Devuelve `null` si no hay ninguna fila con ese orderId.
 */
export async function findSaleStatusByOrderId(
  orderId: string,
): Promise<SaleLogStatus | null> {
  const rows = await fetchVentasRows(true);
  const matcher = new RegExp(
    `(^|[^A-Za-z0-9-])${escapeRegExp(orderId)}([^0-9]|$)`,
  );

  let fallback: SaleLogStatus | null = null;

  for (const row of rows) {
    const matches = row.some((cell) => matcher.test(cell.trim()));
    if (!matches) continue;

    const normalized = row.map((cell) => cell.trim().toLowerCase());
    const found = SALE_STATUSES.find((status) =>
      normalized.some((cell) => cell === status),
    );

    if (found === "pending_fulfillment" || found === "processing") {
      // Hay una fila, pero el pedido aún no terminó: permite reintentar.
      fallback = found;
      continue;
    }
    if (found) return found;
    fallback = "unknown";
  }

  return fallback;
}

/**
 * Aggregates units sold per product name from the "Ventas" log.
 * Items are stored as "Nombre (TALLA) xCant $precio" joined by " | ".
 */
function countSoldUnits(rows: string[][]): Map<string, number> {
  const units = new Map<string, number>();

  for (const row of rows) {
    if (!isCountableSaleRow(row)) continue;
    for (const cell of row) {
      if (!cell || !cell.includes("(")) continue;
      for (const part of cell.split("|")) {
        const match = part.trim().match(/^(.+?)\s*\(([^)]+)\)\s*x(\d+)/);
        if (!match) continue;
        const qty = parseInt(match[3], 10) || 0;
        if (qty <= 0) continue;
        const key = normalizeName(match[1]);
        units.set(key, (units.get(key) ?? 0) + qty);
      }
    }
  }

  return units;
}

/** Encabezado comparable: minúsculas, sin acentos, sin espacios extra. */
function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function findHeaderIndex(
  headers: string[],
  aliases: string[],
  tokens: string[],
): number {
  for (const alias of aliases) {
    const index = headers.indexOf(alias);
    if (index !== -1) return index;
  }
  return headers.findIndex((header) =>
    tokens.some((token) => header.includes(token)),
  );
}

/**
 * Lee la pestaña pública "BestSellers" (sin PII) publicada con
 * "Publicar en la web". Acepta encabezados flexibles:
 *   - Producto | Nombre
 *   - Unidades | Cantidad
 *
 * Cualquier otra columna se ignora. Devuelve unidades agregadas por nombre.
 */
async function fetchPublicBestSellerRows(
  url: string,
  fresh = false,
): Promise<Map<string, number>> {
  const rows = await fetchCsvRows(url, fresh, 300, "Google Sheets BestSellers");
  if (rows.length === 0) return new Map();

  const headers = (rows[0] ?? []).map(normalizeHeader);
  const productIndex = findHeaderIndex(
    headers,
    ["producto", "nombre", "productos", "nombres"],
    ["producto", "nombre"],
  );
  const unitsIndex = findHeaderIndex(
    headers,
    ["unidades", "cantidad", "unidades vendidas", "cantidad vendida"],
    ["unidad", "cantidad"],
  );

  if (productIndex === -1 || unitsIndex === -1) {
    console.warn(
      "[googleSheets] BestSellers CSV sin columnas Producto/Nombre y Unidades/Cantidad.",
    );
    return new Map();
  }

  const unitsByName = new Map<string, number>();
  for (const row of rows.slice(1)) {
    const name = String(row[productIndex] ?? "").trim();
    // `toFloat` tolera separadores de miles y símbolos ($) del CSV publicado.
    const units = Math.trunc(toFloat(row[unitsIndex]));
    if (!name || units <= 0) continue;

    const key = normalizeName(name);
    unitsByName.set(key, (unitsByName.get(key) ?? 0) + units);
  }

  return unitsByName;
}

/**
 * Cruza las unidades vendidas con el catálogo actual y devuelve los productos
 * con foto. Los productos que ya no existen (o no tienen imagen) se omiten.
 */
function rankBestSellers(
  unitsByName: Map<string, number>,
  catalog: Product[],
  limit: number,
): BestSeller[] {
  const byName = new Map(catalog.map((p) => [normalizeName(p.name), p]));
  const ranked = [...unitsByName.entries()].sort((a, b) => b[1] - a[1]);

  const best: BestSeller[] = [];
  for (const [name] of ranked) {
    const product = byName.get(name);
    if (!product) continue;
    const image = product.images[0] || product.variants?.find((v) => v.image)?.image;
    if (!image) continue;

    best.push({ id: product.id, name: product.name, image });
    if (best.length >= limit) break;
  }

  return best;
}

/**
 * Returns the best-selling products (most units sold) matched against the
 * current catalog, ready for the navbar mega menú carousel.
 *
 * - Con `GOOGLE_SHEET_PUBLIC_BESTSELLERS_CSV_URL`: lee esa pestaña pública.
 * - Sin ella: conserva el ranking histórico desde "Ventas" (gviz).
 *
 * Nunca lanza: si la hoja de ventas deja de ser pública (o el catálogo falla)
 * devuelve `[]` para que el layout use su fallback estático.
 */
export async function getBestSellers(limit = 4): Promise<BestSeller[]> {
  try {
    const publicBestsellersUrl =
      process.env.GOOGLE_SHEET_PUBLIC_BESTSELLERS_CSV_URL?.trim();

    if (publicBestsellersUrl) {
      const [unitsByName, catalog] = await Promise.all([
        fetchPublicBestSellerRows(publicBestsellersUrl),
        getGroupedProducts(),
      ]);
      return rankBestSellers(unitsByName, catalog, limit);
    }

    const [saleRows, catalog] = await Promise.all([
      fetchVentasRows(),
      getGroupedProducts(),
    ]);
    if (saleRows.length === 0) return [];

    // La hoja es compartida con Carmeli: prioriza pedidos Zoa; si aún no hay
    // filas con ese prefijo (datos legacy), usa la hoja completa como fallback.
    const zoaRows = saleRows.filter(isZoaSaleRow);
    const countedRows = zoaRows.length > 0 ? zoaRows : saleRows;

    return rankBestSellers(countSoldUnits(countedRows), catalog, limit);
  } catch (error) {
    console.warn(
      "[googleSheets] Best sellers no disponibles; se usa el fallback estático:",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}


// ── Write (Apps Script) ──────────────────────────────────────────────────────

const APPS_SCRIPT_TIMEOUT_MS = 15_000;

/**
 * POST al Apps Script. Lanza si la respuesta es non-ok o si el script devuelve
 * `{ ok: false }` / `{ success: false }` con HTTP 200 (fallo silencioso).
 *
 * No se registra la URL ni el cuerpo completo en los logs: puede contener
 * datos del pedido. El mensaje se trunca a 300 caracteres.
 */
async function postAppsScript(body: unknown, action: string): Promise<void> {
  const appsScriptUrl = process.env.APPS_SCRIPT_URL;

  if (!appsScriptUrl) {
    throw new Error(
      "APPS_SCRIPT_URL no está configurada. Agrégala en las variables de entorno de Railway.",
    );
  }

  let res: Response;
  try {
    res = await fetch(appsScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      redirect: "follow",
      signal: AbortSignal.timeout(APPS_SCRIPT_TIMEOUT_MS),
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Apps Script ${action}: no se pudo conectar (${reason})`);
  }

  const text = await res.text().catch(() => "");

  if (!res.ok) {
    throw new Error(
      `Apps Script ${action} failed: HTTP ${res.status} — ${text.slice(0, 300)}`,
    );
  }

  if (text.trim()) {
    try {
      const data = JSON.parse(text) as { ok?: boolean; success?: boolean };
      if (data?.ok === false || data?.success === false) {
        throw new Error(
          `Apps Script ${action} rechazó la operación — ${text.slice(0, 300)}`,
        );
      }
    } catch (error) {
      // Sólo relanzamos si el error lo generamos nosotros; si el body no es
      // JSON (p. ej. "ok"), la respuesta HTTP 200 es suficiente.
      if (error instanceof Error && error.message.startsWith("Apps Script")) {
        throw error;
      }
    }
  }
}

// ── Write (Stock Deduction) ──────────────────────────────────────────────────

/**
 * Descuenta stock vía Google Apps Script.
 *
 * `orderId` y `brand` viajan en el payload para que el script pueda:
 *  - deduplicar reintentos del webhook (orderId),
 *  - separar ventas Zoa de Carmeli (brand).
 *
 * El Apps Script debe ignorar duplicados del mismo `orderId`: es la única
 * barrera atómica ante reintentos concurrentes entre instancias.
 */
export async function deductStock(
  items: CartItem[],
  orderId: string,
  brand: Brand,
): Promise<void> {
  const payload = items.map((item) => ({
    id: item.product.id,
    size: item.size,
    quantity: item.quantity,
  }));

  // Se conserva la forma histórica (items en la raíz, sin `action`) para no
  // romper el Apps Script desplegado; orderId/brand son campos adicionales.
  await postAppsScript(
    {
      items: payload,
      orderId,
      brand,
    },
    "deductStock",
  );
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
  brand: Brand;
  consent?: SaleConsent;
}

/**
 * Logs a sale to the "Ventas" sheet tab via Google Apps Script.
 * The Apps Script appends a new row with all order details.
 *
 * El layout actual de "Ventas" no tiene columna de consentimiento. Para que
 * quede persistido aun sin cambiar el Apps Script, se anexa al campo Dirección
 * (columna F) en formato legible. El objeto `sale` también lleva `consent`
 * para una futura columna dedicada.
 *
 * Lanza si el script no confirma la escritura. Los callers deben decidir si
 * el pedido queda `pending_fulfillment` (nunca fingir éxito silencioso).
 */
export async function logSale(sale: SaleRecord): Promise<void> {
  const salePayload = sale.consent
    ? {
        ...sale,
        address: `${sale.address} | Consentimiento: privacy=${sale.consent.privacy}; terms=${sale.consent.terms}; acceptedAt=${sale.consent.acceptedAt}`,
      }
    : sale;

  await postAppsScript(
    {
      action: "logSale",
      orderId: sale.orderId,
      brand: sale.brand,
      sale: salePayload,
    },
    "logSale",
  );
}
