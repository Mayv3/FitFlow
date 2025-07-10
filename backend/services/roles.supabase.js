import { supabase } from '../db/supabaseClient.js'

export async function getAllRoles() {
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .order('id', { ascending: true })
  if (error) throw error
  return data
}

export async function getRoleById(id) {
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .eq('dni', dni)
    .single()
  if (error) throw error
  return data
}

export async function createRole(role) {
  const { data, error } = await supabase
    .from('roles')
    .insert(role)
    .single()
  if (error) throw error
  return data
}


export async function updateRole(id, nuevosDatos) {
  const { data, error } = await supabase
    .from('roles')
    .update(nuevosDatos)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}


export async function deleteRole(id) {
  const { data, error } = await supabase
    .from('roles')
    .delete()
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}
