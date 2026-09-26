// Supabase corta cada respuesta en 1000 filas SIN avisar: una query que pasa
// ese número devuelve datos incompletos y los totales salen más bajos que los
// reales. Este helper pide de a `pageSize` hasta traer todo.
//
// `buildQuery` tiene que devolver una query NUEVA en cada llamada y con un
// orden determinístico que termine en una columna única (ej. `.order('id')`):
// sin eso Postgres no garantiza el orden entre páginas y puede repetir o
// saltearse filas.
export async function fetchAllPaged(buildQuery, pageSize = 1000) {
  const out = [];
  let from = 0;
  while (true) {
    const { data, error } = await buildQuery().range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    out.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return out;
}
