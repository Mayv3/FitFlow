import { Field } from "@/models/Fields/Field";

const DIAS_SEMANA = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' },
];

export const getInputFieldsSesiones = (): Field[] => [
    {
        label: 'Día de la semana (obligatorio)',
        name: 'dia_semana',
        type: 'select',
        required: true,
        options: DIAS_SEMANA,
    },
    {
        label: 'Hora de inicio (obligatorio)',
        name: 'hora_inicio',
        type: 'time',
        required: true,
        placeholder: '09:00',
    },
    {
        label: 'Hora de fin (obligatorio)',
        name: 'hora_fin',
        type: 'time',
        required: true,
        placeholder: '10:00',
    },
    {
        label: 'Capacidad máxima (obligatorio)',
        name: 'capacidad',
        type: 'number',
        required: true,
        placeholder: 'Ej: 20',
        regex: /^$|^\d+$/,
    },
]

export const layoutSesiones = {
    dia_semana: { rowStart: 1, colStart: 1, colSpan: 6 },
    hora_inicio: { rowStart: 1, colStart: 7, colSpan: 3 },
    hora_fin: { rowStart: 1, colStart: 10, colSpan: 3 },
    capacidad: { rowStart: 2, colStart: 1, colSpan: 12 },
}

export const getDiaNombre = (dia: number): string => {
    const nombres = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return nombres[dia] ?? '';
}
