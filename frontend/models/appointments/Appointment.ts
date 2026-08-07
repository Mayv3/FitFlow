import { EventInput } from '@fullcalendar/core'

export type Turno = EventInput & {
  id: string
  titulo: string
  servicio_id: number | string
  profesional: string
  alumno_id: number | string
  color?: string
}

/** Fila cruda de /api/turnos, antes de mapearla a evento de FullCalendar. */
export interface TurnoRow {
  id: number | string
  titulo?: string | null
  inicio_at: string
  fin_at: string
  color?: string | null
  gym_id: string
  profesional?: string | null
  alumno_id?: number | null
  servicio_id?: number | null
  descripcion?: string | null
  precio?: number | null
}

/** Evento de FullCalendar tal como lo arma `useAppointments`. */
export interface TurnoEvent extends EventInput {
  id: string
  title: string
  start: string
  end: string
  color: string
  extendedProps: {
    gym_id: string
    profesional: string
    alumno_id: number | null
    servicio_id: number | null
    descripcion: string
    precio: number
  }
}

/**
 * Lo que sale del FormModal de turnos. `emails` es el campo multivaluado que
 * solo usa el link de Google Calendar, no viaja al backend.
 */
export interface TurnoFormValues {
  titulo?: string
  servicio_id?: number | string | null
  profesional?: string
  alumno_id?: number | string | null
  inicio_at?: string
  fin_at?: string
  color?: string
  emails?: string[]
  /** Semilla del form: la logica de pagos del FormModal la espera. */
  origen_pago?: string
}
