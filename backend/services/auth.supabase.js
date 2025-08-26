import { supabase, supabaseAdmin } from '../db/supabaseClient.js'

export async function registerUser({ email, password, dni, gym_id, role_id }) {
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    user_metadata: { dni, gym_id, role_id },
    email_confirm: true
  })
  if (authError) throw authError

  const auth_user_id = authData.user.id

  const { data: insertData, error: insertError } = await supabaseAdmin
    .from('users')
    .insert({ dni, gym_id, role_id, auth_user_id })
    .select('*')
  if (insertError) throw insertError
  if (!insertData?.length) throw new Error('No se pudo insertar el usuario en la tabla users')

  return { user_id: auth_user_id, ...insertData[0] }
}

export async function loginUser({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error

  const { session, user } = data
  if (!session || !user) throw new Error('Error en autenticación: sesión o usuario no disponibles')

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select(`
      id,
      dni,
      gym_id,
      role_id,
      auth_user_id,
      name,
      gyms ( name )
    `)
    .eq('auth_user_id', user.id)
    .single()
  if (profileError) throw profileError

  return { session, profile }
}


export async function logoutUser() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
  return { message: 'Sesión cerrada' }
}
