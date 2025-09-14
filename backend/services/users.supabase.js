import { supabaseAdmin } from "../db/supabaseClient.js"

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
