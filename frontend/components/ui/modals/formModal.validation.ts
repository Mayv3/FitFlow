import React from 'react';
import { Field } from '@/models/Fields/Field';

export function validateField(field: Field, val: any): string | null {
  if (field.required && (val === undefined || val === null || val === '')) {
    return `El campo "${field.label}" es obligatorio.`;
  }
  if (
    field.type === 'string' &&
    field.minLength != null &&
    typeof val === 'string' &&
    val.length < field.minLength
  ) {
    return `El campo "${field.label}" debe tener al menos ${field.minLength} caracteres.`;
  }
  if (field.regex && typeof val === 'string' && !field.regex.test(val)) {
    return `El campo "${field.label}" tiene un formato inválido.`;
  }
  if (field.type === 'number') {
    const n = Number(val);
    if (Number.isNaN(n)) return `El campo "${field.label}" debe ser numérico.`;
    if (field.min != null && n < field.min) return `El campo "${field.label}" debe ser al menos ${field.min}.`;
    if (field.max != null && n > field.max) return `El campo "${field.label}" no debe superar ${field.max}.`;
  }
  if (field.validate) {
    const msg = field.validate(val);
    if (msg) return msg;
  }
  return null;
}

export function validateAllFields<T extends Record<string, any>>(
  fields: Field[],
  values: T
): string | null {
  for (const field of fields) {
    const msg = validateField(field, values[field.name]);
    if (msg) return msg;
  }
  return null;
}

export function getFieldValidationState(
  field: Field,
  val: any,
  externalError: string | undefined
): { isError: boolean; helperText: string } {
  const trimmedVal = typeof val === 'string' ? val.trim() : val;
  const length = String(trimmedVal).length;
  const minLen = field.minLength ?? 0;
  const maxLen = field.maxLength ?? Infinity;

  const isTooShort = field.type === 'string' && length < minLen;
  const isTooLong = field.type === 'string' && field.maxLength != null && length > maxLen;
  const isBelowMin = field.type === 'number' && field.min != null && Number(val) < field.min;
  const isAboveMax = field.type === 'number' && field.max != null && Number(val) > field.max;

  const syncMsg = field.validate?.(val);
  const validationMessage = externalError || syncMsg;
  const isError = !!validationMessage || isTooShort || isTooLong || isBelowMin || isAboveMax;

  const helperText = validationMessage
    ? validationMessage
    : isTooShort
      ? `Mínimo ${minLen} caracteres`
      : isTooLong
        ? `Máximo ${maxLen} caracteres`
        : isBelowMin
          ? `Debe ser al menos ${field.min}`
          : isAboveMax
            ? `No debe superar ${field.max}`
            : '';

  return { isError, helperText };
}

export function computeCellStyle(
  fieldName: string,
  layout: Record<string, any>,
  isMdUp: boolean,
  metodo: string,
  origen?: string
): React.CSSProperties {
  if (!isMdUp) {
    return { gridColumn: `1 / span 12`, minWidth: 0 };
  }

  if (
    ['monto_efectivo', 'monto_mp', 'monto_tarjeta'].includes(fieldName) &&
    (metodo === 'Efectivo' || metodo === 'Mercado Pago' || metodo === 'Tarjeta')
  ) {
    return { gridColumn: '1 / span 12', minWidth: 0 };
  }

  if (fieldName === 'fecha_de_pago' && origen && origen !== 'plan') {
    return { gridColumn: '1 / span 12', minWidth: 0 };
  }

  const lay = layout[fieldName] ?? {};
  return {
    gridColumn:
      lay.colStart != null
        ? `${lay.colStart} / span ${lay.colSpan ?? 1}`
        : `auto / span ${lay.colSpan ?? 1}`,
    gridRow: lay.rowStart != null ? `${lay.rowStart} / span ${lay.rowSpan ?? 1}` : undefined,
    minWidth: 0,
  };
}
