import { supabase } from '../db/supabaseClient.js';

export async function getPaymentMethodsService() {
  const { data, error } = await supabase
    .from('metodos_de_pago')
    .select('id, nombre, descripcion')
    .order('nombre', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}