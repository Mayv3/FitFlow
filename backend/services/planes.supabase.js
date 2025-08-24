import { supabase } from '../db/supabaseClient.js'

export const getPlanes = async ({ gymId, page, pageSize, q }) => {

  let query = supabase
    .from('planes_precios')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)

  if (gymId) query = query.eq('gym_id', gymId)
  if (q) query = query.ilike('nombre', `%${q}%`)
  if (page && pageSize) {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)
  }

  const { data, error, count } = await query
  if (error) throw error
  return page && pageSize ? { items: data, total: count ?? 0 } : data
}

export const createPlan = async ({ nombre, numero_clases, precio, gym_id }) => {
  const { data, error } = await supabase
    .from('planes_precios')
    .insert([{ nombre, numero_clases, precio, gym_id }])
    .select()
    .single()
  if (error) throw error
  return data
}

export const updatePlan = async (id, { nombre, numero_clases, precio }) => {
  const { data, error } = await supabase
    .from('planes_precios')
    .update({ nombre, numero_clases, precio })
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single()
  if (error) throw error
  return data
}

export const deletePlan = async (id) => {
  const { error } = await supabase
    .from('planes_precios')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
