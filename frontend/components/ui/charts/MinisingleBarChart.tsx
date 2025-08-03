'use client';

import { BarChart, Bar, Tooltip, YAxis, ResponsiveContainer } from 'recharts';
import { useTheme } from '@mui/material/styles';

const data = [
  { Plan: 'Plan Libre', valor: 135 },
  { Plan: '2 veces x semana', valor: 58 },
  { Plan: '3 veces x semana', valor: 112 },
  { Plan: '4 veces x semana', valor: 74 },
  { Plan: '5 veces x semana', valor: 39 },
  { Plan: 'Plan Personalizado', valor: 21 },
  { Plan: 'Plan de Rehabilitación', valor: 9 },
];

export const MiniSingleBarChart = () => {
  const theme = useTheme();

  return (
    <ResponsiveContainer width="100%" height={40}>
      <BarChart data={data}>
        <YAxis hide domain={[0, 'dataMax + 10']} />
        <Tooltip
          wrapperStyle={{ zIndex: 9999 }}
          labelFormatter={(_, entry) =>
            entry && entry[0]?.payload?.Plan
              ? `Plan: ${entry[0].payload.Plan}`
              : ''
          }
          formatter={(value) => [`${value}`, 'Cantidad']}
        />
        <Bar
          dataKey="valor"
          fill={theme.palette.primary.main}
          barSize={6}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};
