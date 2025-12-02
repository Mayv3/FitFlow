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

export async function updateGym(gymId, updates) {
  const { data, error } = await supabaseAdmin
    .from('gyms')
    .update(updates)
    .eq('id', gymId)
    .select('id, name, logo_url, settings')
    .single()

  if (error) throw error
  return data
}

export async function listGymSubscriptions(gymId, { onlyActive = false } = {}) {
  let query = supabaseAdmin
    .from('suscriptions')
    .select('id, gym_id, plan_id, is_active, start_at, end_at, created_at, updated_at')
    .eq('gym_id', gymId)

  if (onlyActive) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}
