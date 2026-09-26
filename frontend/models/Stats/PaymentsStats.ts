/** Fila de la agrupacion por metodo de pago que arma /api/stats/payments. */
export interface PaymentsByMethod {
  metodo: string
  count: number
  monto: number
}

/** Fila de la agrupacion por tipo de pago (plan, servicio, producto…). */
export interface PaymentsByTipo {
  tipo: string
  count: number
  monto: number
}

/** Respuesta de /api/stats/payments: `*Filtrado` es lo que cae dentro del rango pedido. */
export interface PaymentsStats {
  pagosFiltrados: number
  montoFiltrado: number
  byMethod: PaymentsByMethod[]
  byTipo: PaymentsByTipo[]
  range: { fromDate: string | null; toDate: string | null }
}
