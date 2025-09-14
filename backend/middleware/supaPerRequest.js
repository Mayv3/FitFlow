import { createClient } from '@supabase/supabase-js'

export function supaPerRequest(req, _res, next) {
  req.supa = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: req.headers.authorization ?? '' } } }
  )
  next()
}
