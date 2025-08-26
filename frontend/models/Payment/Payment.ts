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