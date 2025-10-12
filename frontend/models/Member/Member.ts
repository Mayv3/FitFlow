export interface Member {
    id: string;
    nombre: string;
    dni: string;
    email: string;
    telefono: string;
    sexo: string;
    fecha_nacimiento: string;
    clases_pagadas: number;
    clases_realizadas: number;
    plan: string;
    fecha_inicio: string;
    fecha_vencimiento: string;
    gym_id: string;
    plan_id: number | null | undefined | string;
    plan_nombre: string | null;
}