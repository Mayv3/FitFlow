import { createClient } from '@supabase/supabase-js'

export function supaPerRequest(req, _res, next) {
  req.supa = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      // Sin esto, cada cliente deja un setInterval de auto-refresh que lo retiene
      // para siempre: fuga de memoria y CPU (ver FUGA-MEMORIA.md).
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
      global: { headers: { Authorization: req.headers.authorization ?? '' } },
    }
  )
  next()
}
