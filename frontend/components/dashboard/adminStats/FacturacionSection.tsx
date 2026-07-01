'use client';

import { useState } from 'react';
import {
  Card, CardContent, Box, Typography, ToggleButtonGroup, ToggleButton, Chip,
  useMediaQuery, Skeleton, Tooltip as MuiTooltip, TextField, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper,
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
import { useActiveMembersPaymentDetails } from '@/hooks/dashboard/useActiveMembersPaymentDetails';
import { useAbandonosDetails } from '@/hooks/dashboard/useAbandonosDetails';
import { useAltasDetails } from '@/hooks/dashboard/useAltasDetails';
import { useFacturacionChart, type RangoFacturacion } from '@/hooks/dashboard/useFacturacionChart';
import { YearSelector, useYearState, START_YEAR } from './YearSelector';
import Cookies from 'js-cookie';

type Rango = RangoFacturacion;

const fmtARS = (value: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const methodLabel: Record<string, string> = {
  'Mercado pago': 'MP',
  'Mercado Pago': 'MP',
};

const BillingTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  const metodos = d.metodos ?? {};
  const entries = Object.entries(metodos).filter(([_, v]) => (v as any).count > 0);
  return (
    <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'background.paper', boxShadow: 2, fontSize: 12, maxWidth: 240 }}>
      <Typography variant="body2" fontWeight={600} gutterBottom>{label}</Typography>
      <Typography variant="body2" fontWeight={600} color="primary.main">
        Total: {fmtARS(d.facturacion)}
      </Typography>
      {entries.length > 0 && (
        <Box mt={0.5} pt={0.5} sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
          {entries.map(([name, data]: any) => (
            <Box key={name} display="flex" justifyContent="space-between" gap={1}>
              <Typography variant="body2" color="text.secondary">
                {methodLabel[name] ?? name}: {data.count} pago{data.count !== 1 ? 's' : ''}
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {fmtARS(data.total)}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

const formatMonth = (fecha: string) => {
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const month = new Date(fecha + 'T12:00:00').getMonth();
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
  const { borderRadius, primaryColor } = useGymThemeSettings();

  const [range, setRange] = useState<Rango>('12m');
  const [facYear, setFacYear] = useYearState();

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const clampedYear = Math.max(START_YEAR, Math.min(currentYear, 2030));

  const [donutYear, setDonutYear] = useState(clampedYear);
  const [donutMonth, setDonutMonth] = useState(() => {
    if (clampedYear < currentYear) return 12;
    return currentMonth;
  });

  const [barModalOpen, setBarModalOpen] = useState(false);
  const [barPayments, setBarPayments] = useState<any[]>([]);
  const [barFilter, setBarFilter] = useState('TODOS');
  const [barLabel, setBarLabel] = useState('');
  const [barLoading, setBarLoading] = useState(false);

  const methodLabelMap: Record<string, string> = {
    'Mercado pago': 'MP',
    'Mercado Pago': 'MP',
  };

  const handleBarClick = async (data: any) => {
    if (!data?.fecha) return;
    let startDate: string, endDate: string, label: string;

    if (range === '12m') {
      const parts = data.fecha.split('-');
      const year = parts[0], month = parts[1];
      startDate = `${year}-${month}-01`;
      const lastDay = new Date(Number(year), Number(month), 0).getDate();
      endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
      label = formatMonth(data.fecha);
    } else if (range === '30d') {
      startDate = data.fecha;
      endDate = data.fecha;
      label = data.m;
    } else if (range === '7w') {
      const d = new Date(data.fecha + 'T12:00:00');
      const end = new Date(d);
      end.setDate(end.getDate() + 6);
      startDate = data.fecha;
      endDate = end.toISOString().split('T')[0];
      label = `${formatDay(data.fecha)} - ${formatDay(endDate)}`;
    } else {
      const datePart = data.fecha.split('T')[0];
      startDate = datePart;
      endDate = datePart;
      label = data.m;
    }

    setBarLabel(label);
    setBarFilter('TODOS');
    setBarLoading(true);
    setBarModalOpen(true);

    try {
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('token='))
        ?.split('=')[1];
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/stats/dashboard/gyms/${gymId}/facturacion/pagos?startDate=${startDate}&endDate=${endDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error('Error al obtener pagos');
      const json = await res.json();
      setBarPayments(json.items ?? []);
    } catch (e) {
      setBarPayments([]);
    } finally {
      setBarLoading(false);
    }
  };

  const ALL_MONTHS = [
    { value: 1, label: 'Ene' }, { value: 2, label: 'Feb' },
    { value: 3, label: 'Mar' }, { value: 4, label: 'Abr' },
    { value: 5, label: 'May' }, { value: 6, label: 'Jun' },
    { value: 7, label: 'Jul' }, { value: 8, label: 'Ago' },
    { value: 9, label: 'Sep' }, { value: 10, label: 'Oct' },
    { value: 11, label: 'Nov' }, { value: 12, label: 'Dic' },
  ];

  const maxMonth = donutYear < currentYear ? 12 : currentMonth;
  const availableMonths = ALL_MONTHS.filter(m => m.value <= maxMonth);
  const safeMonth = Math.min(donutMonth, maxMonth);

  const { data } = useKpis(donutYear, safeMonth);

  const [activosModalOpen, setActivosModalOpen] = useState(false);
  const [abandonosModalOpen, setAbandonosModalOpen] = useState(false);
  const [altasModalOpen, setAltasModalOpen] = useState(false);
  const { data: activeDetails, isLoading: loadingDetails } = useActiveMembersPaymentDetails(donutYear, safeMonth);
  const { data: abandonosDetails, isLoading: loadingAbandonos } = useAbandonosDetails(donutYear, safeMonth);
  const { data: altasDetails, isLoading: loadingAltas } = useAltasDetails(donutYear, safeMonth);
  const distinctAlumnos = activeDetails?.items
    ? new Set(activeDetails.items.map(p => p.alumno_id)).size
    : 0;

  // Bar: año seleccionado solo para 12m; el resto siempre usa año actual
  const gymId = Cookies.get('gym_id') ?? '';
  const chartYear = range === '12m' ? facYear : currentYear;
  const { data: facturacionData, isLoading: loadingBar } = useFacturacionChart(gymId, chartYear, range, {
    enabled: !!gymId,
  });

  const CHART_HEIGHT = 280;

  const cardSx = {
    borderRadius: 1.5,
    border: `1px solid ${alpha(t.palette.text.primary, 0.06)}`,
    bgcolor: t.palette.mode === 'dark' ? '#0a0a0a' : t.palette.background.paper,
    height: '100%',
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
  } as const;

  // Donut loading/empty state
  if (!data) {
    return (
      <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={1.5} mb={1.5}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Alumnos (estado y movimiento)
              </Typography>
              <InfoTooltip
                title="Este gráfico muestra los alumnos que pagaron (activos), las nuevas altas y los abandonos del mes seleccionado."
                placement="right"
              />
            </Box>
            <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto', my: 4 }} />
            <Box display="flex" justifyContent="space-around" mt={2}>
              {['Activos', 'Altas', 'Abandonos'].map((label) => (
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

  const MONTH_FULL: Record<number, string> = { 1:'Enero', 2:'Febrero', 3:'Marzo', 4:'Abril', 5:'Mayo', 6:'Junio', 7:'Julio', 8:'Agosto', 9:'Septiembre', 10:'Octubre', 11:'Noviembre', 12:'Diciembre' };
  const monthLabel = MONTH_FULL[safeMonth] ?? '';

  const donutExplanations: Record<string, string> = {
    activos: `Alumnos que pagaron al menos una vez en ${monthLabel} ${donutYear}.`,
    altas: `Alumnos que se sumaron en ${monthLabel} ${donutYear}.`,
    bajas: `Alumnos cuya fecha de vencimiento cayó en ${monthLabel} ${donutYear} y no renovaron.`,
  };

  const donutData = [
    {
      key: 'activos', label: 'Activos',
      tooltip: `Alumnos que pagaron en ${monthLabel} ${donutYear}`,
      value: charts?.activos ?? 0,
    },
    { key: 'altas', label: 'Altas', tooltip: `Altas de ${monthLabel} ${donutYear}`, value: charts?.altas_mes ?? 0 },
    {
      key: 'bajas', label: 'Abandonos',
      tooltip: `Alumnos que vencieron en ${monthLabel} ${donutYear} y no renovaron`,
      value: charts?.bajas ?? 0,
    },
  ];

  // Bar data desde useFacturacionChart
  const rawItems: any[] = facturacionData?.items ?? [];
  const barData = rawItems.map((p: any) => {
    const monto = p.monto_centavos ?? p.monto ?? 0;
    let label: string;
    if (range === '12m') {
      label = formatMonth(p.fecha);
    } else if (range === '30d') {
      label = p.fecha ? String(parseInt(p.fecha.slice(8, 10), 10)) : '—';
    } else if (range === '7w') {
      label = formatWeek(p.fecha);
    } else {
      label = p.fecha ? String(p.fecha).slice(11, 16) || String(p.fecha).slice(0, 5) : '—';
    }
    return { m: label, facturacion: monto, metodos: p.metodos ?? {}, fecha: p.fecha };
  });

  const barSizeBase = barData.length >= 28 ? 12 : barData.length >= 14 ? 18 : 28;
  const barSize = isMobile ? Math.max(10, barSizeBase - 6) : barSizeBase;

  return (
    <><Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={1.5} alignItems="stretch" mb={1.5}>
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
                title="Este gráfico muestra los alumnos que pagaron (activos), las nuevas altas y los abandonos del mes seleccionado."
                placement="right"
              />
            </Box>
            <Box display="flex" alignItems="center" justifyContent={{ xs: 'center', sm: 'flex-start' }} gap={1} mb={1}>
              <YearSelector value={donutYear} onChange={(y) => { setDonutYear(y); const newMax = y < currentYear ? 12 : currentMonth; if (donutMonth > newMax) setDonutMonth(newMax); }} />
              <TextField
                select
                size="small"
                value={safeMonth}
                onChange={(e) => setDonutMonth(Number(e.target.value))}
                sx={{ minWidth: 110 }}
              >
                {availableMonths.map((m) => (
                  <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                ))}
              </TextField>
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
              gap={4}
              flexWrap="wrap"
              justifyContent="center"
              sx={{
                '& > :not(:last-child)': {
                  borderRight: '1px solid',
                  borderColor: 'divider',
                  pr: 4,
                },
              }}
            >
              {donutData.map((d, i) => {
                const grads = [
                  'linear-gradient(135deg, #FFA45B, #FF6CA3)',
                  'linear-gradient(135deg, #1DC8FF, #1674FF)',
                  'linear-gradient(135deg, #6B00FF, #FF30C8)',
                  'linear-gradient(135deg, #FF0202FF, #FFBCBCFF)',
                ];
                const isClickable = d.key === 'activos' || d.key === 'bajas' || d.key === 'altas';
                const onClick = isClickable ? () => {
                  if (d.key === 'activos') setActivosModalOpen(true);
                  else if (d.key === 'bajas') setAbandonosModalOpen(true);
                  else if (d.key === 'altas') setAltasModalOpen(true);
                } : undefined;
                return (
                  <MuiTooltip key={d.key} title={donutExplanations[d.key]} arrow>
                    <Box
                      component="span"
                      display="inline-flex"
                      alignItems="center"
                      justifyContent="center"
                      gap={1}
                      onClick={onClick}
                      sx={{
                        cursor: 'pointer',
                        minWidth: { xs: '40%', sm: 'auto' },
                        maxWidth: { xs: '40%', sm: 'none' },
                        flexDirection: { xs: 'column', sm: 'row' },
                        textAlign: { xs: 'center', sm: 'left' },
                        '&:hover': { opacity: 0.75 },
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
          <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3 }}>
            <Box
              display="flex"
              justifyContent={{ xs: 'center', sm: 'space-between' }}
              alignItems="center"
              flexDirection={{ xs: 'column', sm: 'row' }}
              gap={{ xs: 1, sm: 0 }}
              mb={3}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body1" color="text.secondary" fontWeight={500}>Facturación</Typography>
                {range === '12m' && isMobile && (
                  <YearSelector value={facYear} onChange={setFacYear} />
                )}
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                {range === '12m' && !isMobile && (
                  <YearSelector value={facYear} onChange={setFacYear} />
                )}
                <ToggleButtonGroup
                  fullWidth={isMobile}
                  size="small"
                  value={range}
                  exclusive
                  onChange={(_, v) => v && setRange(v)}
                >
                  <ToggleButton value="12m" sx={{ fontSize: '0.9rem', px: 2, py: 0.5 }}>12m</ToggleButton>
                  <ToggleButton value="7w" sx={{ fontSize: '0.9rem', px: 2, py: 0.5 }}>Semana</ToggleButton>
                  <ToggleButton value="30d" sx={{ fontSize: '0.9rem', px: 2, py: 0.5 }}>Día</ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Box>

            <Box sx={{ height: 300 }}>
              {loadingBar ? (
                <Skeleton variant="rectangular" height={300} sx={{ mt: 1 }} />
              ) : (
                <ResponsiveContainer>
                  <BarChart
                    data={barData}
                    barCategoryGap={8}
                    barGap={4}
                    margin={{ top: 0, right: 8, bottom: 0, left: isMobile ? 8 : 48 }}
                  >
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22C55E" />
                        <stop offset="100%" stopColor="#16A34A" />
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
                        tickFormatter={(v) => fmtARS(v as number)}
                        domain={[0, 'auto']}
                      />
                    )}

                    <Tooltip
                      cursor={{ fill: alpha(t.palette.primary.main, 0.06) }}
                      content={<BillingTooltip />}
                    />

                    <Bar dataKey="facturacion" fill="url(#revenueGrad)" radius={[8, 8, 0, 0]} barSize={barSize} onClick={handleBarClick} style={{ cursor: 'pointer' }} />

                  </BarChart>
                </ResponsiveContainer>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>

    <Dialog
      open={activosModalOpen}
      onClose={() => setActivosModalOpen(false)}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
    >
      <Box sx={{ bgcolor: primaryColor, color: '#fff', px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
          Activos - {monthLabel} {donutYear}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ opacity: 0.85 }}>
            {distinctAlumnos} alumno{distinctAlumnos !== 1 ? 's' : ''}
          </Typography>
          <Box component="button" onClick={() => setActivosModalOpen(false)}
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', fontSize: 16, lineHeight: 1, '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' } }}>✕</Box>
        </Box>
      </Box>
      <DialogContent dividers sx={{ p: 0, maxHeight: 380, '&::-webkit-scrollbar': { width: 5 }, '&::-webkit-scrollbar-track': { bgcolor: 'rgba(0,0,0,0.04)' }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,0.25)', borderRadius: 3 }, '&::-webkit-scrollbar-thumb:hover': { bgcolor: 'rgba(0,0,0,0.4)' }, scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,0,0,0.25) rgba(0,0,0,0.04)' }}>
        {loadingDetails ? (
          <Box sx={{ p: 4, textAlign: 'center' }}><Skeleton variant="rectangular" height={200} /></Box>
        ) : (
          <TableContainer component={Paper} elevation={0}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem' }}>Alumno</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem' }}>Fecha</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem' }}>Plan</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem' }} align="right">Monto</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activeDetails?.items.map((p) => (
                  <TableRow key={p.id} sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell sx={{ fontSize: '0.875rem' }}>{p.alumno_nombre}</TableCell>
                    <TableCell sx={{ fontSize: '0.875rem' }}>{formatDay(p.fecha_de_pago)}</TableCell>
                    <TableCell sx={{ fontSize: '0.875rem', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.plan_nombre}</TableCell>
                    <TableCell sx={{ fontSize: '0.875rem', fontWeight: 600 }} align="right">{fmtARS(p.monto_total)}</TableCell>
                  </TableRow>
                ))}
                {(!activeDetails || activeDetails.items.length === 0) && (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>No hay pagos en este período</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
    </Dialog>

    <Dialog
      open={abandonosModalOpen}
      onClose={() => setAbandonosModalOpen(false)}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
    >
      <Box sx={{ bgcolor: primaryColor, color: '#fff', px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
          Abandonos - {monthLabel} {donutYear}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ opacity: 0.85 }}>
            {abandonosDetails?.total ?? 0} alumno{abandonosDetails?.total !== 1 ? 's' : ''}
          </Typography>
          <Box component="button" onClick={() => setAbandonosModalOpen(false)}
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', fontSize: 16, lineHeight: 1, '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' } }}>✕</Box>
        </Box>
      </Box>
      <DialogContent dividers sx={{ p: 0, maxHeight: 380, '&::-webkit-scrollbar': { width: 5 }, '&::-webkit-scrollbar-track': { bgcolor: 'rgba(0,0,0,0.04)' }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,0.25)', borderRadius: 3 }, '&::-webkit-scrollbar-thumb:hover': { bgcolor: 'rgba(0,0,0,0.4)' }, scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,0,0,0.25) rgba(0,0,0,0.04)' }}>
        {loadingAbandonos ? (
          <Box sx={{ p: 4, textAlign: 'center' }}><Skeleton variant="rectangular" height={200} /></Box>
        ) : (
          <TableContainer component={Paper} elevation={0}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem' }}>Alumno</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem' }}>Vencimiento</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem' }}>Plan</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {abandonosDetails?.items.map((a) => (
                  <TableRow key={a.id} sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell sx={{ fontSize: '0.875rem' }}>{a.alumno_nombre}</TableCell>
                    <TableCell sx={{ fontSize: '0.875rem' }}>{formatDay(a.fecha_de_vencimiento)}</TableCell>
                    <TableCell sx={{ fontSize: '0.875rem', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.plan_actual}</TableCell>
                  </TableRow>
                ))}
                {(!abandonosDetails || abandonosDetails.items.length === 0) && (
                  <TableRow><TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>Sin abandonos en este período</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
    </Dialog>

    <Dialog
      open={altasModalOpen}
      onClose={() => setAltasModalOpen(false)}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
    >
      <Box sx={{ bgcolor: primaryColor, color: '#fff', px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
          Altas - {monthLabel} {donutYear}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ opacity: 0.85 }}>
            {altasDetails?.total ?? 0} alta{altasDetails?.total !== 1 ? 's' : ''}
          </Typography>
          <Box component="button" onClick={() => setAltasModalOpen(false)}
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', fontSize: 16, lineHeight: 1, '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' } }}>✕</Box>
        </Box>
      </Box>
      <DialogContent dividers sx={{ p: 0, maxHeight: 380, '&::-webkit-scrollbar': { width: 5 }, '&::-webkit-scrollbar-track': { bgcolor: 'rgba(0,0,0,0.04)' }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,0.25)', borderRadius: 3 }, '&::-webkit-scrollbar-thumb:hover': { bgcolor: 'rgba(0,0,0,0.4)' }, scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,0,0,0.25) rgba(0,0,0,0.04)' }}>
        {loadingAltas ? (
          <Box sx={{ p: 4, textAlign: 'center' }}><Skeleton variant="rectangular" height={200} /></Box>
        ) : (
          <TableContainer component={Paper} elevation={0}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem' }}>Alumno</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem' }}>Fecha de inicio</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem' }}>Plan</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {altasDetails?.items.map((a) => (
                  <TableRow key={a.id} sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell sx={{ fontSize: '0.875rem' }}>{a.alumno_nombre}</TableCell>
                    <TableCell sx={{ fontSize: '0.875rem' }}>{formatDay(a.fecha_inicio)}</TableCell>
                    <TableCell sx={{ fontSize: '0.875rem', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.plan}</TableCell>
                  </TableRow>
                ))}
                {(!altasDetails || altasDetails.items.length === 0) && (
                  <TableRow><TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>Sin altas en este período</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
    </Dialog>

    <Dialog
      open={barModalOpen}
      onClose={() => setBarModalOpen(false)}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 1.5, overflow: 'hidden' } }}
    >
      <Box sx={{ bgcolor: primaryColor, color: '#fff', px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
          Pagos - {barLabel}
        </Typography>
        <Box component="button" onClick={() => setBarModalOpen(false)}
          sx={{ bgcolor: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', fontSize: 16, lineHeight: 1, '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' } }}>✕</Box>
      </Box>
      <Box sx={{ px: 3, pt: 2, pb: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {['TODOS', 'Efectivo', 'Tarjeta', 'MP'].map((f) => (
          <Chip
            key={f}
            label={f}
            size="small"
            onClick={() => setBarFilter(f)}
            color={barFilter === f ? 'primary' : 'default'}
            variant={barFilter === f ? 'filled' : 'outlined'}
          />
        ))}
      </Box>
      <DialogContent dividers sx={{ p: 0, maxHeight: 380, '&::-webkit-scrollbar': { width: 5 }, '&::-webkit-scrollbar-track': { bgcolor: 'rgba(0,0,0,0.04)' }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,0.25)', borderRadius: 3 }, '&::-webkit-scrollbar-thumb:hover': { bgcolor: 'rgba(0,0,0,0.4)' }, scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,0,0,0.25) rgba(0,0,0,0.04)' }}>
        {barLoading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}><Skeleton variant="rectangular" height={200} /></Box>
        ) : (
          <TableContainer component={Paper} elevation={0}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem' }}>Fecha</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem' }}>Alumno</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem' }}>Método</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem' }} align="right">Monto</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {barPayments
                  .filter((p) => {
                    if (barFilter === 'TODOS') return true;
                    return p.items?.some((i: any) => (methodLabelMap[i.metodo] ?? i.metodo) === barFilter);
                  })
                  .map((p) => (
                    <TableRow key={p.id} sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell sx={{ fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                        {formatDay(p.fecha_de_pago)}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.875rem', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.alumno_nombre}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.875rem' }}>
                        {p.items?.map((i: any, idx: number) => (
                          <span key={idx}>
                            {idx > 0 && ' / '}
                            {methodLabelMap[i.metodo] ?? i.metodo}: ${Number(i.monto).toLocaleString('es-AR')}
                          </span>
                        ))}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.875rem', fontWeight: 600 }} align="right">
                        ${Number(p.monto_total).toLocaleString('es-AR')}
                      </TableCell>
                    </TableRow>
                  ))}
                {barPayments.length === 0 && !barLoading && (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>Sin pagos en este período</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
    </Dialog>

    </>
  );
}
