import { Field } from "@/models/Fields/Field";

export const getInputFieldsClases = (): Field[] => [
    {
        label: 'Nombre de la clase (obligatorio)',
        name: 'nombre',
        type: 'string',
        required: true,
        placeholder: 'Ej: Yoga, Spinning, CrossFit',
        minLength: 3,
        maxLength: 50,
        inputProps: {
            style: { textTransform: 'capitalize' },
        },
    },
    {
        label: 'Descripción',
        name: 'descripcion',
        type: 'string',
        required: false,
        placeholder: 'Descripción de la clase',
        minLength: 0,
        maxLength: 200,
    },
    {
        label: 'Capacidad por defecto (obligatorio)',
        name: 'capacidad_default',
        type: 'number',
        required: true,
        placeholder: 'Ej: 20',
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

export const layoutClases = {
    nombre: { rowStart: 1, colStart: 1, colSpan: 6 },
    descripcion: { rowStart: 1, colStart: 7, colSpan: 6 },
    capacidad_default: { rowStart: 2, colStart: 1, colSpan: 6 },
    color: { rowStart: 2, colStart: 7, colSpan: 6 },
    // Las sesiones se manejarán en una sección especial debajo
}
