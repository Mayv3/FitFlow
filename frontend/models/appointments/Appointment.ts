import { EventInput } from '@fullcalendar/core'

export type Turno = EventInput & {
  id: string
  titulo: string
  servicio_id: number | string
  profesional: string
  alumno_id: number | string
  color?: string
}
