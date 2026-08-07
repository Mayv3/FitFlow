export interface Clase {
  id: number
  nombre: string
  descripcion?: string | null
  capacidad_default: number
  color?: string | null
  gym_id: string
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

/**
 * Sesion tal como la maneja el form. Las sesiones nuevas usan `Date.now()` como
 * id temporal; el codigo distingue las de BD por ser id < 1000000000000.
 */
export interface SesionDraft {
  id: number
  dia_semana: number
  hora_inicio: string
  hora_fin?: string
  capacidad: number
}

/** Lo que ClaseFormModal manda al crear o editar una clase. */
export interface ClasePayload {
  nombre: string
  descripcion: string
  capacidad_default: number
  color: string
  sesiones: Omit<SesionDraft, 'id'>[]
}

/** Clase con sus sesiones ya cargadas (lo que se edita en el modal). */
export interface ClaseConSesiones extends Clase {
  sesiones?: SesionDraft[]
}
