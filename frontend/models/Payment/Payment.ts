export interface Payment {
    id: number;
    monto: number | string;
    metodo_de_pago_id: number;
    metodo_nombre?: string | null
    fecha_de_pago: string | Date ;
    fecha_de_venc: string | Date ;
    responsable: string ;
    hora: string ;
    tipo: string ;
    plan_id: number;
    plan_nombre: string;
    gym_id: string;
    alumno_id: number;
  };