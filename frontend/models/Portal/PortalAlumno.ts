/**
 * Tipos del portal publico del alumno (`/gym/[gymSlug]`). Son las respuestas de
 * `/api/auth/gym-*` y `/api/public/appointments/*`, que arman objetos a medida
 * en el backend y no coinciden con las filas crudas de las tablas.
 */

/** Fila que devuelve POST /api/auth/gym-login y queda guardada en localStorage. */
export interface PortalAlumnoSession {
  id: number
  nombre: string
  dni: string
  email?: string | null
  telefono?: string | null
  fecha_nacimiento?: string | null
  plan_id?: number | null
  gym_id: string
  sexo?: string | null
  fecha_inicio?: string | null
  fecha_de_vencimiento?: string | null
  clases_pagadas?: number | null
  clases_realizadas?: number | null
}

export interface PortalDatosPersonales {
  id: number
  nombre: string
  dni: string
  email?: string | null
  telefono?: string | null
  fecha_nacimiento?: string | null
  sexo?: string | null
}

/** Plan contratado. `duracion_dias` no viene en el select actual, por eso opcional. */
export interface PortalPlan {
  id: number
  nombre: string
  precio: number
  duracion_dias?: number | null
}

export interface PortalMembresia {
  fecha_inicio?: string | null
  fecha_vencimiento?: string | null
  /** `null` cuando el alumno no tiene fecha de vencimiento cargada. */
  dias_restantes: number | null
  estado: 'activo' | 'vencido' | 'inactivo'
  porcentaje_tiempo_usado: number
}

export interface PortalClasesResumen {
  clases_pagadas: number | null
  clases_realizadas: number
  /** `null` cuando el alumno no tiene clases pagadas cargadas. */
  clases_disponibles: number | null
  porcentaje_uso: number
}

/** Pago del historial: el subset de columnas que expone el portal. */
export interface PortalPago {
  id: number
  monto_total: number | null
  fecha_de_pago: string
  fecha_de_venc?: string | null
  tipo?: string | null
  responsable?: string | null
}

/** Plan del catalogo del gym que se muestra en el modal "Planes disponibles". */
export interface PortalPlanDisponible {
  id: number
  nombre: string
  precio: number
  numero_clases: number
  color?: string | null
}

/** Inscripcion del alumno ya aplanada por el backend (clase + sesion + proxima fecha). */
export interface PortalClaseInscrita {
  id: number
  es_fija: boolean
  fecha_inscripcion?: string | null
  clase_nombre: string
  clase_color: string
  dia_semana?: number | null
  hora_inicio?: string | null
  /** "YYYY-MM-DD" de la proxima ocurrencia; `null` si la sesion no tiene dia. */
  proxima_fecha: string | null
}

export interface PortalTotales {
  total_pagado: number
  cantidad_pagos: number
}

/** Respuesta completa de GET /api/auth/gym-alumno/:gym_id/:dni. */
export interface PortalAlumnoInfo {
  datosPersonales: PortalDatosPersonales
  plan: PortalPlan | null
  membresia: PortalMembresia
  clases: PortalClasesResumen
  pagos: PortalPago[]
  planes_disponibles: PortalPlanDisponible[]
  clases_inscritas: PortalClaseInscrita[]
  totales: PortalTotales
}

/** Clase del gym tal como la lista GET /api/public/appointments/gym/:gym_id/services. */
export interface PortalServicio {
  id: number
  nombre: string
  descripcion?: string | null
  capacidad_default?: number | null
  gym_id: string
}

/**
 * Sesion de GET /api/public/appointments/service/:service_id/sessions. Los tres
 * ultimos campos solo vienen cuando se manda `alumno_id` en la query.
 */
export interface PortalSesion {
  id: number
  clase_id: number
  dia_semana: number
  hora_inicio: string
  capacidad: number
  gym_id: string
  /** "YYYY-MM-DD"; `null` si la sesion todavia no tiene proxima fecha calculada. */
  fecha_proxima: string | null
  inscrito?: boolean
  es_fija?: boolean
  cupos_disponibles?: number
}
