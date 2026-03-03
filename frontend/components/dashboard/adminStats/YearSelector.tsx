'use client';

import { useState } from 'react';
import { TextField, MenuItem } from '@mui/material';

export const START_YEAR = 2026;

export function buildYearOptions() {
  const currentYear = new Date().getFullYear();
  const max = Math.max(currentYear, START_YEAR);
  return Array.from({ length: max - START_YEAR + 1 }, (_, i) => START_YEAR + i);
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
