const store = new Map()

function memGet(key) {
  const entry = store.get(key)
  if (!entry) return null
  if (Date.now() > entry.exp) { store.delete(key); return null }
  return entry.val
}

export async function get(key) {
  return memGet(key)
}

export async function set(key, value, ttlSeconds) {
  store.set(key, { val: value, exp: Date.now() + ttlSeconds * 1000 })
}

export async function delPattern(pattern) {
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
  for (const key of store.keys()) {
    if (regex.test(key)) store.delete(key)
  }
}
