"use server";

import {
  PhysicalSaleWriteError,
  registerPhysicalSale,
  type PhysicalSaleErrorCode,
} from "@/lib/physicalSale";
import type { Size } from "@/lib/types";

const VALID_SIZES: readonly Size[] = ["XS", "S", "M", "L", "LOV", "XL"];
const MAX_LINE_QUANTITY = 100;

export type SaleErrorCode =
  | PhysicalSaleErrorCode
  | "WRITE_STOCK"
  | "WRITE_LOG"
  | "UNEXPECTED";

export interface SaleActionState {
  status: "idle" | "success" | "error";
  code?: SaleErrorCode;
  message?: string;
  orderId?: string;
  total?: number;
}

function readField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Server Action del panel interno. `registerPhysicalSale` fija la marca ZOA
 * internamente; no acepta un parámetro `brand`.
 */
export async function registerSaleAction(
  _previousState: SaleActionState,
  formData: FormData,
): Promise<SaleActionState> {
  const productId = readField(formData, "productId");
  const rawSize = readField(formData, "size");
  const rawQuantity = readField(formData, "quantity");
  const sellerNote = readField(formData, "sellerNote");

  if (!productId) {
    return {
      status: "error",
      code: "PRODUCT_UNAVAILABLE",
      message: "Ingresa el ID (NUM) del producto.",
    };
  }

  if (!VALID_SIZES.includes(rawSize as Size)) {
    return {
      status: "error",
      code: "PRODUCT_UNAVAILABLE",
      message: "Selecciona una talla válida.",
    };
  }
  const size = rawSize as Size;

  const quantity = Number(rawQuantity);
  if (
    !Number.isInteger(quantity) ||
    quantity <= 0 ||
    quantity > MAX_LINE_QUANTITY
  ) {
    return {
      status: "error",
      code: "INVALID_QUANTITY",
      message: `La cantidad debe ser un entero entre 1 y ${MAX_LINE_QUANTITY}.`,
    };
  }

  try {
    const result = await registerPhysicalSale({
      items: [{ productId, size, quantity }],
      sellerNote: sellerNote || undefined,
    });

    if (!result.ok) {
      return {
        status: "error",
        code: result.code,
        message: result.message,
      };
    }

    return {
      status: "success",
      orderId: result.orderId,
      total: result.total,
      message: "Venta registrada. Inventario descontado.",
    };
  } catch (error) {
    if (error instanceof PhysicalSaleWriteError) {
      return {
        status: "error",
        code: error.stage === "stock" ? "WRITE_STOCK" : "WRITE_LOG",
        message: error.message,
        orderId: error.orderId,
        total: error.total,
      };
    }

    console.error("[admin/ventas] Error inesperado al registrar venta física:", error);
    return {
      status: "error",
      code: "UNEXPECTED",
      message: "Error inesperado al registrar la venta. Intenta de nuevo.",
    };
  }
}
