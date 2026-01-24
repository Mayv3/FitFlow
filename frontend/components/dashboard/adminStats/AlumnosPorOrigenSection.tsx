'use client';

import {
  Card,
  CardContent,
  Typography,
  Box,
  Skeleton,
  MenuItem,
  TextField,
  useMediaQuery,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { useGymThemeSettings } from '@/hooks/useGymThemeSettings';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useState } from 'react';
import { RoundedTooltip } from '@/components/ui/tooltip/InfoTooltip';
import { useAlumnosPorOrigen } from '@/hooks/dashboard/useAlumnosPorOrigen';
import {
  GradientDefs,
  gradientUrl,
  type GradientKey,
} from '@/theme/gradients';

const MONTHS = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
];

type AlumnoOrigenRow = {
  origen: string;
  cantidad: number;
};

const ORDEN_GRADIENTES: GradientKey[] = [
  'activos',
  'altas',
  'inactivos',
  'bajas',
];

export function AlumnosPorOrigenSection() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { borderRadius } = useGymThemeSettings();

  const currentYear = new Date().getFullYear();
  const START_YEAR = 2026;

  const [year, setYear] = useState(
    currentYear < START_YEAR ? START_YEAR : currentYear
  );
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  const { data, isLoading, error } = useAlumnosPorOrigen({ year, month });

  const safeData: AlumnoOrigenRow[] = Array.isArray(data) ? data : [];
  const hasData = safeData.length > 0;

  const total = safeData.reduce((acc, cur) => acc + cur.cantidad, 0);

  const pieData = safeData.map((row) => ({
    ...row,
    porcentaje: total
      ? Number(((row.cantidad / total) * 100).toFixed(1))
      : 0,
  }));

  const years = Array.from(
    { length: currentYear - START_YEAR + 2 },
    (_, i) => START_YEAR + i
  );

  const cardSx = {
    borderRadius,
    border: `1px solid ${alpha(theme.palette.text.primary, 0.06)}`,
    bgcolor: theme.palette.mode === 'dark' ? '#0a0a0a' : theme.palette.background.paper,
    height: '100%',
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
  } as const;

  if (error) {
    return (
      <Box mt={2} textAlign="center">
        <Typography color="error">
          ❌ Error cargando alumnos por origen
        </Typography>
      </Box>
    );
  }

  const EmptyState = (
    <Box
      height={280}
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Typography variant="body2" color="text.secondary">
        Sin datos para el período seleccionado
      </Typography>
    </Box>
  );

  return (
    <Box mt={2}>
      <Box
        display="grid"
        gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }}
        gap={1.5}
      >
        {/* ================= BAR ================= */}
        <Box sx={{ position: 'relative', borderRadius }}>
          <GlowingEffect
            spread={40}
            glow={true}
            disabled={false}
            proximity={64}
            inactiveZone={0.01}
            borderWidth={3}
          />
          <Card sx={{ ...cardSx, position: 'relative' }}>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
                gap={1}
              >
                <Typography variant="subtitle2" color="text.secondary">
                  Alumnos por Origen
                </Typography>

                <Box display="flex" gap={1}>
                  <TextField
                    select
                    size="small"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                  >
                    {years.map((y) => (
                      <MenuItem key={y} value={y}>
                        {y}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    select
                    size="small"
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                  >
                    {MONTHS.map((m) => (
                      <MenuItem key={m.value} value={m.value}>
                        {m.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
              </Box>

              {isLoading ? (
                <Skeleton variant="rectangular" height={280} />
              ) : !hasData ? (
                EmptyState
              ) : (
                <Box sx={{ height: 280 }}>
                  <ResponsiveContainer>
                    <BarChart data={safeData}>
                      <defs>
                        <GradientDefs prefix="origen-bar" />
                      </defs>

                      <CartesianGrid
                        vertical={false}
                        stroke={alpha(theme.palette.text.primary, 0.08)}
                      />
                      <XAxis
                        dataKey="origen"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                      />
                      <YAxis
                        hide={isMobile}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />

                      <Tooltip
                        content={
                          <RoundedTooltip
                            formatter={(entry) =>
                              `${entry.payload.origen}: ${entry.value}`
                            }
                          />
                        }
                        cursor={{
                          fill: alpha(theme.palette.primary.main, 0.06),
                        }}
                      />

                      <Bar dataKey="cantidad" radius={[8, 8, 0, 0]}>
                        {safeData.map((_, i) => (
                          <Cell
                            key={i}
                            fill={gradientUrl(
                              'origen-bar',
                              ORDEN_GRADIENTES[i % ORDEN_GRADIENTES.length]
                            )}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* ================= PIE ================= */}
        <Box sx={{ position: 'relative', borderRadius }}>
          <GlowingEffect
            spread={40}
            glow={true}
            disabled={false}
            proximity={64}
            inactiveZone={0.01}
            borderWidth={3}
          />
          <Card sx={{ ...cardSx, position: 'relative' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" mb={2}>
                Proporción por Origen
              </Typography>

              {isLoading ? (
                <Box display="flex" justifyContent="center">
                  <Skeleton variant="circular" width={180} height={180} />
                </Box>
              ) : !hasData ? (
                EmptyState
              ) : (
                <Box sx={{ height: 280, position: 'relative' }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <defs>
                        <GradientDefs prefix="origen-pie" direction="diagonal" />
                      </defs>

                      <Pie
                        data={pieData}
                        dataKey="porcentaje"
                        nameKey="origen"
                        innerRadius="65%"
                        outerRadius="90%"
                        startAngle={90}
                        endAngle={-270}
                        stroke="transparent"
                      >
                        {pieData.map((_, i) => (
                          <Cell
                            key={i}
                            fill={gradientUrl(
                              'origen-pie',
                              ORDEN_GRADIENTES[i % ORDEN_GRADIENTES.length]
                            )}
                          />
                        ))}
                      </Pie>

                      <Tooltip
                        content={
                          <RoundedTooltip
                            formatter={(entry) =>
                              `${entry.payload.origen}: ${entry.value}%`
                            }
                          />
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <Typography
                    variant="caption"
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      fontWeight: 600,
                    }}
                  >
                    100%
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
