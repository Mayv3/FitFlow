'use client';

import {
  Card,
  CardContent,
  Typography,
  Box,
  Skeleton,
  useMediaQuery,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { useGymThemeSettings } from '@/hooks/useGymThemeSettings';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  FacturacionTooltip,
  RoundedTooltip,
} from '@/components/ui/tooltip/InfoTooltip';
import { usePlanes } from '@/hooks/dashboard/usePlanes';

export function PlanesSection() {
  const { data, isLoading, error } = usePlanes();
  const t = useTheme();
  const isMobile = useMediaQuery(t.breakpoints.down('sm'));
  const { borderRadius } = useGymThemeSettings();

  const cardSx = {
    borderRadius: borderRadius,
    border: `1px solid ${alpha(t.palette.text.primary, 0.06)}`,
    bgcolor: t.palette.mode === 'dark' ? '#0a0a0a' : t.palette.background.paper,
    height: '100%',
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
  } as const;

  if (isLoading) {
    return (
      <Box
        mt={2}
        display="grid"
        gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr 1fr' }}
        gap={1.5}
      >
        <Card sx={cardSx}>
          <CardContent>
            <Skeleton variant="rectangular" height={360} />
          </CardContent>
        </Card>
        <Card sx={cardSx}>
          <CardContent>
            <Skeleton
              variant="circular"
              width={200}
              height={200}
              sx={{ mx: 'auto', my: 4 }}
            />
          </CardContent>
        </Card>
        <Card sx={cardSx}>
          <CardContent>
            <Skeleton variant="rectangular" height={360} />
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (error) {
    return <Typography color="error">❌ Error cargando planes</Typography>;
  }

  if (!data) return null;

  const top5 = [...(data.top5 ?? [])]
    .sort(
      (a: any, b: any) =>
        Number(b.facturacion_mes_actual ?? 0) -
        Number(a.facturacion_mes_actual ?? 0)
    )
    .slice(0, 5);

  while (top5.length < 5) {
    top5.push({
      plan_id: `empty-${top5.length}`,
      plan_nombre: '—',
      cantidad_alumnos: '—',
      facturacion_mes_actual: '—',
      variacion: '—',
    });
  }

  const alumnos = data.alumnos ?? [];

  const facturacion = (data.facturacion ?? []).map((f: any) => ({
    plan_nombre: f.plan_nombre || '—',
    actual: f.actual !== null ? Number(f.actual) : 0,
    anterior: f.anterior !== null ? Number(f.anterior) : 0,
    variacion: f.variacion !== null ? Number(f.variacion) : 0,
  }));

  // Donut Data
  const donutData = alumnos.map((p: any) => ({
    key: p.plan_id,
    label: p.plan_nombre,
    value: p.cantidad_alumnos,
  }));

  const gradients = [
    ['#FFA45B', '#FF6CA3'],
    ['#1DC8FF', '#1674FF'],
    ['#6B00FF', '#FF30C8'],
    ['#FF0202', '#FFBCBC'],
    ['#00C853', '#B2FF59'],
  ];

  return (
    <Box
      mt={2}
      display="grid"
      gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr 1fr' }}
      gap={1.5}
      alignItems="stretch"
    >
      {/* Top 5 planes */}
      <Box sx={{ position: 'relative', borderRadius }}>
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          borderWidth={3}
        />
        <Card sx={{ ...cardSx, position: 'relative', md: { width: '490px' } }}>
          <CardContent
            sx={{
              height: 360,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography variant="subtitle2" color="text.secondary" mb={2}>
              Top 5 planes más vendidos
            </Typography>
            <Box display="flex" flexDirection="column" gap={1} flex={1}>
              {top5.map((p: any, i: number) => (
                <Box
                  key={p.plan_id}
                  sx={{
                    p: 1.2,
                    borderRadius: 0.5,
                    border: `1px solid ${alpha(t.palette.text.primary, 0.08)}`,
                    bgcolor: alpha(t.palette.primary.main, 0.02),
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                  >
                    {p.plan_nombre}
                  </Typography>
                  <Box textAlign="right">
                    <Typography variant="caption" color="text.secondary">
                      Alumnos: <b>{p.cantidad_alumnos}</b>
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      $ {p.facturacion_mes_actual}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Distribución alumnos por plan */}
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
              Distribución de alumnos por plan
            </Typography>
            <Box sx={{ height: 360 }}>
              <ResponsiveContainer>
                <BarChart
                  data={donutData}
                  barCategoryGap={8}
                  margin={{
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                  }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke={alpha(t.palette.text.primary, 0.08)}
                  />

                  {/* Eje X numérico (cantidad de alumnos) */}
                  <XAxis
                    dataKey="label"
                    tick={false}          // oculta nombres
                    axisLine={false}
                    tickLine={false}
                  />

                  {/* Eje Y con valores */}
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 'auto']}
                    tickFormatter={(v) => v.toLocaleString('es-AR')}
                  />

                  <Tooltip
                    cursor={{ fill: alpha(t.palette.primary.main, 0.06) }}
                    content={
                      <RoundedTooltip
                        formatter={(entry) =>
                          `${Number(entry.value).toLocaleString("es-AR")} alumnos`
                        }
                      />
                    }
                  />



                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF6A00" />
                      <stop offset="100%" stopColor="#FF2D55" />
                    </linearGradient>
                  </defs>

                  <Bar
                    dataKey="value"
                    radius={[8, 8, 0, 0]}
                    fill="url(#barGradient)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Box>



      {/* Facturación actual por plan */}
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
              Facturación por plan (mes actual)
            </Typography>
            <Box sx={{ height: 360 }}>
              <ResponsiveContainer>
                <BarChart
                  data={facturacion}
                  layout="vertical"
                  barCategoryGap={8}
                  margin={{
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: isMobile ? 20 : 0,
                  }}
                >
                  <CartesianGrid
                    horizontal={false}
                    stroke={alpha(t.palette.text.primary, 0.08)}
                  />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 'auto']}
                    tickFormatter={(v) => `$${v.toLocaleString('es-AR')}`}
                  />

                  <YAxis
                    type="category"
                    dataKey="plan_nombre"
                    tick={false}
                    tickLine={false}
                    axisLine={false}
                    width={0}
                  />
                  <Tooltip content={<FacturacionTooltip />} />

                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#FF6A00" />
                      <stop offset="100%" stopColor="#FF2D55" />
                    </linearGradient>
                  </defs>

                  <Bar
                    dataKey="actual"
                    radius={[0, 8, 8, 0]}
                    fill="url(#barGradient)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
