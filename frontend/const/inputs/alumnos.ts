import { notify } from "@/lib/toast";
import { Field } from "@/models/Field";
import { fechaHoyArgentinaISO, fechaHoyMasUnMesISO } from "@/utils/dateUtils";

export const getInputFieldsAlumnos = (validateDniAsync: (dni: string) => Promise<string | null>): Field[] => [
  {
    label: 'Nombre (obligatorio)',
    name: 'nombre',
    type: 'string',
    required: true,
    minLength: 3,
    maxLength: 40,
    placeholder: 'Ingresa un nombre',
    regex: /^[a-zA-ZñÑ\s]*$/,
  },
  {
    label: 'DNI (obligatorio)',
    name: 'dni',
    type: 'string',
    required: true,
    minLength: 7,
    maxLength: 8,
    placeholder: 'Ingresa el DNI',
    regex: /^\d*$/,
    onBlur: async (value: string) => {
      const dni = value.trim();
      if (!dni) return;
      const error = await validateDniAsync(dni);
      if (error) notify.error(error);
    },
  },
  {
    label: 'Email (opcional)',
    name: 'email',
    type: 'email',
    required: false,
    minLength: 5,
    maxLength: 60,
    placeholder: 'Ingresa el Email',
  },
  {
    label: 'Teléfono (opcional)',
    name: 'telefono',
    type: 'string',
    required: false,
    minLength: 8,
    maxLength: 20,
    placeholder: 'Ingresa el teléfono',
    regex: /^\d*$/,
  },
  {
    label: 'Plan (obligatorio)',
    name: 'plan_id',
    type: 'select',
    defaultValue: ['1', '2'],
    required: true,
    placeholder: 'Selecciona el plan',
  },
  {
    label: 'Clases pagadas (obligatorio)',
    name: 'clases_pagadas',
    type: 'string',
    required: true,
    minLength: 1,
    maxLength: 2,
    placeholder: 'Ej: 12',
    regex: /^\d*$/,
  },
  {
    label: 'Clases realizadas (obligatorio)',
    name: 'clases_realizadas',
    type: 'string',
    defaultValue: '0',
    required: true,
    minLength: 1,
    maxLength: 2,
    placeholder: 'Ej: 0',
    regex: /^\d*$/,
  },
  {
    label: 'Fecha de vencimiento (obligatorio)',
    name: 'fecha_de_vencimiento',
    type: 'date',
    defaultValue: fechaHoyMasUnMesISO,
    required: true,
  },
  {
    label: 'Fecha de nacimiento (opcional)',
    name: 'fecha_nacimiento',
    type: 'date',
    defaultValue: fechaHoyArgentinaISO,
    required: false,
  },
  {
    label: 'Fecha de inicio (obligatorio)',
    name: 'fecha_inicio',
    type: 'date',
    defaultValue: fechaHoyArgentinaISO,
    required: true,
  },
];


export const layoutAlumnos = {
  nombre: { rowStart: 1, colStart: 1, colSpan: 6 },
  dni: { rowStart: 1, colStart: 7, colSpan: 6 },
  email: { rowStart: 2, colStart: 1, colSpan: 12 },
  telefono: { rowStart: 3, colStart: 1, colSpan: 6 },
  plan_id: { rowStart: 3, colStart: 7, colSpan: 6 },
  clases_pagadas: { rowStart: 4, colStart: 1, colSpan: 4 },
  clases_realizadas: { rowStart: 4, colStart: 5, colSpan: 4 },
  fecha_de_vencimiento: { rowStart: 4, colStart: 9, colSpan: 4 },
  fecha_nacimiento: { rowStart: 5, colStart: 1, colSpan: 6 },
  fecha_inicio: { rowStart: 5, colStart: 7, colSpan: 6 },
}