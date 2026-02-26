import { Field } from "@/models/Fields/Field";

export const inputFieldsServices: Field[] = [
  {
    label: 'Nombre del servicio (obligatorio)',
    name: 'nombre',
    type: 'string',
    required: true,
    placeholder: 'Ej: Nutrición, Antropometría',
    minLength: 3,
    maxLength: 50,
    regex: /^[a-zA-ZÀ-ÿ\s]+$/,
    inputProps: {
      style: { textTransform: 'capitalize' },
    },
  },
  {
    label: 'Descripción (opcional)',
    name: 'descripcion',
    type: 'string',
    required: false,
    placeholder: 'Ej: Evaluación nutricional inicial',
    maxLength: 200,
  },
  {
    label: 'Duración (obligatorio)',
    name: 'duracion_minutos',
    type: 'select',
    required: true,
    options: [
      { label: '1 hora', value: 60 },
      { label: '2 horas', value: 120 },
      { label: 'Más de 3 horas', value: 180 },
    ],
  },
  {
    label: 'Precio (obligatorio)',
    name: 'precio',
    type: 'number',
    required: true,
    placeholder: 'Ej: 10000',
    regex: /^$|^(0|[1-9]\d{0,4}|100000)$/,
  },
  {
    label: 'Color',
    name: 'color',
    type: 'color',
    required: true,
    placeholder: '#4caf50',
  },
]

/** @deprecated usar inputFieldsServices directamente */
export const getInputFieldsServices = () => inputFieldsServices

export const layoutServices = {
  nombre: { rowStart: 1, colStart: 1, colSpan: 6 },
  descripcion: { rowStart: 1, colStart: 7, colSpan: 6 },
  duracion_minutos: { rowStart: 2, colStart: 1, colSpan: 4 },
  precio: { rowStart: 2, colStart: 5, colSpan: 4 },
  color: { rowStart: 2, colStart: 9, colSpan: 4 },
}
