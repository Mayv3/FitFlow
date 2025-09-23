import { supabase, supabaseAdmin } from '../db/supabaseClient.js'

export async function registerUser({ email, password, dni, gym_id, role_id, name }) {
  const { data: authList, error: listError } = await supabaseAdmin.auth.admin.listUsers()
  if (listError) throw listError

  const existingAuthUser = authList?.users?.find(u => u.email === email)

  if (existingAuthUser) {
    // Buscar en tabla users
    const { data: dbUser, error: dbError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("auth_user_id", existingAuthUser.id)
      .single()

    if (dbError && dbError.code !== "PGRST116") throw dbError // salvo "no rows found"

    if (dbUser?.deleted_at) {
      const { data: updatedAuth, error: updateAuthError } =
        await supabaseAdmin.auth.admin.updateUserById(existingAuthUser.id, {
          password,
          user_metadata: { dni, gym_id, role_id, name },
        })
      if (updateAuthError) throw updateAuthError

      const { data: revived, error: reviveError } = await supabaseAdmin
        .from("users")
        .update({
          deleted_at: null,
          dni,
          gym_id,
          role_id,
          name,
        })
        .eq("id", dbUser.id)
        .select("*")
        .single()

      if (reviveError) throw reviveError
      return { user_id: existingAuthUser.id, ...revived }
    }

    throw new Error("Ya existe un usuario registrado con este correo electrónico")
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    user_metadata: { dni, gym_id, role_id, name },
    email_confirm: true,
  })
  if (authError) throw authError

  const auth_user_id = authData.user.id

  const { data: insertData, error: insertError } = await supabaseAdmin
    .from("users")
    .insert({ dni, gym_id, role_id, auth_user_id, name })
    .select("*")
    .single()

  if (insertError) throw insertError

  return { user_id: auth_user_id, ...insertData }
}



export async function loginUser({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    let message = "Ocurrió un error inesperado. Intentalo de nuevo."

    if (error.message === "Invalid login credentials") {
      message = "Correo o contraseña incorrectos"
    } else if (error.message === "Email not confirmed") {
      message = "Tu correo aún no fue confirmado. Revisá tu bandeja de entrada."
    } else if (error.message === "User not found") {
      message = "El usuario no existe"
    } else if (error.message === "Invalid token") {
      message = "El enlace de verificación es inválido o ha expirado"
    } else if (error.message === "Token has expired or is invalid") {
      message = "El enlace de verificación ha expirado o no es válido"
    } else if (error.message === "User already registered") {
      message = "Este correo ya está registrado"
    } else if (error.message === "Email rate limit exceeded") {
      message = "Demasiados intentos. Esperá un momento antes de volver a intentar."
    } else if (error.message === "Password should be at least 6 characters") {
      message = "La contraseña debe tener al menos 6 caracteres"
    }

    throw new Error(message)
  }

  const { session, user } = data
  if (!session || !user) throw new Error("Error en la autenticación: sesión o usuario no disponibles")

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select(`
      id,
      dni,
      gym_id,
      role_id,
      auth_user_id,
      name,
      gyms ( name )
    `)
    .eq("auth_user_id", user.id)
    .single()

  if (profileError) throw new Error("No se pudo obtener el perfil del usuario")

  return { session, profile }
}

export async function logoutUser() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
  return { message: 'Sesión cerrada' }
}

export async function forgotPasswordService(email) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.APP_URL}/reset-password`,
    })

    if (error) {
      return { success: false, error: error.message, status: 400 }
    }

    return { success: true, status: 200 }
  } catch (err) {
    console.error("Service error:", err)
    return { success: false, error: "Error en el servicio", status: 500 }
  }
}

export async function resetPasswordService(access_token, newPassword) {
  try {
    const { error: sessionError } = await supabase.auth.setSession({
      access_token,
      refresh_token: access_token,
    })

    if (sessionError) {
      return { success: false, error: "Token de recuperación inválido o vencido", status: 401 }
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      let msg = error.message
      if (msg.includes("at least 6 characters")) {
        msg = "La contraseña debe tener al menos 6 caracteres."
      }
      return { success: false, error: msg, status: 400 }
    }

    return { success: true, status: 200, message: "Contraseña actualizada correctamente" }
  } catch (err) {
    console.error("Service error:", err)
    return { success: false, error: "Error en el servicio", status: 500 }
  }
}