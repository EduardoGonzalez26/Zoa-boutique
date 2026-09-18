/**
 * Fuente única de la Public Key de MercadoPago (isomorfa: cliente y servidor).
 *
 * Solo acepta valores con prefijo de Public Key real (`APP_USR-` producción /
 * `TEST-` pruebas); ignora Application IDs (UUID) y valores vacíos. Si ninguno
 * de los dos nombres trae una llave válida devuelve "" para que el Brick
 * muestre el error explícito de "MercadoPago no está configurado".
 *
 * Las referencias a `process.env.NEXT_PUBLIC_*` deben quedar literales aquí
 * para que Next.js las inlinee en el bundle del cliente.
 */
const CANDIDATES = [
  process.env.NEXT_PUBLIC_MP_PUBLIC_KEY,
  process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY,
];
export const MP_PUBLIC_KEY =
  CANDIDATES.find((k) => k?.startsWith("APP_USR-") || k?.startsWith("TEST-")) ?? "";
