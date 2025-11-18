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
