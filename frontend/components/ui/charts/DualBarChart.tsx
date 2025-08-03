'use client';

import {
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useTheme } from '@mui/material/styles';

const data = [
  { name: 'Ene', alumnos: 40, pagos: 30 },
  { name: 'Feb', alumnos: 32, pagos: 28 },
  { name: 'Mar', alumnos: 55, pagos: 50 },
];

export const DualBarChart = () => {
  const theme = useTheme();
  return (
    <ResponsiveContainer width="100%" height={100}>
      <BarChart data={data}>
        <XAxis dataKey="name" />
        <Tooltip />
        <Bar dataKey="alumnos" fill={theme.palette.primary.main} />
        <Bar dataKey="pagos" fill={theme.palette.secondary.main} />
      </BarChart>
    </ResponsiveContainer>
  );
};
