import { useSearchAlumnosFromCache } from "@/hooks/alumnos/useSearchAlumnosFromCache";
import { Field } from "@/models/Fields/Field";
import { fechaHoyArgentinaISO, fechaHoyMasUnMesISO } from "@/utils/date/dateUtils";

export const getInputFieldsPagos = ({
    planOptions,
    paymentMethodOptions,
    searchFromCache
}: {
    planOptions: { label: string; value: number }[];
    paymentMethodOptions: { label: string; value: number }[];
    searchFromCache: (gymId: string, q: string) => { label: string; value: any }[];
}): Field[] => [
        {
            label: 'Alumno (obligatorio)',
            name: 'alumno_id',
            type: 'search-select',
            required: true,
            placeholder: 'Busca un alumno por nombre o DNI',
            searchFromCache
        },
        {
            label: 'Plan',
            name: 'plan_id',
            type: 'select',
            options: planOptions,
            required: false,
            placeholder: 'Selecciona el plan',
        },
        {
            label: 'Tipo (opcional)',
            name: 'tipo',
            type: 'select',
            options: [
                { label: 'Mensualidad', value: 'mensualidad' },
                { label: 'Inscripción', value: 'inscripcion' },
                { label: 'Clase suelta', value: 'clase_suelta' },
                { label: 'Otro', value: 'otro' },
            ],
            required: false,
        },
        {
            label: 'Monto (obligatorio)',
            name: 'monto',
            type: 'string',
            required: true,
            placeholder: 'Ej: 12000',
            regex: /^\d+([.,]\d{1,2})?$/,
        },
        {
            label: 'Método de pago (obligatorio)',
            name: 'metodo_de_pago_id',
            type: 'select',
            options: paymentMethodOptions,
            required: true,
            placeholder: 'Selecciona el método de pago',
        },
        {
            label: 'Hora (opcional)',
            name: 'hora',
            type: 'time',
            regex: /^([01]\d|2[0-3]):[0-5]\d$/,
        },
        {
            label: 'Fecha de pago (obligatorio)',
            name: 'fecha_de_pago',
            type: 'date',
            required: true,
            defaultValue: fechaHoyArgentinaISO,
            inputProps: {
                min: fechaHoyArgentinaISO,
                max: fechaHoyArgentinaISO,
            },
            validate: (value: string) => {
                if (value !== fechaHoyArgentinaISO) {
                    return 'La fecha de pago debe ser la de hoy';
                }
                return null;
            }
        },
        {
            label: 'Fecha de vencimiento (opcional)',
            name: 'fecha_de_venc',
            type: 'date',
            required: false,
            defaultValue: fechaHoyMasUnMesISO,
            inputProps: {
                min: fechaHoyArgentinaISO
            }
        },
        {
            label: 'Responsable (opcional)',
            name: 'responsable',
            type: 'string',
            minLength: 3,
            maxLength: 40,
        },
    ];

export const layoutPayments = {
    alumno_id: { rowStart: 1, colStart: 1, colSpan: 6 },
    plan_id: { rowStart: 1, colStart: 7, colSpan: 6 },

    tipo: { rowStart: 2, colStart: 1, colSpan: 4 },
    monto: { rowStart: 2, colStart: 5, colSpan: 4 },
    metodo_de_pago_id: { rowStart: 2, colStart: 9, colSpan: 4 },

    hora: { rowStart: 3, colStart: 1, colSpan: 4 },
    fecha_de_pago: { rowStart: 3, colStart: 5, colSpan: 4 },
    fecha_de_venc: { rowStart: 3, colStart: 9, colSpan: 4 },

    responsable: { rowStart: 4, colStart: 1, colSpan: 12 },

};
