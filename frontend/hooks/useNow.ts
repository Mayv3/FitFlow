'use client'

import { useSyncExternalStore } from 'react'

/**
 * Timestamp "ahora" utilizable durante el render.
 *
 * Llamar `Date.now()` directo en el cuerpo de un componente es impuro: el valor
 * cambia entre renders sin que cambie ningun input, asi que React (y el compiler)
 * no pueden tratar el render como idempotente. Ademas, en la practica el valor
 * quedaba congelado: los chips de "vencido"/"por vencer" no se actualizaban
 * mientras la pagina seguia abierta.
 *
 * Este hook expone el tiempo como un store externo que emite cada minuto, que es
 * la forma soportada de leer algo mutable del exterior durante el render.
 * `getServerSnapshot` devuelve 0 para que el HTML del server y la primera pasada
 * de hidratacion coincidan; despues React re-renderiza con el valor real.
 */
const TICK_MS = 60_000

let now = Date.now()
const listeners = new Set<() => void>()
let timer: ReturnType<typeof setInterval> | null = null

function subscribe(onStoreChange: () => void): () => void {
  // Refrescar al primer suscriptor: el modulo pudo cargarse hace rato.
  now = Date.now()
  listeners.add(onStoreChange)

  if (timer === null) {
    timer = setInterval(() => {
      now = Date.now()
      listeners.forEach((listener) => listener())
    }, TICK_MS)
  }

  return () => {
    listeners.delete(onStoreChange)
    if (listeners.size === 0 && timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }
}

const getSnapshot = () => now
const getServerSnapshot = () => 0

export function useNow(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
