// ─────────────────────────────────────────────────────────────────────────────
//  Zoa — Venta física server-side (tienda)
//
//  Server-only: se invoca desde una Server Action autenticada del admin.
//  No expone secretos ni crea endpoints HTTP nuevos.
//
//  Reglas:
//  - El catálogo fresco es la única fuente de precio, talla y stock. El input
//    solo aporta `productId`, `size` y `quantity`; cualquier precio enviado por
//    el cliente se ignora.
//  - Las líneas repetidas del mismo producto+talla se fusionan antes de validar
//    stock (evita burlar el inventario partiendo la misma pieza en dos líneas).
//  - `orderId` sigue el prefijo `ZOA-TIENDA-…` para que el Apps Script pueda
//    deduplicar reintentos y separar la venta de Carmeli.
//  - Si falla la escritura de stock o del log, se lanza `PhysicalSaleWriteError`
//    con `orderId`/`total` para que el caller pueda alertar y conciliar.
// ─────────────────────────────────────────────────────────────────────────────

import type { Brand, CartItem, Product, Size } from "@/lib/types";
import { deductStock, getProducts, logSale } from "@/lib/googleSheets";

const BRAND: Brand = "ZOA";
const VALID_SIZES: readonly Size[] = ["XS", "S", "M", "L", "LOV", "XL"];
const MAX_LINE_QUANTITY = 100;
const MAX_SELLER_NOTE_LENGTH = 500;

export interface PhysicalSaleItemInput {
  productId: string;
  size: Size;
  quantity: number;
}

export interface PhysicalSaleInput {
  items: PhysicalSaleItemInput[];
  /** Nota libre de la vendedora; se guarda en la columna Dirección del log. */
  sellerNote?: string;
}

export type PhysicalSaleErrorCode =
  | "OUT_OF_STOCK"
  | "PRODUCT_UNAVAILABLE"
  | "INVALID_QUANTITY";

export interface PhysicalSaleFailure {
  ok: false;
  code: PhysicalSaleErrorCode;
  message: string;
  productId?: string;
  size?: Size;
  available?: number;
}

export interface PhysicalSaleSuccess {
  ok: true;
  orderId: string;
  total: number;
}

export type PhysicalSaleResult = PhysicalSaleSuccess | PhysicalSaleFailure;

/** Fallo de escritura (stock o log). No es un error de validación. */
export class PhysicalSaleWriteError extends Error {
  readonly stage: "stock" | "log";
  readonly orderId: string;
  readonly total: number;

  constructor(stage: "stock" | "log", orderId: string, total: number, message: string) {
    super(message);
    this.name = "PhysicalSaleWriteError";
    this.stage = stage;
    this.orderId = orderId;
    this.total = total;
  }
}

/** Dependencias inyectables para pruebas; en producción se omiten. */
export interface PhysicalSaleDependencies {
  getProducts: typeof getProducts;
  deductStock: typeof deductStock;
  logSale: typeof logSale;
}

const DEFAULT_DEPENDENCIES: PhysicalSaleDependencies = {
  getProducts,
  deductStock,
  logSale,
};

function fail(
  code: PhysicalSaleErrorCode,
  message: string,
  extra: Pick<PhysicalSaleFailure, "productId" | "size" | "available"> = {},
): PhysicalSaleFailure {
  return { ok: false, code, message, ...extra };
}

/**
 * Registra una venta física: valida catálogo/stock, descuenta inventario y
 * escribe el log de venta.
 *
 * @param input Líneas de la venta (solo IDs/tallas/cantidades).
 * @param dependencies Inyección opcional para pruebas; no usar en producción.
 */
