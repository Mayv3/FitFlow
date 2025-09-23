import { supabaseAdmin, supabase } from "../db/supabaseClient.js"

export async function listUsers(gymId) {
  let query = supabaseAdmin
    .from("users")
    .select("*")
    .order("id", { ascending: true })

  if (gymId) {
    query = query.eq("gym_id", gymId)
  }

  const { data, error } = await query
  if (error) throw error

  return data ?? []
}

export async function changePasswordService(email, currentPassword, newPassword) {
  try {
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    })

    if (loginError || !loginData.session) {
      return { success: false, error: "Contraseña actual incorrecta", status: 401 }
    }

    const supabaseWithSession = supabase
    supabaseWithSession.auth.setSession({
      access_token: loginData.session.access_token,
      refresh_token: loginData.session.refresh_token,
    })

    const { error: updateError } = await supabaseWithSession.auth.updateUser({
      password: newPassword,
    })

    if (updateError) {
      return { success: false, error: "No se pudo actualizar la contraseña", status: 500 }
    }

    await supabaseWithSession.auth.signOut()

    return { success: true, status: 200 }
  } catch (err) {
    console.error("Service error:", err)
    return { success: false, error: "Error en el servicio", status: 500 }
  }
}
