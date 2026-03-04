'use client';

import { useState } from 'react';
import { TextField, MenuItem } from '@mui/material';

export const START_YEAR = 2026;
export const END_YEAR = 2030;

export function buildYearOptions() {
  return Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, i) => START_YEAR + i);
}

export function useYearState() {
  const currentYear = new Date().getFullYear();
  return useState(currentYear < START_YEAR ? START_YEAR : currentYear);
}

interface Props {
  value: number;
  onChange: (year: number) => void;
}

export function YearSelector({ value, onChange }: Props) {
  const years = buildYearOptions();
  return (
    <TextField
      select
      size="small"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      label="Año"
      sx={{ minWidth: 90 }}
    >
      {years.map((y) => (
        <MenuItem key={y} value={y}>{y}</MenuItem>
      ))}
    </TextField>
  );
}
