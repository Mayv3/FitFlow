import DataLoader from 'dataloader'
import { supabase } from '../db/supabaseClient.js'

/**
 * Función de batch que recibe un array de DNIs y devuelve
 * los registros de alumnos en el mismo orden.
 */

async function batchLoadAlumnos(dnis) {
  console.log('▶️ batchLoadAlumnos con estos DNIs:', dnis);
  const { data: alumnos, error } = await supabase
    .from('alumnos')
    .select('*')
    .in('dni', dnis);

  if (error) throw error;
  const lookup = new Map(alumnos.map(a => [a.dni, a]));
  return dnis.map(dni => lookup.get(dni) || null);
}
export function buildAlumnosLoader() {
  return new DataLoader(batchLoadAlumnos, {
    maxBatchSize: 300,
    cache: true
  })
}
