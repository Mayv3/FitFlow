import { createClient } from '@supabase/supabase-js'

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' }) // local dev (tiene prioridad)
dotenv.config()                        // fallback a .env (producción)

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)