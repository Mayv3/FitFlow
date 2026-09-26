import { LRUCache } from 'lru-cache'

// Caché en memoria del proceso. Antes era un Map donde una entrada vencida
// solo se borraba si alguien la volvía a pedir: tokens viejos, textos
// buscados, rangos de fechas… quedaban para siempre y la memoria crecía hasta
// el próximo reinicio. Con LRU:
// - `max`: tope de entradas; al llenarse se descarta la menos usada.
// - `ttlAutopurge`: las vencidas se borran solas aunque nadie las pida.
const MAX_ENTRADAS = 5000

const store = new LRUCache({
  max: MAX_ENTRADAS,
  ttl: 5 * 60 * 1000, // default; cada set() pasa el suyo
  ttlAutopurge: true,
})

export async function get(key) {
  return store.get(key) ?? null
}

export async function set(key, value, ttlSeconds) {
  store.set(key, value, { ttl: ttlSeconds * 1000 })
}

export async function delPattern(pattern) {
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
  for (const key of store.keys()) {
    if (regex.test(key)) store.delete(key)
  }
}
