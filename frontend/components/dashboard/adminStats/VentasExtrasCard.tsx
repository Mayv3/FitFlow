'use client';

import { useId, useState } from 'react';
import { Box, Card, CardContent, CircularProgress, MenuItem, TextField, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useGymThemeSettings } from '@/hooks/useGymThemeSettings';
import { useVentasExtras, type VentasMes, type VentaTop } from '@/hooks/dashboard/useVentasExtras';
import { InfoTooltip } from '@/components/ui/tooltip/InfoTooltip';
import { YearSelector, useYearState } from './YearSelector';
import type { ChartTooltipProps } from '@/models/Charts/ChartTooltip';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

// Paleta categórica validada (CVD y contraste) para cada modo.
const COLORES = {
  producto: { light: '#2a78d6', dark: '#3987e5' },
  servicio: { light: '#eb6834', dark: '#d95926' },
} as const;

type Tipo = keyof typeof COLORES;

const pesos = (n: number) => `$${Math.round(n).toLocaleString('es-AR')}`;
const pesosCorto = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toLocaleString('es-AR', { maximumFractionDigits: 1 })}M`
    : n >= 1000 ? `$${Math.round(n / 1000)}k`
      : `$${n}`;
const ventasTxt = (n: number) => `${n} ${n === 1 ? 'venta' : 'ventas'}`;

type ColumnaProps = {
  tipo: Tipo;
  titulo: string;
  meses: VentasMes[];
  top: VentaTop[];
  mes: number;
  onMes: (mes: number) => void;
};

function ColumnaVentas({ tipo, titulo, meses, top, mes, onMes }: ColumnaProps) {
  const t = useTheme();
  const headingId = useId();
  const color = COLORES[tipo][t.palette.mode === 'dark' ? 'dark' : 'light'];
  const campoMonto = tipo === 'producto' ? 'productos' : 'servicios';
  const campoVentas = tipo === 'producto' ? 'ventas_productos' : 'ventas_servicios';

  const delPeriodo = mes === 0 ? meses : meses.filter((m) => m.mes === mes);
  const monto = delPeriodo.reduce((s, m) => s + Number(m[campoMonto]), 0);
  const ventas = delPeriodo.reduce((s, m) => s + Number(m[campoVentas]), 0);
  const puntos = meses.map((m) => ({ mes: m.mes, label: MESES[m.mes - 1].slice(0, 3), monto: Number(m[campoMonto]), ventas: Number(m[campoVentas]) }));
  const maxTop = Math.max(1, ...top.map((x) => Number(x.monto)));

  const renderTooltip = ({ active, payload }: ChartTooltipProps) => {
    if (!active || !payload?.length) return null;
    const p = payload[0].payload as (typeof puntos)[number];
    return (
      <Box
        sx={{
          borderRadius: '12px',
          border: `1px solid ${alpha(t.palette.text.primary, 0.08)}`,
          boxShadow: t.shadows[3],
          bgcolor: t.palette.mode === 'dark' ? '#1a1a1a' : t.palette.background.paper,
          px: 1.5, py: 1,
        }}
      >
        <Typography variant="caption" fontWeight={600} color="text.primary">{MESES[p.mes - 1]}</Typography>
        <Typography variant="body2" color="text.secondary">{pesos(p.monto)} · {ventasTxt(p.ventas)}</Typography>
      </Box>
    );
  };

  return (
    <Box component="section" aria-labelledby={headingId} minWidth={0}>
      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
        <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: color }} />
        <Typography id={headingId} variant="subtitle2" color="text.secondary">{titulo}</Typography>
      </Box>

      {ventas === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
          Sin ventas de {titulo.toLowerCase()} en este período.
        </Typography>
      ) : (
        <Box display="flex" alignItems="baseline" gap={1} data-testid="total">
          <Typography variant="h5" fontWeight={700}>{pesos(monto)}</Typography>
          <Typography variant="body2" color="text.secondary">{ventasTxt(ventas)}</Typography>
        </Box>
      )}

      <Box sx={{ width: '100%', height: 160, mt: 1, '& svg': { cursor: 'pointer' } }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={puntos}
            margin={{ top: 4, right: 4, left: -12, bottom: 0 }}
            onClick={(e) => {
              const idx = e?.activeTooltipIndex;
              if (idx == null) return;
              const p = puntos[Number(idx)];
              if (p) onMes(p.mes === mes ? 0 : p.mes);
            }}
          >
            <XAxis dataKey="label" tickLine={false} axisLine={false} interval={0} tick={{ fill: t.palette.text.secondary, fontSize: 11 }} />
            <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={pesosCorto} tick={{ fill: t.palette.text.secondary, fontSize: 11 }} />
            <Tooltip content={renderTooltip} cursor={{ fill: alpha(t.palette.text.primary, 0.04) }} />
            <Bar dataKey="monto" radius={[4, 4, 0, 0]} maxBarSize={22} isAnimationActive={false}>
              {puntos.map((p) => (
                <Cell key={p.mes} fill={mes === 0 || p.mes === mes ? color : alpha(color, 0.3)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>

      {top.length > 0 && (
        <>
          <Typography variant="caption" color="text.secondary" display="block" mt={2} mb={1}>
            Más vendidos {mes === 0 ? 'del año' : `de ${MESES[mes - 1].toLowerCase()}`}
          </Typography>
          <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 1.25 }}>
            {top.map((x) => (
              <Box component="li" key={x.nombre}>
                <Box display="flex" justifyContent="space-between" gap={1}>
                  <Typography variant="body2" noWrap title={x.nombre}>{x.nombre}</Typography>
                  <Typography variant="body2" fontWeight={600} flexShrink={0}>{pesos(Number(x.monto))}</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                  <Box sx={{ flex: 1, height: 4, borderRadius: 2, bgcolor: alpha(t.palette.text.primary, 0.06) }}>
                    <Box sx={{ height: '100%', width: `${(Number(x.monto) / maxTop) * 100}%`, borderRadius: 2, bgcolor: color }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary" flexShrink={0}>{ventasTxt(x.ventas)}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}

export function VentasExtrasCard() {
  const t = useTheme();
  const { borderRadius } = useGymThemeSettings();
  const [year, setYear] = useYearState();
  const [mes, setMes] = useState(0);
  const { data, isLoading, isError } = useVentasExtras(year, mes);

  const meses = data?.meses ?? [];
  const hayVentasEnElAnio = meses.some((m) => Number(m.ventas_productos) + Number(m.ventas_servicios) > 0);

  const renderContenido = () => {
    if (isLoading) {
      return (
        <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={28} />
        </Box>
      );
    }
    if (isError || !data) {
      return <Typography color="error" variant="body2">No se pudieron cargar las ventas.</Typography>;
    }
    if (!hayVentasEnElAnio) {
      return (
        <Typography variant="body2" color="text.secondary">
          No se registraron ventas de productos ni servicios en {year}.
        </Typography>
      );
    }
    return (
      <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={4}>
        <ColumnaVentas tipo="producto" titulo="Productos" meses={meses} top={data.top_productos} mes={mes} onMes={setMes} />
        <ColumnaVentas tipo="servicio" titulo="Servicios" meses={meses} top={data.top_servicios} mes={mes} onMes={setMes} />
      </Box>
    );
  };

  return (
    <Card
      sx={{
        mt: 2,
        borderRadius,
        border: `1px solid ${alpha(t.palette.text.primary, 0.06)}`,
        bgcolor: t.palette.mode === 'dark' ? '#0a0a0a' : t.palette.background.paper,
        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} mb={2}>
          <Box display="flex" alignItems="center">
            <Typography variant="subtitle2" color="text.secondary">Ventas de productos y servicios</Typography>
            <InfoTooltip title="Pagos de productos y servicios (sin contar planes). Cada pago cuenta como una venta, aunque incluya varias unidades. Tocá una barra para ver ese mes; tocala de nuevo para volver al año." />
          </Box>
          <Box display="flex" gap={1}>
            <TextField
              select
              size="small"
              label="Mes"
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value={0}>Todo el año</MenuItem>
              {MESES.map((m, i) => (
                <MenuItem key={m} value={i + 1}>{m}</MenuItem>
              ))}
            </TextField>
            <YearSelector value={year} onChange={(y) => { setYear(y); setMes(0); }} />
          </Box>
        </Box>
        {renderContenido()}
      </CardContent>
    </Card>
  );
}