export async function registerPhysicalSale(
  input: PhysicalSaleInput,
  dependencies: Partial<PhysicalSaleDependencies> = {},
): Promise<PhysicalSaleResult> {
  const deps = { ...DEFAULT_DEPENDENCIES, ...dependencies };

  const rawItems: unknown = input?.items;
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return fail("INVALID_QUANTITY", "No hay productos en la venta.");
  }

  let catalog: Product[];
  try {
    catalog = await deps.getProducts({ fresh: true });
  } catch (error) {
    console.error("[physicalSale] No se pudo leer el catálogo fresco:", error);
    throw new Error("No se pudo validar el catálogo. Intenta de nuevo.");
  }

  const catalogById = new Map(catalog.map((product) => [product.id, product]));
  const mergedLines = new Map<string, CartItem>();

  for (const rawItem of rawItems) {
    if (!rawItem || typeof rawItem !== "object") {
      return fail("INVALID_QUANTITY", "Hay una línea inválida en la venta.");
    }

    const item = rawItem as {
      productId?: unknown;
      size?: unknown;
      quantity?: unknown;
    };

    const productId =
      typeof item.productId === "string" ? item.productId.trim() : "";
    if (!productId) {
      return fail("PRODUCT_UNAVAILABLE", "Hay un producto inválido en la venta.");
    }

    const product = catalogById.get(productId);
    if (!product) {
      return fail(
        "PRODUCT_UNAVAILABLE",
        "Uno de los productos de la venta ya no está disponible.",
        { productId },
      );
    }

    if (
      typeof item.size !== "string" ||
      !VALID_SIZES.includes(item.size as Size)
    ) {
      return fail(
        "PRODUCT_UNAVAILABLE",
        `La talla de ${product.name} no es válida.`,
        { productId },
      );
    }
    const size = item.size as Size;

    const quantity =
      typeof item.quantity === "number" ? item.quantity : Number(item.quantity);
    if (
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      quantity > MAX_LINE_QUANTITY
    ) {
      return fail(
        "INVALID_QUANTITY",
        `La cantidad de ${product.name} en talla ${size} no es válida.`,
        { productId, size },
      );
    }

    const key = `${productId}:${size}`;
    const existing = mergedLines.get(key);
    if (existing) {
      const mergedQuantity = existing.quantity + quantity;
      if (mergedQuantity > MAX_LINE_QUANTITY) {
        return fail(
          "INVALID_QUANTITY",
          `La cantidad de ${product.name} en talla ${size} no es válida.`,
          { productId, size },
        );
      }
      existing.quantity = mergedQuantity;
    } else {
      mergedLines.set(key, { product, size, quantity });
    }
  }

  const saleItems = [...mergedLines.values()];

  // Stock autoritativo del catálogo fresco (después de fusionar líneas).
  for (const item of saleItems) {
    const available = item.product.stock?.[item.size] ?? 0;
    if (!Number.isInteger(available) || available < item.quantity) {
      return fail(
        "OUT_OF_STOCK",
        `No hay stock suficiente de ${item.product.name} en talla ${item.size}.`,
        {
          productId: item.product.id,
          size: item.size,
          available: Number.isFinite(available) ? available : 0,
        },
      );
    }
  }

  const total = saleItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
  const orderId = `ZOA-TIENDA-${Date.now()}`;
  const sellerNote =
    typeof input.sellerNote === "string"
      ? input.sellerNote.trim().slice(0, MAX_SELLER_NOTE_LENGTH)
      : "";

  // 1. Stock: si falla, la venta NO se considera registrada.
  try {
    await deps.deductStock(saleItems, orderId, BRAND);
  } catch (error) {
    console.error(
      `[physicalSale][ALERT] orden ${orderId}: falló el descuento de stock`,
      error,
    );
    throw new PhysicalSaleWriteError(
      "stock",
      orderId,
      total,
      "No se pudo descontar el inventario. La venta no se registró.",
    );
  }

  // 2. Log de venta. El stock ya se descontó: si falla, se lanza con orderId
  //    para que el caller lo muestre y se concilie manualmente.
  try {
    await deps.logSale({
      orderId,
      date: new Date().toISOString(),
      customerName: "Venta Física",
      customerEmail: "-",
      customerPhone: "-",
      address: sellerNote || "Venta en tienda física",
      items: saleItems.map((item) => ({
        name: item.product.name,
        sku: item.product.id,
        size: item.size,
        qty: item.quantity,
        price: item.product.price,
      })),
      total,
      paymentMethod: "VENDIDO",
      status: "sold_physical",
      vipCode: "VENDIDO",
      brand: BRAND,
    });
  } catch (error) {
    console.error(
      `[physicalSale][ALERT] orden ${orderId}: stock descontado pero el log de venta falló`,
      error,
    );
    throw new PhysicalSaleWriteError(
      "log",
      orderId,
      total,
      "El inventario se descontó, pero la venta no se pudo registrar en el Sheet.",
    );
  }

  return { ok: true, orderId, total };
}
