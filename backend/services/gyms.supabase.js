import { supabaseAdmin } from '../db/supabaseClient.js'

export async function createGym({ name, settings = {}, logo_url = null }) {
  const { data, error } = await supabaseAdmin
    .from('gyms')
    .insert({ name, logo_url, settings })
    .select('id, name, logo_url, settings')
    .single()

  if (error) throw error
  return data
}

export async function listGyms() {
  const { data, error } = await supabaseAdmin
    .from('gyms')
    .select('id, name, logo_url, settings')

  if (error) throw error
  return data
}
