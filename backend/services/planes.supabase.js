import { supabase } from '../db/supabaseClient.js';

export const getPlanes = async ({ gymId } = {}) => {
  let query = supabase
    .from('planes_precios')
    .select('id, nombre, numero_clases, precio, gym_id');

  if (gymId) {
    query = query.eq('gym_id', gymId);
  }

  const { data, error } = await query.order('id', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
};