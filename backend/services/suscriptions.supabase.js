import { supabaseAdmin } from '../db/supabaseClient.js'

export const getSuscriptions = async () => {
  const { data, error } = await supabaseAdmin
    .from('suscriptions')
    .select('*, gym_plans(*)')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export const getSuscriptionById = async (id) => {
  const { data, error } = await supabaseAdmin
    .from('suscriptions')
    .select('*, gym_plans(*)')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export const getSuscriptionsByGymId = async (gymId, { onlyActive = false } = {}) => {
  let query = supabaseAdmin
    .from('suscriptions')
    .select('*, gym_plans(*)')
    .eq('gym_id', gymId)
    .order('created_at', { ascending: false })

  if (onlyActive) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

export const getActiveSuscriptionByGymId = async (gymId) => {
  const { data, error } = await supabaseAdmin
    .from('suscriptions')
    .select('*, gym_plans(*)')
    .eq('gym_id', gymId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data || null
}

export const createSuscription = async (suscriptionData) => {
  const { data, error } = await supabaseAdmin
    .from('suscriptions')
    .insert([suscriptionData])
    .select('*, gym_plans(*)')
    .single()

  if (error) throw error
  return data
}

export const updateSuscription = async (id, suscriptionData) => {
  const { data, error } = await supabaseAdmin
    .from('suscriptions')
    .update(suscriptionData)
    .eq('id', id)
    .select('*, gym_plans(*)')
    .single()

  if (error) throw error
  return data
}

export const deleteSuscription = async (id) => {
  const { error } = await supabaseAdmin
    .from('suscriptions')
    .delete()
    .eq('id', id)

  if (error) throw error
}
