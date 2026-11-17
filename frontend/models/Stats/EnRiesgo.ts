export interface AlumnoEnRiesgo {
  id: number;
  nombre: string;
  dni: string;
  telefono: string | null;
  plan_nombre: string | null;
  ultima_asistencia: string | null;
  /** null si el alumno no tiene asistencias ni fecha de inicio. */
  dias_sin_venir: number | null;
  fecha_de_vencimiento: string;
}

export interface AlumnosEnRiesgoResponse {
  /** false si el gym no cargó asistencias en los últimos 30 días: la lista no significa nada. */
  registra_asistencias: boolean;
  activos: number;
  items: AlumnoEnRiesgo[];
}
