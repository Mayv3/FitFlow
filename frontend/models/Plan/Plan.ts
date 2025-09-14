export interface Plan {
  id: number
  nombre: string
  numero_clases: number
  precio: number
  gym_id: string
  color?: string | null
  deleted_at?: string | null
}