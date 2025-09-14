export async function getServiciosPaged(supaClient, { page = 1, limit = 20, q = '' }) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supaClient
    .from('servicios')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .is('deleted_at', null)
    .range(from, to);

  if (q) {
    query = query.or(`nombre.ilike.%${q}%,descripcion.ilike.%${q}%`);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    items: data ?? [],
    total: count ?? 0,
    page,
    limit,
    q,
  };
}

export async function createServicio(supaClient, servicio) {
  const { data, error } = await supaClient
    .from('servicios')
    .insert(servicio)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateServicio(supaClient, id, values) {
  const { data, error } = await supaClient
    .from('servicios')
    .update(values)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteServicio(supaClient, id) {
  const { data, error } = await supaClient
    .from('servicios')
    .update({ deleted_at: new Date().toISOString() }) // soft delete
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}
