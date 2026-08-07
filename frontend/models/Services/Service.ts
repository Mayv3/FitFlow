export interface Service {
    id: string
    gym_id: string
    nombre: string
    descripcion?: string
    duracion_minutos?: number
    precio?: number
    color?: string
    created_at?: string
    updated_at?: string
  }

/**
 * Lo que sale del FormModal al crear un servicio. `precio` viaja como string
 * porque los inputs `type: 'number'` no se castean en el form (solo los
 * select); el backend lo convierte.
 */
export interface ServicePayload {
  nombre: string
  descripcion?: string
  duracion_minutos: number
  precio: number | string
  color: string
}