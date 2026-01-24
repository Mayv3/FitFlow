'use client';

import { useState } from 'react';
import {
  Card, CardContent, Box, Typography, ToggleButtonGroup, ToggleButton, Chip,
  useMediaQuery, Skeleton, Tooltip as MuiTooltip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { useGymThemeSettings } from '@/hooks/useGymThemeSettings';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip as ReTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { InfoTooltip, RoundedTooltip } from '@/components/ui/tooltip/InfoTooltip';
import moment from 'moment';
import { useKpis } from '@/hooks/dashboard/useKpis';

type Rango = '12m' | '30d' | '7w' | '24h';

const fmtARS = (value: number, moneda: 'ARS' | 'USD' = 'ARS') =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: moneda,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const formatMonth = (fecha: string) => {
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const month = new Date(fecha).getMonth();
  return monthNames[month];
};

const formatDay = (fecha: string) => {
  if (!fecha) return "—";
  const f = moment(fecha);
  return f.isValid() ? f.format("DD/MM/YYYY") : "—";
};

const formatWeek = (fecha: string) => {
  if (!fecha) return "—";
  const f = moment(fecha);
  return f.isValid() ? f.format("DD/MM/YYYY") : "—";
};

export function FacturacionSection() {
  const t = useTheme();
  const isMobile = useMediaQuery(t.breakpoints.down('sm'));
  const { borderRadius } = useGymThemeSettings();

  const [range, setRange] = useState<Rango>('12m');
  const { data } = useKpis();

  if (!data) {
    return (
      <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '2fr 3fr' }} gap={1.5} mb={1.5}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Alumnos (estado y movimiento)
              </Typography>
              <InfoTooltip
                title="Este gráfico muestra la distribución de alumnos activos, inactivos, altas y bajas en el período actual."
                placement="right"
              />
            </Box>
            <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto', my: 4 }} />
            <Box display="flex" justifyContent="space-around" mt={2}>
              {['Activos', 'Inactivos', 'Altas', 'Bajas'].map((label) => (
                <Box key={label} textAlign="center">
                  <Skeleton variant="text" width={40} />
                  <Typography variant="body2" color="text.secondary">{label}</Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" mb={2}>
              Facturación
            </Typography>
            <Skeleton variant="rectangular" height={280} />
          </CardContent>
        </Card>
      </Box>
    );
  }

  const charts = data.charts;

  const donutExplanations: Record<string, string> = {
    activos: 'Alumnos con cuota vigente (fecha de vencimiento ≥ hoy).',
    inactivos: 'Alumnos cuya cuota está vencida. Se considera inactivo hasta 10 dias de no pagar.',
    altas: 'Alumnos que se sumaron este mes.',
    bajas: 'Alumnos que no pagaron por más de 10 días desde su última fecha de vencimiento del plan.',
  };

  const donutData = [
    { key: 'activos', label: 'Activos', tooltip: 'Alumnos activos con cuota vigente', value: charts?.activos ?? 0 },
    { key: 'inactivos', label: 'Inactivos', tooltip: 'Alumnos con cuota vencida', value: charts?.inactivos ?? 0 },
    { key: 'altas', label: 'Altas', tooltip: 'Altas de este mes', value: charts?.altas_mes ?? 0 },
    { key: 'bajas', label: 'Bajas', tooltip: 'Bajas (más de 10 días sin pagar)', value: charts?.bajas ?? 0 },
  ];

  const barsByRange: Record<Rango, { m: string; facturacion: number }[]> = {
    '12m': (charts?.por_mes ?? []).map((p: any) => ({ m: formatMonth(p.fecha), facturacion: p.monto_centavos })),
    '30d': (charts?.por_dia ?? []).map((p: any) => ({ m: formatDay(p.fecha), facturacion: p.monto_centavos })),
    '7w': (charts?.por_semana ?? []).map((p: any) => ({ m: formatWeek(p.fecha), facturacion: p.monto_centavos })),
    '24h': (charts?.por_hora ?? []).map((p: any) => ({ m: p.fecha.slice(11, 16), facturacion: p.monto_centavos })),
  };

  const barData = barsByRange[range];
  const CHART_HEIGHT = 280;

  const barSizeBase = barData.length >= 28 ? 12 : barData.length >= 14 ? 18 : 28;
  const barSize = isMobile ? Math.max(10, barSizeBase - 6) : barSizeBase;

  const cardSx = {
    borderRadius: 1.5,
    border: `1px solid ${alpha(t.palette.text.primary, 0.06)}`,
    bgcolor: t.palette.mode === 'dark' ? '#0a0a0a' : t.palette.background.paper,
    height: '100%',
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
  } as const;

  return (
    <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '2fr 3fr' }} gap={1.5} alignItems="stretch" mb={1.5}>
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
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Alumnos (estado y movimiento)
              </Typography>
              <InfoTooltip
                title="Este gráfico muestra la distribución de alumnos activos, inactivos, altas y bajas en el período actual."
                placement="right"
              />
            </Box>

            <Box sx={{ height: CHART_HEIGHT }}>
              <ResponsiveContainer>
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    {[
                      ['#FFA45B', '#FF6CA3'],
                      ['#1DC8FF', '#1674FF'],
                      ['#6B00FF', '#FF30C8'],
                      ['#FF0202FF', '#FFBCBCFF'],
                    ].map(([c1, c2], i) => (
                      <linearGradient key={i} id={`donut-grad-${i}`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={c1} />
                        <stop offset="100%" stopColor={c2} />
                      </linearGradient>
                    ))}
                  </defs>

                  <Pie
                    data={donutData}
                    dataKey="value"
                    nameKey="label"
                    innerRadius="62%"
                    outerRadius="90%"
                    startAngle={90}
                    endAngle={-270}
                    stroke="transparent"
                  >
                    {donutData.map((d, i) => (
                      <Cell key={d.key} fill={`url(#donut-grad-${i})`} />
                    ))}
                  </Pie>

                  <ReTooltip
                    content={
                      <RoundedTooltip
                        formatter={(entry) =>
                          `${entry.payload.tooltip || entry.payload.label}: ${entry.value.toLocaleString("es-AR")}`
                        }
                      />
                    }
                  />

                </PieChart>
              </ResponsiveContainer>
            </Box>

            <Box
              display="flex"
              gap={2}
              flexWrap="wrap"
              justifyContent="center"
            >
              {donutData.map((d, i) => {
                const grads = [
                  'linear-gradient(135deg, #FFA45B, #FF6CA3)',
                  'linear-gradient(135deg, #1DC8FF, #1674FF)',
                  'linear-gradient(135deg, #6B00FF, #FF30C8)',
                  'linear-gradient(135deg, #FF0202FF, #FFBCBCFF)',
                ];
                return (
                  <MuiTooltip key={d.key} title={donutExplanations[d.key]} arrow>
                    <Box
                      component="span"
                      display="inline-flex"
                      alignItems="center"
                      justifyContent="center"
                      gap={1}
                      sx={{
                        cursor: 'help',
                        minWidth: { xs: '45%', sm: 'auto' },
                        maxWidth: { xs: '45%', sm: 'none' },
                        flexDirection: { xs: 'column', sm: 'row' },
                        textAlign: { xs: 'center', sm: 'left' },
                      }}
                    >
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: grads[i],
                          flexShrink: 0,
                        }}
                      />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {d.label}
                        </Typography>
                        <Typography variant="body2" fontWeight={700} display="block">
                          {(d.value ?? 0).toLocaleString('es-AR')}
                        </Typography>
                      </Box>
                    </Box>
                  </MuiTooltip>
                );
              })}
            </Box>

          </CardContent>
        </Card>
      </Box>

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
              justifyContent={{ xs: 'center', sm: 'space-between' }}
              alignItems={{ xs: 'stretch', sm: 'center' }}
              flexDirection={{ xs: 'column', sm: 'row' }}
              gap={{ xs: 1, sm: 0 }}
            >
              <Typography variant="subtitle2" color="text.secondary">Facturación</Typography>
              <Box>
                <ToggleButtonGroup
                  fullWidth={isMobile}
                  size="small"
                  value={range}
                  exclusive
                  onChange={(_, v) => v && setRange(v)}
                >
                  <ToggleButton value="12m"><Chip label="12 meses" size="small" /></ToggleButton>
                  <ToggleButton value="7w">Por semana</ToggleButton>
                  <ToggleButton value="30d">Por día</ToggleButton>
                  <ToggleButton value="24h">24 horas</ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Box>

            <Box sx={{ height: CHART_HEIGHT }}>
              <ResponsiveContainer>
                <BarChart
                  data={barData}
                  barCategoryGap={8}
                  barGap={4}
                  margin={{ top: 0, right: 8, bottom: 0, left: isMobile ? 8 : 48 }}
                >
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF6A00" />
                      <stop offset="100%" stopColor="#FF2D55" />
                    </linearGradient>
                  </defs>

                  <CartesianGrid vertical={false} stroke={alpha(t.palette.text.primary, 0.08)} />

                  <XAxis dataKey="m" tickLine={false} axisLine={false} tickMargin={8}
                    tick={{ fontSize: isMobile ? 10 : 12 }} />

                  {isMobile ? (
                    <YAxis hide domain={[0, 'auto']} />
                  ) : (
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={80}
                      tickMargin={8}
                      tickFormatter={(v) => fmtARS(v as number, data.currency)}
                      domain={[0, 'auto']}
                    />
                  )}

                  <Tooltip
                    cursor={{ fill: alpha(t.palette.primary.main, 0.06) }}
                    content={
                      <RoundedTooltip
                        formatter={(entry) =>
                          `${entry.name}: ${fmtARS(entry.value, data.currency)}`
                        }
                      />
                    }
                  />

                  <Bar dataKey="facturacion" fill="url(#revenueGrad)" radius={[8, 8, 0, 0]} barSize={barSize} />

                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
