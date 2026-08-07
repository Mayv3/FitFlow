/** Desglose por metodo de pago dentro de un punto de la serie de facturacion. */
export interface FacturacionMetodo {
  count: number;
  total: number;
}

/**
 * Punto de la serie de /api/stats/dashboard/gyms/:id/facturacion.
 * El monto llega como `monto_centavos` o `monto` segun el rango pedido.
 */
export interface FacturacionPunto {
  fecha: string;
  monto_centavos?: number;
  monto?: number;
  metodos?: Record<string, FacturacionMetodo>;
}

/** Item de un pago en el detalle que abre el click sobre una barra. */
export interface PagoDetalleItem {
  metodo: string;
  monto: number;
}

export interface PagoDetalle {
  id: string | number;
  fecha_de_pago: string;
  alumno_nombre: string;
  monto_total: number;
  items?: PagoDetalleItem[];
}
