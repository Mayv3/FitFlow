import { supabaseAdmin } from '../db/supabaseClient.js'

export const getGymPlans = async () => {
  const { data, error } = await supabaseAdmin
    .from('gym_plans')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export const getGymPlanById = async (id) => {
  const { data, error } = await supabaseAdmin
    .from('gym_plans')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export const createGymPlan = async (planData) => {
  const { data, error } = await supabaseAdmin
    .from('gym_plans')
    .insert([planData])
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateGymPlan = async (id, planData) => {
  const { data, error } = await supabaseAdmin
    .from('gym_plans')
    .update(planData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteGymPlan = async (id) => {
  const { error } = await supabaseAdmin
    .from('gym_plans')
    .delete()
    .eq('id', id)

  if (error) throw error
}
