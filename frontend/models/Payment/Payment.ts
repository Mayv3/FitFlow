export interface Payment {
    id: number;
    monto: number | string;
    metodo_de_pago_id: number | null;
    metodo_nombre?: string | null
    fecha_de_pago: string | Date | null;
    fecha_de_venc: string | Date | null;
    responsable: string | null;
    hora: string | null;
    tipo: string | null;
    ultimo_plan: string | null;
    gym_id: string;
    alumno_id: number;
  };