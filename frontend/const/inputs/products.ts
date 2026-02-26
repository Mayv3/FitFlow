import { Field } from "@/models/Fields/Field";

export const inputFieldsProducts: Field[] = [
  {
    label: 'Nombre del producto (obligatorio)',
    name: 'nombre',
    type: 'string',
    required: true,
    placeholder: 'Ej: Proteína Whey, Creatina',
    minLength: 3,
    maxLength: 100,
    inputProps: {
      style: { textTransform: 'capitalize' },
    },
  },
  {
    label: 'Descripción (opcional)',
    name: 'descripcion',
    type: 'string',
    required: false,
    placeholder: 'Ej: Proteína de suero de leche sabor chocolate',
    maxLength: 500,
  },
  {
    label: 'Categoría (opcional)',
    name: 'categoria',
    type: 'select',
    required: false,
    options: [
      { label: 'Suplementos', value: 'Suplementos' },
      { label: 'Bebidas', value: 'Bebidas' },
      { label: 'Merchandising', value: 'Merchandising' },
      { label: 'Accesorios', value: 'Accesorios' },
      { label: 'Alimentos', value: 'Alimentos' },
      { label: 'Otros', value: 'Otros' },
    ],
  },
  {
    label: 'Precio (obligatorio)',
    name: 'precio',
    type: 'number',
    required: true,
    placeholder: 'Ej: 25000',
    regex: /^$|^(0|[1-9]\d{0,9})$/
  },
  {
    label: 'Stock (obligatorio)',
    name: 'stock',
    type: 'number',
    required: true,
    placeholder: 'Ej: 50',
    regex: /^$|^(0|[1-9]\d{0,5})$/
  },
]

/** @deprecated usar inputFieldsProducts directamente */
export const getInputFieldsProducts = () => inputFieldsProducts

export const layoutProducts = {
  nombre: { rowStart: 1, colStart: 1, colSpan: 6 },
  descripcion: { rowStart: 1, colStart: 7, colSpan: 6 },
  categoria: { rowStart: 2, colStart: 1, colSpan: 4 },
  precio: { rowStart: 2, colStart: 5, colSpan: 4 },
  stock: { rowStart: 2, colStart: 9, colSpan: 4 },
}
