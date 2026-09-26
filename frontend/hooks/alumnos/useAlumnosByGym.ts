import { api } from '@/lib/api'
import { AlumnoSimple } from '@/models/Member/Member'
import { FieldValue, SelectOption } from '@/models/Fields/Field'

/**
 * Búsqueda de alumnos para los `search-select` (pagos, turnos). En vez de
 * bajar la lista entera del gym (que se cortaba en 1000 filas), el backend
 * busca por nombre o DNI y devuelve solo los primeros resultados. Sin cache:
 * cada búsqueda va al server, así un alumno recién creado aparece enseguida.
 */
const toOption = (a: AlumnoSimple): SelectOption => ({
  label: `${a.nombre} (${a.dni ?? ''})`,
  value: a.id,
})

export async function searchAlumnoOptions(q: string): Promise<SelectOption[]> {
  const { data } = await api.get<AlumnoSimple[]>('/api/alumnos/simple', {
    params: { q, limit: 20 },
  })
  return (data ?? []).map(toOption)
}

/** Etiqueta del alumno ya elegido (ej. al editar un pago), que puede no estar en la búsqueda actual. */
export async function resolveAlumnoOption(value: FieldValue): Promise<SelectOption | null> {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) return null
  const { data } = await api.get<AlumnoSimple[]>('/api/alumnos/simple', {
    params: { ids: String(id) },
  })
  return data?.[0] ? toOption(data[0]) : null
}
