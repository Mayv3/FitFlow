export interface Plan {
  id: number
  nombre: string
  numero_clases: number
  precio: number
  gym_id: string
  color?: string | null
  deleted_at?: string | null
}

/**
 * Lo que sale del FormModal al crear un plan. `precio` y `numero_clases`
 * viajan como string porque los inputs `type: 'number'` no se castean en el
 * form (solo los select); el backend los convierte.
 */
export interface PlanPayload {
  nombre: string
  precio: number | string
  numero_clases: number | string
  color: string
  /** Semilla del form, no del plan: marca el origen para la logica de pagos. */
  origen_pago?: string
}