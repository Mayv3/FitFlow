/** Fila cruda de `mv_planes_dashboard` que expone /api/stats/dashboard/planes. */
export interface PlanStatsRow {
  plan_id: string;
  plan_nombre: string;
  cantidad_alumnos: number;
  facturacion_mes_actual: number;
  facturacion_mes_anterior: number;
  variacion: number;
  is_top5?: boolean;
}

/** Proyeccion que arma el controller para el grafico de distribucion. */
export interface PlanAlumnosRow {
  plan_id: string;
  plan_nombre: string;
  cantidad_alumnos: number;
}

/** Proyeccion que arma el controller para el grafico de facturacion. */
export interface PlanFacturacionRow {
  plan_id: string;
  plan_nombre: string;
  actual: number;
  anterior: number;
  variacion: number;
}

export interface PlanesStats {
  top5: PlanStatsRow[];
  alumnos: PlanAlumnosRow[];
  facturacion: PlanFacturacionRow[];
}
