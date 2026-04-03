const store = new Map()

function memGet(key) {
  const entry = store.get(key)
  if (!entry) return null
  if (Date.now() > entry.exp) { store.delete(key); return null }
  return entry.val
}

export async function get(key) {
  const val = memGet(key)
  console.log(val !== null ? `[Cache HIT]  ${key}` : `[Cache MISS] ${key}`)
  return val
}

export async function set(key, value, ttlSeconds) {
  store.set(key, { val: value, exp: Date.now() + ttlSeconds * 1000 })
  console.log(`[Cache SET]  ${key} (${ttlSeconds}s)`)
}

export async function delPattern(pattern) {
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
  let total = 0
  for (const key of store.keys()) {
    if (regex.test(key)) { store.delete(key); total++ }
  }
  console.log(`[Cache DEL]  ${pattern} (${total} keys)`)
}
