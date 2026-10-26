// ─────────────────────────────────────────────────────────────────────────────
//  Zoa — Campañas de promoción anuales (fuente única de la home)
//
//  Server-only: no importar desde componentes cliente (`"use client"`).
//  Sin React, sin I/O y sin dependencias: este módulo solo describe el
//  catálogo de campañas y resuelve cuál está vigente en America/Mexico_City.
//
//  La vigencia del cupón, la exclusión de piezas rebajadas y el descuento
//  en checkout son responsabilidad del backend (fase posterior).
// ─────────────────────────────────────────────────────────────────────────────

const TIME_ZONE = "America/Mexico_City";

export interface PromoImage {
  src: string;
  /** Decorativa: el banner ya comunica la campaña en texto. */
  alt: string;
  /** `object-position` móvil, p. ej. "50% 50%". */
  positionMobile: string;
  /** `object-position` desktop, p. ej. "50% 50%". */
  positionDesktop: string;
}

export interface Promo {
  /** Identificador estable; también nombra la imagen `/promos/{slug}.webp`. */
  slug: string;
  /** Permite retirar una campaña sin borrar su configuración. */
  enabled: boolean;
  /** Inicio de la ventana anual, "MM-DD" (inclusivo). */
  start: string;
  /** Fin de la ventana anual, "MM-DD" (inclusivo). Puede cruzar año (start > end). */
  end: string;
  /** Código que verá la clienta; se normaliza a mayúsculas al buscarlo. */
  code: string;
  /** Descuento porcentual de la campaña (15 = 15% OFF). */
  discount: number;
  /** El backend no debe aplicar el descuento a piezas ya rebajadas. */
  excludeDiscounted: boolean;
  overline: string;
  title: string;
  description: string;
  terms: string;
  cta: {
    label: string;
    href: string;
  };
  image: PromoImage;
}

const PROMO_TERMS =
  "Válido en toda la tienda · No acumulable con otros descuentos ni aplicable a piezas ya rebajadas.";

/**
 * Catálogo en orden cronológico (por fecha de inicio).
 * Editar aquí las ventanas anuales; la UI y el futuro backend consumen la misma fuente.
 */
export const PROMOTIONS: readonly Promo[] = [
  {
    slug: "amor",
    enabled: true,
    start: "02-10",
    end: "02-20",
    code: "AMOR15",
    discount: 15,
    excludeDiscounted: true,
    overline: "10–20 de febrero · Día del Amor y la Amistad",
    title: "El amor se ve bien",
    description: "Celebra con 15% OFF en toda la tienda usando el código AMOR15.",
    terms: PROMO_TERMS,
    cta: { label: "Ver la colección", href: "/tienda" },
    image: {
      src: "/promos/amor.webp",
      alt: "",
      positionMobile: "50% 50%",
      positionDesktop: "50% 50%",
    },
  },
  {
    slug: "madres",
    enabled: true,
    start: "05-05",
    end: "05-15",
    code: "MAMA15",
    discount: 15,
    excludeDiscounted: true,
    overline: "5–15 de mayo · Día de las Madres",
    title: "15% OFF para mamá",
    description:
      "El regalo que se queda con ella. Encuentra su próxima pieza favorita con el código MAMA15.",
    terms: PROMO_TERMS,
    cta: { label: "Regalar ahora", href: "/tienda" },
    image: {
      src: "/promos/madres.webp",
      alt: "",
      positionMobile: "50% 50%",
      positionDesktop: "50% 50%",
    },
  },
  {
    slug: "buenfin",
    enabled: true,
    start: "11-13",
    end: "11-17",
    code: "BUENFIN15",
    discount: 15,
    excludeDiscounted: true,
    overline: "13–17 de noviembre · Buen Fin",
    title: "Buen Fin en Zoa",
    description: "15% OFF en toda la tienda con el código BUENFIN15.",
    terms: PROMO_TERMS,
    cta: { label: "Ver la colección", href: "/tienda" },
    image: {
      src: "/promos/buenfin.webp",
      alt: "",
      positionMobile: "50% 50%",
      positionDesktop: "50% 50%",
    },
  },
  {
    slug: "navidad",
    enabled: true,
    start: "12-20",
    // Cruza año: también cubre el 1 de enero.
    end: "01-01",
    code: "NAVIDAD15",
    discount: 15,
    excludeDiscounted: true,
    overline: "20 de diciembre–1 de enero · Navidad y Año Nuevo",
    title: "Cierra el año con estilo",
    description: "Encuentra el último regalo con 15% OFF usando el código NAVIDAD15.",
    terms: PROMO_TERMS,
    cta: { label: "Regalar ahora", href: "/tienda" },
    image: {
      src: "/promos/navidad.webp",
      alt: "",
      positionMobile: "50% 50%",
      positionDesktop: "50% 50%",
    },
  },
];

