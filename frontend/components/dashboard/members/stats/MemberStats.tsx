'use client';

import { MiniLineChart } from '@/components/ui/charts/MiniLineChart';
import { StatCard } from '@/components/ui/cards/StatCard';
import { Box } from '@mui/material';
import { ProgressChart } from '@/components/ui/charts/MiniProgressChart';

import BarChartIcon from '@mui/icons-material/BarChart';
import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

import { useTheme } from '@mui/material/styles';
import { MiniSingleBarChart } from '@/components/ui/charts/MinisingleBarChart';

export const MemberStats = () => {
  const theme = useTheme();
  const iconStyle = { color: theme.palette.primary.main, fontSize: 40 };

  return (
    <Box
      mt={2}
      width='100%'
      display="grid"
      gridTemplateColumns={{
        xs: '1fr',
        sm: 'repeat(2, 1fr)',
        md: 'repeat(3, 1fr)',
      }}
      sx={{
        height: 'auto',
        gap: 2,
      }}

    >
      <StatCard
        title="Miembros activos"
        value="87 / 93"
        icon={<PeopleIcon sx={iconStyle} />}
        chart={<ProgressChart percentage={40} />}
      />

      <StatCard
        title="Asistencias de hoy"
        value="Total: 12"
        icon={<BarChartIcon sx={iconStyle} />}
        chart={<MiniLineChart />}
      />

      <StatCard
        title="Alumnos con plan"
        value="80%"
        icon={<AccessTimeIcon sx={iconStyle} />}
        chart={<MiniSingleBarChart/>}
      />
    </Box>
  );
};
