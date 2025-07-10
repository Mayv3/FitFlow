import { supabase } from '../db/supabaseClient.js'

export async function getAllPagos() {
  const { data, error } = await supabase
    .from('pagos')
    .select('*')
    .order('fecha_de_pago', { ascending: false })
  if (error) throw error
  return data
}

export async function getPagoById(id) {
  const { data, error } = await supabase
    .from('pagos')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}


export async function createPago(pago) {
  const { data, error } = await supabase
    .from('pagos')
    .insert(pago)
    .single()
  if (error) throw error
  return data
}


export async function updatePago(id, nuevosDatos) {
  const { data, error } = await supabase
    .from('pagos')
    .update(nuevosDatos)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function deletePago(id) {
  const { data, error } = await supabase
    .from('pagos')
    .delete()
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}
