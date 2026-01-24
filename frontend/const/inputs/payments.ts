import { Field } from "@/models/Fields/Field";
import { fechaHoyArgentinaISO, fechaHoyMasUnMesISO, horaActualArgentina } from "@/utils/date/dateUtils";
import Cookies from "js-cookie";

export const getInputFieldsPagos = ({
    planOptions,
    serviceOptions,
    productOptions,
    searchFromCache
}: {
    planOptions: { label: string; value: number }[];
    serviceOptions: { label: string; value: number }[];
    productOptions: { label: string; value: string }[];
    searchFromCache: (gymId: string, q: string) => { label: string; value: any }[];
}): Field[] => [
        {
            label: 'Alumno (obligatorio)',
            name: 'alumno_id',
            type: 'search-select',
            required: true,
            placeholder: 'Busca un alumno por nombre o DNI',
            searchFromCache,
        },
        {
            label: '¿Qué vas a cobrar?',
            name: 'origen_pago',
            type: 'select',
            required: true,
            placeholder: 'Selecciona el tipo de pago',
            options: [
                { label: 'Plan', value: 'plan' },
                { label: 'Servicio', value: 'servicio' },
                { label: 'Producto', value: 'producto' },
            ],
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
            label: 'Servicio',
            name: 'servicio_id',
            type: 'select',
            options: serviceOptions,
            required: false,
            placeholder: 'Selecciona un servicio',
        },
        {
            label: 'Producto',
            name: 'producto_id',
            type: 'select',
            options: productOptions,
            required: false,
            placeholder: 'Selecciona un producto',
        },
        {
            label: 'Tipo (obligatorio)',
            name: 'tipo',
            type: 'select',
            placeholder: 'Selecciona un tipo de pago',
            options: [
                { label: 'Mensualidad', value: 'Mensualidad' },
                { label: 'Inscripción', value: 'Inscripcion' },
                { label: 'Clase suelta', value: 'Clase_suelta' },
                { label: 'Producto', value: 'Producto' },
                { label: 'Otro', value: 'Otro' },
            ],
        },
        {
            label: 'Método de pago',
            name: 'metodo_pago',
            type: 'select',
            required: true,
            options: [
                { label: 'Efectivo', value: 1 },
                { label: 'Tarjeta', value: 2 },
                { label: 'Mercado Pago', value: 3 },
                { label: 'Mixto', value: 4 },
            ],
            placeholder: 'Selecciona un método de pago',
        },
        {
            label: 'Monto en efectivo',
            name: 'monto_efectivo',
            type: 'string',
            placeholder: 'Ej: 1000',
            regex: /^$|^\d+$/,
        },
        {
            label: 'Monto en Mercado Pago',
            name: 'monto_mp',
            type: 'string',
            placeholder: 'Ej: 2000',
            regex: /^$|^\d+$/,
        },
        {
            label: 'Monto en tarjeta',
            name: 'monto_tarjeta',
            type: 'string',
            placeholder: 'Ej: 3000',
            regex: /^$|^\d+$/,
        },
        {
            label: 'Fecha de pago (obligatorio)',
            name: 'fecha_de_pago',
            type: 'date',
            defaultValue: fechaHoyArgentinaISO,
            inputProps: {
                min: fechaHoyArgentinaISO,
                max: fechaHoyArgentinaISO,
            },
        },
        {
            label: 'Fecha de vencimiento (obligatorio)',
            name: 'fecha_de_venc',
            type: 'date',
            defaultValue: fechaHoyMasUnMesISO,
            inputProps: { min: fechaHoyArgentinaISO },
        },
        {
            label: 'Hora (obligatorio)',
            name: 'hora',
            type: 'time',
        },
        {
            label: 'Responsable',
            name: 'responsable',
            defaultValue: Cookies.get('name') ?? '',
            type: 'string',
            minLength: 3,
            maxLength: 40,
        },
    ];

export const layoutPayments = {
    origen_pago: { rowStart: 1, colStart: 1, colSpan: 6 },
    alumno_id: { rowStart: 1, colStart: 7, colSpan: 6 },
    metodo_pago: { rowStart: 2, colStart: 1, colSpan: 6 },
    tipo: { rowStart: 2, colStart: 7, colSpan: 6 },
    plan_id: { rowStart: 3, colStart: 1, colSpan: 12 },
    servicio_id: { rowStart: 3, colStart: 1, colSpan: 12 },
    producto_id: { rowStart: 3, colStart: 1, colSpan: 12 },
    monto_efectivo: { rowStart: 4, colStart: 1, colSpan: 4 },
    monto_mp: { rowStart: 4, colStart: 5, colSpan: 4 },
    monto_tarjeta: { rowStart: 4, colStart: 9, colSpan: 4 },
    fecha_de_pago: { rowStart: 5, colStart: 1, colSpan: 6 },
    fecha_de_venc: { rowStart: 5, colStart: 7, colSpan: 6 },
    responsable: { rowStart: 6, colStart: 1, colSpan: 8 },
    hora: { rowStart: 6, colStart: 9, colSpan: 4 },
};



