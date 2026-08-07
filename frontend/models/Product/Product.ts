export interface Product {
  id: string
  nombre: string
  descripcion?: string
  precio: number
  stock?: number
  categoria?: string
  activo?: boolean
  gym_id: string
}

/**
 * Lo que sale del FormModal al crear un producto. `precio` y `stock` viajan
 * como string porque los inputs `type: 'number'` no se castean en el form
 * (solo los select); el backend los convierte.
 */
export interface ProductPayload {
  nombre: string
  descripcion?: string
  categoria?: string
  precio: number | string
  stock: number | string
}
