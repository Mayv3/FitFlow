import { supabaseAdmin } from '../config/supabaseClient.js'

// Sedes: gimnasios a los que puede entrar un mismo usuario. El propio es el de
// users.gym_id; los demás se habilitan en user_gyms. La sede activa vive en
// app_metadata.gym_id, que es la llave que ya usan el RLS y req.gymId, así que
// cambiar de sede no toca ninguna consulta del resto del sistema.

export async function listSedes(authUserId) {
  const [perfil, extras] = await Promise.all([
    supabaseAdmin
      .from('users')
      .select('gym_id')
      .eq('auth_user_id', authUserId)
      .is('deleted_at', null)
      .maybeSingle(),
    supabaseAdmin
      .from('user_gyms')
      .select('gym_id')
      .eq('auth_user_id', authUserId),
  ])

  if (perfil.error) throw perfil.error
  if (extras.error) throw extras.error

  const ids = [...new Set(
    [perfil.data?.gym_id, ...extras.data.map((e) => e.gym_id)].filter(Boolean)
  )]
  if (ids.length === 0) return []

  const { data, error } = await supabaseAdmin
    .from('gyms')
    .select('id, name, logo_url, settings')
    .in('id', ids)
    .is('deleted_at', null)
    .order('name', { ascending: true })

  if (error) throw error
  return data
}

export async function cambiarSede(authUserId, gymId) {
  const sedes = await listSedes(authUserId)
  const sede = sedes.find((s) => s.id === gymId)

  if (!sede) {
    const err = new Error('No tenés acceso a esa sede')
    err.status = 403
    throw err
  }

  // Solo gym_id: Supabase mezcla las claves de app_metadata, role_id no se pisa.
  const { error } = await supabaseAdmin.auth.admin.updateUserById(authUserId, {
    app_metadata: { gym_id: gymId },
  })
  if (error) throw error

  return sede
}
