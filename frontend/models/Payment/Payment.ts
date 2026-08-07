export interface Payment {
    id: number;
    monto_total: number; // Cambio: monto_total en lugar de monto
    fecha_de_pago: string | Date;
    fecha_de_venc: string | Date;
    responsable: string;
    hora: string;
    tipo: string;
    plan_id: number;
    plan_nombre: string;
    gym_id: string;
    alumno_id: number;
    alumno_nombre?: string;
    /** La columna es `service_id`; algunas respuestas traen el alias `servicio_id`. */
    service_id?: number | null;
    servicio_id?: number | null;
    producto_id?: number | null;
    cantidad_producto?: number | null;
    metodo_legible?: string;
    metodos_legibles?: string[];
    items?: PaymentItem[]; // Array de items de pago
};

export interface PaymentItem {
    monto: number;
    metodo_de_pago_id: number;
    metodo_nombre?: string;
    referencia?: string;
}

/**
 * Lo que sale del FormModal de pagos. Los `monto_*`, ids y cantidades viajan
 * como string porque los inputs `type: 'number'` no se castean en el form
 * (solo los select con options numericas); el callsite hace `Number(...)`.
 */

export interface PaymentFormValues {
    alumno_id?: number | string | null;
    tipo?: string;
    fecha_de_pago?: string | Date;
    fecha_de_venc?: string | Date;
    hora?: string;
    responsable?: string;
    metodo_pago?: number | string;
    monto_efectivo?: number | string;
    monto_tarjeta?: number | string;
    monto_mp?: number | string;
    /** 'plan' | 'servicio' | 'producto': decide que id se manda. */
    origen_pago?: string;
    plan_id?: number | string | null;
    servicio_id?: number | string | null;
    producto_id?: number | string | null;
    cantidad_producto?: number | string | null;
}

/**
 * Pago cargado en el modal de edicion: la fila de la API mas los campos que
 * el form necesita desglosados (montos por metodo, metodo y origen).
 */

export type PaymentFormState = Payment & PaymentFormValues;

/** Cuerpo que se manda a POST/PUT /api/pagos. */
export interface PaymentPayload {
    alumno_id?: number | string | null;
    tipo?: string;
    fecha_de_pago?: string | Date;
    fecha_de_venc?: string | Date;
    hora?: string;
    responsable?: string;
    gym_id?: string;
    items?: PaymentItem[];
    monto_total: number;
    isPlan?: boolean;
    plan_id?: number | string | null;
    service_id?: number | string | null;
    producto_id?: number | string | null;
    cantidad_producto?: number;
}