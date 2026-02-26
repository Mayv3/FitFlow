import { Field } from '@/models/Fields/Field';

export function resolveMetodoPago(raw: any): string {
  if (raw === 1 || raw === '1' || raw === 'Efectivo') return 'Efectivo';
  if (raw === 2 || raw === '2' || raw === 'Tarjeta') return 'Tarjeta';
  if (raw === 3 || raw === '3' || raw === 'Mercado Pago') return 'Mercado Pago';
  if (raw === 4 || raw === '4' || raw === 'Mixto') return 'Mixto';
  return '';
}

export function getVisibleFields(
  fields: Field[],
  origen: string | undefined,
  metodo: string
): Field[] {
  return fields.filter(field => {
    const isPagoForm = fields.some(f => f.name === 'origen_pago');

    if (isPagoForm) {
      if (!origen && (field.name === 'plan_id' || field.name === 'servicio_id' || field.name === 'producto_id')) return false;
      if (origen === 'plan' && (field.name === 'servicio_id' || field.name === 'producto_id')) return false;
      if (origen === 'servicio' && (field.name === 'plan_id' || field.name === 'producto_id')) return false;
      if (origen === 'producto' && (field.name === 'plan_id' || field.name === 'servicio_id')) return false;
      if (field.name === 'fecha_de_venc' && origen && origen !== 'plan') return false;
      if (['monto_efectivo', 'monto_mp', 'monto_tarjeta'].includes(field.name)) {
        if (metodo === 'Efectivo') return field.name === 'monto_efectivo';
        if (metodo === 'Mercado Pago') return field.name === 'monto_mp';
        if (metodo === 'Tarjeta') return field.name === 'monto_tarjeta';
        if (metodo === 'Mixto') return true;
        return false;
      }
    }

    return true;
  });
}

export function extractPrecioFromLabel(label: string | undefined, pattern: RegExp): number {
  if (!label) return 0;
  const match = label.match(pattern);
  if (!match) return 0;
  return Number(match[1].replace(/\./g, '').replace(',', '.'));
}

export function applyPrecioToMontos(
  state: Record<string, any>,
  precio: number,
  metodo: string
): Record<string, any> {
  if (precio <= 0) return state;
  const next = { ...state };
  if (metodo === 'Efectivo') next['monto_efectivo'] = String(precio);
  else if (metodo === 'Mercado Pago') next['monto_mp'] = String(precio);
  else if (metodo === 'Tarjeta') next['monto_tarjeta'] = String(precio);
  else if (metodo === 'Mixto') {
    next['monto_efectivo'] = '';
    next['monto_mp'] = '';
    next['monto_tarjeta'] = '';
  }
  return next;
}

export function applyPlanChangeEffects(
  state: Record<string, any>,
  fields: Field[],
  metodo: string
): Record<string, any> {
  const planField = fields.find(f => f.name === 'plan_id');
  const selectedPlan = planField?.options?.find(opt => opt.value === state['plan_id']) as any;
  let next = { ...state };

  if (selectedPlan) {
    next['clases_pagadas'] = String(selectedPlan.numero_clases ?? 0);
    next['clases_realizadas'] = 0;
  } else {
    next['clases_pagadas'] = 0;
    next['clases_realizadas'] = 0;
  }

  const precioPlan = selectedPlan?.precio ?? 0;
  next = applyPrecioToMontos(next, precioPlan, metodo);
  return next;
}

export function applyServicioChangeEffects(
  state: Record<string, any>,
  fields: Field[],
  metodo: string
): Record<string, any> {
  const selectedService = fields
    .find(f => f.name === 'servicio_id')
    ?.options?.find(opt => opt.value === state['servicio_id']);
  const precio = extractPrecioFromLabel(selectedService?.label, /\$\s?([\d.,]+)/);
  return applyPrecioToMontos({ ...state }, precio, metodo);
}

export function applyProductoChangeEffects(
  state: Record<string, any>,
  fields: Field[],
  metodo: string
): Record<string, any> {
  const selectedProduct = fields
    .find(f => f.name === 'producto_id')
    ?.options?.find(opt => opt.value === state['producto_id']);
  const precio = extractPrecioFromLabel(selectedProduct?.label, /\(\$\s?([\d.,]+)\)/);
  return applyPrecioToMontos({ ...state }, precio, metodo);
}

export function applyMetodoPagoChangeEffects(
  state: Record<string, any>,
  newMetodo: string
): Record<string, any> {
  const next = { ...state };
  const total =
    Number(next['monto_efectivo'] || 0) +
    Number(next['monto_mp'] || 0) +
    Number(next['monto_tarjeta'] || 0);

  if (newMetodo === 'Efectivo') {
    next['monto_efectivo'] = total ? String(total) : '';
    next['monto_mp'] = '';
    next['monto_tarjeta'] = '';
  } else if (newMetodo === 'Mercado Pago') {
    next['monto_mp'] = total ? String(total) : '';
    next['monto_efectivo'] = '';
    next['monto_tarjeta'] = '';
  } else if (newMetodo === 'Tarjeta') {
    next['monto_tarjeta'] = total ? String(total) : '';
    next['monto_efectivo'] = '';
    next['monto_mp'] = '';
  } else if (newMetodo === 'Mixto') {
    next['monto_efectivo'] = '';
    next['monto_mp'] = '';
    next['monto_tarjeta'] = '';
  }
  return next;
}
