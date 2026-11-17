/** Tramos de permanencia en meses, en orden: 0-1, 1-3, 3-6, 6-12, 12+. */
export type TramoPermanencia = '0-1' | '1-3' | '3-6' | '6-12' | '12+';

export interface PermanenciaTramo {
  tramo: TramoPermanencia;
  activos: number;
  se_fueron: number;
}

export interface PermanenciaResponse {
  /** Alumnos con al menos un pago de plan. */
  total: number;
  activos: number;
  /** Meses promedio de los que se fueron; null si todavía no se fue nadie. */
  meses_promedio: number | null;
  /** Lo que pagaron en planes, en promedio, los que se fueron; null si no se fue nadie. */
  valor_promedio: number | null;
  tramos: PermanenciaTramo[];
}
