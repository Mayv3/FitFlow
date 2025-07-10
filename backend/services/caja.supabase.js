import { supabase } from '../db/supabaseClient.js'

export async function getAllCajas(gymId) {
  const { data, error } = await supabase
    .from('caja')
    .select('*')
    .eq('gym_id', gymId)
    .order('fecha', { ascending: false })
    .order('turno', { ascending: true })
  if (error) throw error
  return data
}

export async function openCaja({ fecha, turno, hora_apertura, saldo_inicial = 0, responsable }, gymId) {
  const { data: exists, error: errCheck } = await supabase
    .from('caja')
    .select('id')
    .match({ gym_id: gymId, fecha, turno })
    .single()
  if (errCheck && errCheck.code !== 'PGRST116') throw errCheck
  if (exists) throw new Error(`Ya existe la caja de ${turno} para el ${fecha}`)

  if (turno === 'tarde') {
    const { data: morningCaja, error: errMorning } = await supabase
      .from('caja')
      .select('total_final')
      .match({ gym_id: gymId, fecha, turno: 'mañana' })
      .single()
    if (errMorning && errMorning.code !== 'PGRST116') throw errMorning
    if (morningCaja) saldo_inicial = morningCaja.total_final
  }

  const payload = { fecha, turno, hora_apertura, saldo_inicial, responsable, gym_id: gymId }
  const { data, error } = await supabase
    .from('caja')
    .insert(payload)
    .select()
    .single()
  if (error) throw error

  return data
}

export async function closeCaja(id, { total_efectivo = 0, total_tarjeta = 0, hora_cierre }, gymId) {
  const { data: existing, error: err1 } = await supabase
    .from('caja')
    .select('saldo_inicial')
    .match({ id, gym_id: gymId })
    .single()
  if (err1) throw err1

  const si = parseFloat(existing.saldo_inicial) || 0
  const ef = parseFloat(total_efectivo)       || 0
  const ta = parseFloat(total_tarjeta)        || 0
  const total_final = si + ef + ta

  const { data, error } = await supabase
    .from('caja')
    .update({ total_efectivo: ef, total_tarjeta: ta, total_final, hora_cierre })
    .match({ id, gym_id: gymId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteCaja(id, gymId) {
  const { error } = await supabase
    .from('caja')
    .delete()
    .match({ id, gym_id: gymId })
    .single()
  if (error) throw error

  return { message: 'Caja eliminada correctamente' }
}
