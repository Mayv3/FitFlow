import redis from '../db/redis.js'

export async function get(key) {
  try {
    const val = await redis.get(key)
    if (val !== null) {
      console.log(`[Cache HIT]  ${key}`)
    } else {
      console.log(`[Cache MISS] ${key}`)
    }
    return val
  } catch (err) {
    console.error(`[Cache ERROR] get(${key}):`, err.message)
    return null
  }
}

export async function set(key, value, ttlSeconds) {
  try {
    await redis.set(key, value, { ex: ttlSeconds })
    console.log(`[Cache SET]  ${key} (${ttlSeconds}s)`)
  } catch (err) {
    console.error(`[Cache ERROR] set(${key}):`, err.message)
  }
}

export async function delPattern(pattern) {
  try {
    let cursor = 0
    let total = 0
    do {
      const [next, keys] = await redis.scan(cursor, { match: pattern, count: 100 })
      cursor = Number(next)
      if (keys.length) {
        await redis.del(...keys)
        total += keys.length
      }
    } while (cursor !== 0)
    console.log(`[Cache DEL]  ${pattern} (${total} keys)`)
  } catch (err) {
    console.error(`[Cache ERROR] delPattern(${pattern}):`, err.message)
  }
}
