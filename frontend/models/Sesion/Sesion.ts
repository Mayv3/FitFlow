/** Alumno inscripto en una sesion. `es_fija` distingue el cupo fijo del temporal. */
export interface AlumnoInscripto {
  id: number
  nombre: string
  dni: string
  email?: string
  es_fija?: boolean
}

export interface Sesion {
  id: number
  clase_id: number
  dia_semana: number // 0=Domingo, 1=Lunes, 2=Martes, etc.
  hora_inicio: string // formato "HH:MM"
  hora_fin: string // formato "HH:MM"
  capacidad: number
  capacidad_actual?: number
  /** Proxima fecha en la que cae la sesion, "YYYY-MM-DD". La calcula el backend. */
  fecha_proxima?: string
  alumnos_inscritos?: AlumnoInscripto[]
  deleted_at?: string | null
  created_at?: string
  updated_at?: string
}

/**
 * Valores que sale del FormModal de sesiones. `capacidad` viaja como string
 * porque los inputs `type: 'number'` no se castean en el form (solo los select),
 * y el backend lo convierte.
 */
export interface SesionFormValues {
  dia_semana: number
  hora_inicio: string
  hora_fin: string
  capacidad: number | string
}

export interface Inscripcion {
  id: number
  sesion_id: number
  alumno_id: number
  created_at?: string
}
