'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useTheme } from '@mui/material/styles';
import { Box } from '@mui/material';

const data = [
  { name: 'Activos', value: 87 },
  { name: 'Inactivos', value: 6 },
];

export const MiniPieChart = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 90,
      }}
    >
      <ResponsiveContainer width={80} height={80}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            innerRadius={25}
            outerRadius={35}
            paddingAngle={3}
            isAnimationActive={false}
          >
            <Cell fill={theme.palette.primary.main} />
            <Cell fill={theme.palette.grey[300]} />
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: theme.palette.background.paper,
              border: 'none',
              fontSize: 12,
            }}
            formatter={(value, name) => [`${value}`, name]}
          />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
};
