import { supabaseAdmin, supabase } from "../db/supabaseClient.js"

export async function listUsers(gymId) {
  let query = supabaseAdmin
    .from("users")
    .select("id, name, dni, role_id, gym_id, auth_user_id")
    .is("deleted_at", null)
    .order("id", { ascending: true })

  if (gymId) {
    query = query.eq("gym_id", gymId)
  }

  const { data: users, error } = await query
  if (error) throw error

  const { data: allAuth } = await supabaseAdmin.auth.admin.listUsers()

  const enriched = users.map(u => {
    const authUser = allAuth.users.find(a => a.id === u.auth_user_id)
    return {
      ...u,
      email: authUser?.email ?? null,
    }
  })

  return enriched
}

export async function changePasswordService(email, currentPassword, newPassword) {
  try {
    // 1. Verificar contraseña actual (login controlado)
    const { data: loginData, error: loginError } =
      await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      })

    if (loginError || !loginData.user) {
      return {
        success: false,
        status: 401,
        error: "Contraseña actual incorrecta",
      }
    }

    const userId = loginData.user.id

    // 2. Cambiar contraseña con ADMIN (sin sesión)
    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword,
      })

    if (updateError) {
      console.error(updateError)
      return {
        success: false,
        status: 500,
        error: "No se pudo actualizar la contraseña",
      }
    }

    return { success: true, status: 200 }
  } catch (err) {
    console.error("Service error:", err)
    return {
      success: false,
      status: 500,
      error: "Error en el servicio",
    }
  }
}

export async function updateUserRole(userId, newRoleId) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .update({ role_id: newRoleId })
    .eq("id", userId)
    .is("deleted_at", null)
    .select("*")
    .single()

  if (error) throw error
  return data
}

export async function deleteUser(userId) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", userId)
    .select("*")
    .single()

  if (error) throw error
  return data
}