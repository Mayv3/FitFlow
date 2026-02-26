import { Field } from "@/models/Fields/Field";

export const inputFieldsPlans: Field[] = [
    {
        label: 'Nombre del plan (obligatorio)',
        name: 'nombre',
        type: 'string',
        required: true,
        placeholder: 'Ej: Plan Básico',
        minLength: 3,
        maxLength: 50,
        inputProps: {
            style: { textTransform: 'capitalize' },
        },
    },
    {
        label: 'Precio (obligatorio)',
        name: 'precio',
        type: 'number',
        required: true,
        placeholder: 'Ej: 30000',
        regex: /^$|^\d+$/,
    },
    {
        label: 'Número de clases (obligatorio)',
        name: 'numero_clases',
        type: 'number',
        required: true,
        placeholder: 'Ej: 12',
        regex: /^$|^\d+$/,
    },
    {
        label: 'Color',
        name: 'color',
        type: 'color',
        required: true,
        placeholder: '#000000',
    },
]

/** @deprecated usar inputFieldsPlans directamente */
export const getInputFieldsPlans = () => inputFieldsPlans

export const layoutPlans = {
    nombre: { rowStart: 1, colStart: 1, colSpan: 6 },
    precio: { rowStart: 1, colStart: 7, colSpan: 6 },
    numero_clases: { rowStart: 2, colStart: 1, colSpan: 6 },
    color: { rowStart: 2, colStart: 7, colSpan: 6 },

}