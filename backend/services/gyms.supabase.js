import { supabaseAdmin } from '../db/supabaseClient.js'

/**
 * Crea un nuevo gimnasio en la tabla `gyms`.
 * @param {{ name: string; location?: string }} gym Datos del gimnasio
 * @returns {{ id: string; name: string; location: string | null; settings: object | null }}
 */

export async function createGym({ name }) {
  const { data, error } = await supabaseAdmin
    .from('gyms')
    .insert({ name, logo_url: null, settings: null })
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
