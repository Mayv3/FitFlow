'use client';

import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { useTheme } from '@mui/material/styles';

const data = [
  { label: '01/08', value: 10 },
  { label: '02/08', value: 12 },
  { label: '03/08', value: 8 },
  { label: '04/08', value: 15 },
  { label: '05/08', value: 11 },
  { label: '06/08', value: 13 },
  { label: '07/08', value: 9 },
  { label: '08/08', value: 14 },
  { label: '09/08', value: 16 },
  { label: '10/08', value: 10 },
  { label: '11/08', value: 7 },
  { label: '12/08', value: 6 },
  { label: '13/08', value: 12 },
  { label: '14/08', value: 13 },
  { label: '15/08', value: 17 },
];

export const MiniLineChart = () => {
  const theme = useTheme();

  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={data}>
        <XAxis dataKey="label" hide />
        <Line
          type="monotone"
          dataKey="value"
          stroke={theme.palette.primary.main}
          strokeWidth={2}
          dot={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: theme.palette.background.paper,
            border: 'none',
            fontSize: 12,
          }}
          labelFormatter={(label) => `Día: ${label}`}
          formatter={(value) => [`${value} Asistencias`]}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
