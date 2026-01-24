import { supabase } from '../db/supabaseClient.js'

export const getProductosSvc = async ({ supa, gymId, page, pageSize, q, categoria }) => {
  let query = supa
    .from('productos')
    .select('*', { count: 'exact' })
    .eq('gym_id', gymId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

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
      query = query.or(`nombre.ilike.%${lower}%,descripcion.ilike.%${lower}%`)
    }
  }

  if (categoria) {
    query = query.eq('categoria', categoria)
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

export const getProductoByIdSvc = async ({ supa, id }) => {
  const { data, error } = await supa
    .from('productos')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) throw error

  return data
}

export const createProductoSvc = async ({
  supa,
  nombre,
  descripcion,
  precio,
  stock,
  categoria,
  activo,
  gymId
}) => {
  const { data, error } = await supa
    .from('productos')
    .insert([
      {
        nombre,
        descripcion,
        precio,
        stock: stock ?? 0,
        categoria,
        activo: activo ?? true,
        gym_id: gymId
      }
    ])
    .select()
    .single()

  if (error) throw error

  return data
}

export const updateProductoSvc = async ({
  supa,
  id,
  nombre,
  descripcion,
  precio,
  stock,
  categoria,
  activo
}) => {
  const updateData = {}

  if (nombre !== undefined) updateData.nombre = nombre
  if (descripcion !== undefined) updateData.descripcion = descripcion
  if (precio !== undefined) updateData.precio = precio
  if (stock !== undefined) updateData.stock = stock
  if (categoria !== undefined) updateData.categoria = categoria
  if (activo !== undefined) updateData.activo = activo

  const { data, error } = await supa
    .from('productos')
    .update(updateData)
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) throw error

  return data
}

export const deleteProductoSvc = async ({ supa, id }) => {
  const { data, error } = await supa
    .from('productos')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) throw error

  return data
}

export const updateStockProductoSvc = async ({ supa, id, cantidad, operacion = 'incrementar' }) => {
  // Primero obtenemos el producto actual
  const { data: producto, error: fetchError } = await supa
    .from('productos')
    .select('stock')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (fetchError) throw fetchError

  let nuevoStock
  if (operacion === 'incrementar') {
    nuevoStock = producto.stock + cantidad
  } else if (operacion === 'decrementar') {
    nuevoStock = Math.max(0, producto.stock - cantidad)
  } else {
    throw new Error('Operación no válida. Use "incrementar" o "decrementar"')
  }

  const { data, error } = await supa
    .from('productos')
    .update({ stock: nuevoStock })
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) throw error

  return data
}


