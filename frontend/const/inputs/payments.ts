import { Field } from "@/models/Fields/Field";
import { fechaHoyArgentinaISO, fechaHoyMasUnMesISO, horaActualArgentina } from "@/utils/date/dateUtils";
import Cookies from "js-cookie";

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
            minLength: 1,
            maxLength: 10,
            regex: /^$|^\d+$/
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
            label: 'Hora (obligatorio)',
            name: 'hora',
            type: 'time',
            regex: /^([01]\d|2[0-3]):[0-5]\d$/,
            defaultValue: horaActualArgentina,
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
            label: 'Responsable',
            name: 'responsable',
            defaultValue: Cookies.get("name") ?? '',
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
