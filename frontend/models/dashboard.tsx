export interface Member {
    id: string;
    Nombre: string;
    DNI: string;
    Email: string;
    Telefono: string;
    Clases_pagadas: number;
    Clases_realizadas: number;
    Fecha_inicio: string;
    Fecha_vencimiento: string;
    Fecha_nacimiento: string;
    Plan: string;
    Profesor_asignado: string;
}

export interface Payment {
    id: string;
    Nombre: string;
    Hora: string;
    Monto: number;
    Metodo_de_Pago: string;
    Fecha_de_Pago: string;
    Fecha_de_Vencimiento: string;
    Responsable: string;
}