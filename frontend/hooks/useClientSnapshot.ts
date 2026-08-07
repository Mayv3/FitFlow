'use client'

import { useSyncExternalStore } from 'react'

/**
 * Lee un valor que solo existe en el cliente (cookies, localStorage, location.hash)
 * de forma segura para SSR e hidratacion.
 *
 * El patron que reemplaza era `useState(defecto)` + `useEffect(() => setX(leer()))`:
 * funciona, pero dispara un render en cascada en cada montaje y el linter lo marca
 * con razon. `useSyncExternalStore` es la API pensada para esto: React usa
 * `getServerSnapshot` para el HTML del server y para la primera pasada de
 * hidratacion (asi no hay mismatch) y `getSnapshot` de ahi en adelante.
 *
 * IMPORTANTE: `getSnapshot` se llama en cada render, asi que debe devolver un valor
 * estable segun Object.is. Sirve para primitivos; si necesitas devolver un objeto,
 * cachealo fuera del render o React entra en loop.
 */
const noopSubscribe = () => () => {}

export function useClientSnapshot<T>(
  getSnapshot: () => T,
  getServerSnapshot: () => T,
): T {
  return useSyncExternalStore(noopSubscribe, getSnapshot, getServerSnapshot)
}
