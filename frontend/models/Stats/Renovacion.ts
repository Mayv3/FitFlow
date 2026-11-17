/** Un mes del año: alumnos cuyo plan vencía ese mes y qué pasó con ellos. */
export interface RenovacionMes {
  mes: number;
  vencieron: number;
  /** Pagaron otro plan a más tardar 7 días después del vencimiento. */
  renovaron: number;
  /** No renovaron y ya pasaron los 7 días. */
  abandonaron: number;
  /** No renovaron todavía pero siguen dentro de los 7 días (o el vencimiento es futuro). */
  pendientes: number;
}
