'use client';

import React from 'react';

/**
 * 🎨 Gradientes oficiales del sistema
 */
export const GRADIENTS = {
  activos: {
    from: '#FFA45B',
    to: '#FF6CA3',
  },
  inactivos: {
    from: '#38BDF8',
    to: '#0EA5E9',
  },
  altas: {
    from: '#A855F7',
    to: '#7C3AED',
  },
  bajas: {
    from: '#FB7185',
    to: '#EF4444',
  },
} as const;

export type GradientKey = keyof typeof GRADIENTS;

/**
 * 🔧 LinearGradient reutilizable
 */
export function LinearGradient({
  id,
  from,
  to,
  direction = 'vertical',
}: {
  id: string;
  from: string;
  to: string;
  direction?: 'vertical' | 'diagonal';
}) {
  const coords =
    direction === 'vertical'
      ? { x1: '0', y1: '0', x2: '0', y2: '1' }
      : { x1: '0', y1: '0', x2: '1', y2: '1' };

  return (
    <linearGradient id={id} {...coords}>
      <stop offset="0%" stopColor={from} />
      <stop offset="100%" stopColor={to} />
    </linearGradient>
  );
}

/**
 * 🧩 Genera <defs> con los 4 gradientes
 */
export function GradientDefs({
  prefix,
  direction = 'vertical',
}: {
  prefix: string;
  direction?: 'vertical' | 'diagonal';
}) {
  return (
    <>
      {(Object.keys(GRADIENTS) as GradientKey[]).map((key) => (
        <LinearGradient
          key={key}
          id={`${prefix}-${key}`}
          from={GRADIENTS[key].from}
          to={GRADIENTS[key].to}
          direction={direction}
        />
      ))}
    </>
  );
}

/**
 * 🎯 Helper para obtener el id
 */
export function gradientUrl(prefix: string, key: GradientKey) {
  return `url(#${prefix}-${key})`;
}
