export interface Sesion {
  id: number
  clase_id: number
  dia_semana: number // 0=Domingo, 1=Lunes, 2=Martes, etc.
  hora_inicio: string // formato "HH:MM"
  hora_fin: string // formato "HH:MM"
  capacidad: number
  capacidad_actual?: number
  alumnos_inscritos?: Array<{
    id: number
    nombre: string
    dni: string
    email?: string
  }>
  deleted_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface Inscripcion {
  id: number
  sesion_id: number
  alumno_id: number
  created_at?: string
}