const MEXICO_DATE = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Fecha civil de Ciudad de México como "MM-DD" (independiente de la zona del servidor). */
function monthDayInMexico(now: Date): string {
  const parts = MEXICO_DATE.formatToParts(now);
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${month}-${day}`;
}

/**
 * Reloj de las campañas.
 * En development, `PROMO_NOW` (ISO 8601) permite simular fechas; en production
 * se ignora por completo y siempre se usa `new Date()`.
 */
export function getZoaNow(): Date {
  if (process.env.NODE_ENV === "development") {
    const raw = process.env.PROMO_NOW?.trim();
    if (raw) {
      const parsed = new Date(raw);
      if (!Number.isNaN(parsed.getTime())) return parsed;
      console.warn(
        `[promotions] PROMO_NOW="${raw}" no es una fecha ISO válida; se usa el reloj real.`,
      );
    }
  }
  return new Date();
}

/** Busca una campaña por código (sin distinguir mayúsculas/minúsculas). */
export function getPromoByCode(code: string): Promo | undefined {
  const normalized = code.trim().toUpperCase();
  return PROMOTIONS.find((promo) => promo.code.toUpperCase() === normalized);
}

/** Busca una campaña por slug. */
export function getPromoBySlug(slug: string): Promo | undefined {
  const normalized = slug.trim();
  return PROMOTIONS.find((promo) => promo.slug === normalized);
}

/**
 * ¿La campaña está dentro de su ventana anual?
 * Ventana inclusiva en ambos extremos y en hora de America/Mexico_City.
 * Soporta campañas que cruzan el año (p. ej. 12-20 → 01-01).
 */
export function isPromoActive(promo: Promo, now: Date = getZoaNow()): boolean {
  if (Number.isNaN(now.getTime())) return false;
  const current = monthDayInMexico(now);
  return promo.start <= promo.end
    ? current >= promo.start && current <= promo.end
    : current >= promo.start || current <= promo.end;
}

function getPreviewPromo(): Promo | null {
  if (process.env.NODE_ENV !== "development") return null;

  const slug = process.env.PROMO_PREVIEW?.trim();
  if (!slug) return null;

  const promo = getPromoBySlug(slug);
  if (!promo) {
    console.warn(
      `[promotions] PROMO_PREVIEW="${slug}" no coincide con ningún slug; se usa la campaña activa.`,
    );
    return null;
  }
  return promo;
}

/**
 * Primera campaña habilitada y activa (orden cronológico del catálogo).
 * - En development, `PROMO_PREVIEW` fuerza una campaña aunque esté fuera de fecha.
 * - En production, `PROMO_PREVIEW` y `PROMO_NOW` se ignoran por completo.
 * - Si más de una campaña está activa, gana la primera y se advierte en development.
 */
export function getActivePromo(now: Date = getZoaNow()): Promo | null {
  const preview = getPreviewPromo();
  if (preview) return preview;

  const active = PROMOTIONS.filter(
    (promo) => promo.enabled && isPromoActive(promo, now),
  );

  if (process.env.NODE_ENV === "development" && active.length > 1) {
    console.warn(
      `[promotions] ${active.length} campañas activas (${active
        .map((promo) => promo.slug)
        .join(", ")}); se renderiza "${active[0]?.slug}". Revisa las ventanas.`,
    );
  }

  return active[0] ?? null;
}
