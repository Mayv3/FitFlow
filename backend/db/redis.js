import { Redis } from '@upstash/redis'
import dotenv from 'dotenv'
dotenv.config({ path: new URL('../../.env.local', import.meta.url) })

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

export default redis
