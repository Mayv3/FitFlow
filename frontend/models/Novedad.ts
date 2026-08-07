export type NovedadTipo =
  | 'novedad'
  | 'feature'
  | 'promocion'
  | 'evento'
  | 'error'
  | 'fix';

/**
 * Fuente unica de verdad para novedades.
 *
 * Antes vivia duplicada y divergente en 4 lugares (useNovedadesApi, NovedadesList,
 * NovedadesBanner, ManageNovedades), lo que hacia que `data.items` y el estado local
 * fueran dos tipos incompatibles con el mismo nombre.
 *
 * Los campos salen de backend/services/novedades.supabase.js, que hace `select('*')`:
 * ordena por `fecha_publicacion`, filtra `deleted_at is null` y, en la variante por
 * gimnasio, filtra por `fecha_fin`.
 */
export interface Novedad {
  id: number;
  titulo: string;
  descripcion?: string;
  tipo: NovedadTipo;
  activo: boolean;
  fecha_publicacion: string;
  /** Vigencia opcional: null = no expira. Se filtra en la query por gimnasio. */
  fecha_fin?: string | null;
  imagen_url?: string;
  gym_id?: number;
  orden?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

/**
 * Lo que edita el form de ManageNovedades. `activo` es string porque sale de
 * un `<Select>` ('true' | 'false'); el callsite lo normaliza antes de guardar.
 */
export interface NovedadFormValues {
  titulo?: string;
  descripcion?: string;
  tipo?: NovedadTipo | '';
  activo?: string | boolean;
  fecha_publicacion?: string;
  fecha_fin?: string | null;
}
