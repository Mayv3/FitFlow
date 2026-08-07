/** Alumno dentro de un bucket horario que devuelve la RPC `asistencias_hoy_por_hora`. */
export interface AsistenciaAlumno {
  alumno_id: number;
  nombre: string;
  /** Hora exacta del registro, formato "HH:mm". */
  hora: string;
}

/** Bucket horario. Ojo: `hora` es la hora entera (0-23), no un string como en el alumno. */
export interface AsistenciaPorHora {
  hora: number;
  total: number;
  alumnos?: AsistenciaAlumno[];
}

export interface AsistenciasResumen {
  gym_id: string;
  fecha: string;
  total: number;
  porHora: AsistenciaPorHora[];
}
