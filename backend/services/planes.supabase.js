import { supabase } from '../db/supabaseClient.js'

export const getPlanesSvc = async ({ supa, page, pageSize, q }) => {
  let query = supa
    .from('planes_precios')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)

  if (q) {
    const lower = q.toLowerCase()

    if (!isNaN(Number(q))) {
      const num = Number(q)
      const min = Math.max(0, num * 0.8)
      const max = num * 1.2

      query = query
        .gte('precio', min)
        .lte('precio', max)
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

  return page && pageSize
    ? { items: data ?? [], total: count ?? 0 }
    : data ?? []
}

export const createPlanSvc = async ({
  supa,
  nombre,
  numero_clases,
  precio,
  gym_id,
  color,
}) => {
  const { data, error } = await supa
    .from('planes_precios')
    .insert([{ nombre, numero_clases, precio, gym_id, color }])
    .select()
    .single()

  if (error) throw error
  return data
}

export const updatePlanSvc = async ({
  supa,
  id,
  nombre,
  numero_clases,
  precio,
  color,
  gym_id,
}) => {
  const { data, error } = await supa
    .from('planes_precios')
    .update({
      nombre,
      numero_clases,
      precio,
      color,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deletePlanSvc = async ({ supa, id }) => {
  const { data, error } = await supa
    .from('planes_precios')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  return data 
}

