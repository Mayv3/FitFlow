'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useTheme } from '@mui/material/styles';

const data = [
  { name: 'Done', value: 65 },
  { name: 'Remaining', value: 35 },
];

export const DonutChart = () => {
  const theme = useTheme();
  const color = theme.palette.primary.main;

  return (
    <ResponsiveContainer width={100} height={100}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          startAngle={90}
          endAngle={-270}
          innerRadius={35}
          outerRadius={50}
        >
          <Cell fill={color} />
          <Cell fill="#eee" />
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
};
