import { supabase } from '../db/supabaseClient.js'

export const getPlanes = async ({ gymId, page, pageSize, q }) => {
  let query = supabase
    .from('planes_precios')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)

  if (gymId) query = query.eq('gym_id', gymId)

  if (q) {
    const lower = q.toLowerCase()

    if (!isNaN(Number(q))) {
      const num = Number(q)

      const min = Math.max(0, num * 0.8)
      const max = num * 1.2

      query = query.gte('precio', min).lte('precio', max)
    } else {
      query = query.ilike('nombre', `%${lower}%`)
    }
  }

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
