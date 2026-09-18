// ─────────────────────────────────────────────
//  Zoa — Shared TypeScript Interfaces
// ─────────────────────────────────────────────

// Tallas disponibles — incluye LOV (Love Size) de las marcas del sheet
export type Size = "XS" | "S" | "M" | "L" | "LOV" | "XL";

export interface ProductVariant {
  id: string;
  color: string;
  hex: string;
  image: string;       // Primer imagen de esa variante
}

export interface Product {
  id: string;           // Siempre el NUM (número de fila en el sheet) — único garantizado
  sku?: string;         // SKU del sheet — solo para display, no para rutas
  name: string;
  description?: string; // Columna D del sheet
  brand?: string;       // Columna E: MARCA (Cielo, DOUBLE ZERO, HYFVE, etc.)
  price: number;        // Precio final al público (con descuento aplicado si hay)
  originalPrice?: number; // Precio tachado (cuando hay descuento > 0)
  discount?: number;    // % de descuento (columna N)
  category: string;     // Columna O: CATEGORÍA
  collection: string;   // Columna P: COLECCIÓN
  color?: string;       // Columna L: COLOR (nombre del color)
  images: string[];     // [Q, R, S, T] — URLs de Cloudinary
  stock: Record<Size, number>;
  variants?: ProductVariant[]; // Otros colores del mismo producto
  skus?: string[];      // Todos los SKUs de las variantes (para búsqueda)
}

export interface CartItem {
  product: Product;
  size: Size;
  quantity: number;
}

// Prenda más vendida (mega menú): producto del catálogo + su foto principal
export interface BestSeller {
  id: string;
  name: string;
  image: string;
}

export interface CheckoutBody {
  items: CartItem[];
  vipCode?: string;
  buyerEmail?: string;
}

export interface MercadoPagoPreferenceResponse {
  preferenceId: string;
  initPoint: string;       // Live checkout URL
  sandboxInitPoint: string;
}

export interface WebhookPayload {
  action: string;          // e.g. "payment.created"
  api_version: string;
  data: { id: string };
  date_created: string;
  id: number;
  live_mode: boolean;
  type: string;            // e.g. "payment"
  user_id: string;
}
