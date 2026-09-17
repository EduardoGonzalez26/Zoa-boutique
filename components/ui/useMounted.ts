"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * `false` en SSR y en el primer render del cliente; `true` tras montar.
 *
 * Sirve para leer valores que solo existen en el cliente (p. ej.
 * `useReducedMotion`) sin romper la hidratación: el primer render del
 * cliente usa el snapshot de servidor (`false`) y la variante de cliente
 * se aplica en un segundo render, ya sin comparación con el HTML SSR.
 */
export default function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}
