export interface Novedad {
  id: number;
  titulo: string;
  descripcion?: string;
  tipo: 'novedad' | 'feature' | 'promocion' | 'evento' | 'error' | 'fix';
  activo: boolean;
  fecha_publicacion: string;
  imagen_url?: string;
  gym_id?: number;
  orden?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}
