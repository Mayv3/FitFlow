'use client';

import * as React from 'react';
import {
    Card, CardContent, Box, Typography, ToggleButtonGroup, ToggleButton, Chip,
    useMediaQuery,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
    ResponsiveContainer, PieChart, Pie, Cell, Tooltip as ReTooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { CustomBreadcrumbs } from '@/components/ui/breadcrums/CustomBreadcrumbs';

type Rango = '12m' | '30d' | '7w' | '24h';

type ApiDonut = { activos: number; inactivos: number; altas_mes: number; bajas_mes: number };
type ApiFacturacionPunto = { fecha: string; monto_centavos: number };
type ApiFacturacion = {
    moneda: 'ARS' | 'USD';
    por_mes: ApiFacturacionPunto[];
    por_dia: ApiFacturacionPunto[];
    por_semana: ApiFacturacionPunto[];
    por_hora: ApiFacturacionPunto[];
};

const donutDesdeApi: ApiDonut = { activos: 212, inactivos: 58, altas_mes: 34, bajas_mes: 21 };

// Datos estáticos para evitar problemas de hidratación
const facturacionDesdeApi: ApiFacturacion = {
    moneda: 'ARS',
    por_mes: [
        { fecha: '2025-01-01', monto_centavos: 78000000 },
        { fecha: '2025-02-01', monto_centavos: 83000000 },
        { fecha: '2025-03-01', monto_centavos: 90500000 },
        { fecha: '2025-04-01', monto_centavos: 97200000 },
        { fecha: '2025-05-01', monto_centavos: 104500000 },
        { fecha: '2025-06-01', monto_centavos: 101200000 },
        { fecha: '2025-07-01', monto_centavos: 98000000 },
        { fecha: '2025-08-01', monto_centavos: 106800000 },
        { fecha: '2025-09-01', monto_centavos: 112300000 },
        { fecha: '2025-10-01', monto_centavos: 118900000 },
        { fecha: '2025-11-01', monto_centavos: 125400000 },
        { fecha: '2025-12-01', monto_centavos: 121000000 },
    ],
    por_dia: [
        { fecha: '2025-02-01', monto_centavos: 2500000 },
        { fecha: '2025-02-02', monto_centavos: 3200000 },
        { fecha: '2025-02-03', monto_centavos: 2800000 },
        { fecha: '2025-02-04', monto_centavos: 3500000 },
        { fecha: '2025-02-05', monto_centavos: 2900000 },
        { fecha: '2025-02-06', monto_centavos: 3100000 },
        { fecha: '2025-02-07', monto_centavos: 2700000 },
        { fecha: '2025-02-08', monto_centavos: 3300000 },
        { fecha: '2025-02-09', monto_centavos: 3000000 },
        { fecha: '2025-02-10', monto_centavos: 3400000 },
        { fecha: '2025-02-11', monto_centavos: 2600000 },
        { fecha: '2025-02-12', monto_centavos: 3200000 },
        { fecha: '2025-02-13', monto_centavos: 2800000 },
        { fecha: '2025-02-14', monto_centavos: 3600000 },
        { fecha: '2025-02-15', monto_centavos: 3100000 },
        { fecha: '2025-02-16', monto_centavos: 2900000 },
        { fecha: '2025-02-17', monto_centavos: 3300000 },
        { fecha: '2025-02-18', monto_centavos: 3000000 },
        { fecha: '2025-02-19', monto_centavos: 3500000 },
        { fecha: '2025-02-20', monto_centavos: 2700000 },
        { fecha: '2025-02-21', monto_centavos: 3200000 },
        { fecha: '2025-02-22', monto_centavos: 2800000 },
        { fecha: '2025-02-23', monto_centavos: 3400000 },
        { fecha: '2025-02-24', monto_centavos: 3000000 },
        { fecha: '2025-02-25', monto_centavos: 3100000 },
        { fecha: '2025-02-26', monto_centavos: 2900000 },
        { fecha: '2025-02-27', monto_centavos: 3300000 },
        { fecha: '2025-02-28', monto_centavos: 3200000 },
        { fecha: '2025-03-01', monto_centavos: 3000000 },
        { fecha: '2025-03-02', monto_centavos: 3500000 },
    ],
    por_semana: [
        { fecha: '2025-02-03', monto_centavos: 17000000 },
        { fecha: '2025-02-10', monto_centavos: 19500000 },
        { fecha: '2025-02-17', monto_centavos: 18200000 },
        { fecha: '2025-02-24', monto_centavos: 20100000 },
        { fecha: '2025-03-03', monto_centavos: 18800000 },
    ],
    por_hora: [
        { fecha: '2025-03-03T00:00:00', monto_centavos: 200000 },
        { fecha: '2025-03-03T01:00:00', monto_centavos: 150000 },
        { fecha: '2025-03-03T02:00:00', monto_centavos: 100000 },
        { fecha: '2025-03-03T03:00:00', monto_centavos: 80000 },
        { fecha: '2025-03-03T04:00:00', monto_centavos: 120000 },
        { fecha: '2025-03-03T05:00:00', monto_centavos: 180000 },
        { fecha: '2025-03-03T06:00:00', monto_centavos: 250000 },
        { fecha: '2025-03-03T07:00:00', monto_centavos: 320000 },
        { fecha: '2025-03-03T08:00:00', monto_centavos: 380000 },
        { fecha: '2025-03-03T09:00:00', monto_centavos: 350000 },
        { fecha: '2025-03-03T10:00:00', monto_centavos: 300000 },
        { fecha: '2025-03-03T11:00:00', monto_centavos: 280000 },
        { fecha: '2025-03-03T12:00:00', monto_centavos: 400000 },
        { fecha: '2025-03-03T13:00:00', monto_centavos: 450000 },
        { fecha: '2025-03-03T14:00:00', monto_centavos: 420000 },
        { fecha: '2025-03-03T15:00:00', monto_centavos: 380000 },
        { fecha: '2025-03-03T16:00:00', monto_centavos: 350000 },
        { fecha: '2025-03-03T17:00:00', monto_centavos: 400000 },
        { fecha: '2025-03-03T18:00:00', monto_centavos: 500000 },
        { fecha: '2025-03-03T19:00:00', monto_centavos: 480000 },
        { fecha: '2025-03-03T20:00:00', monto_centavos: 420000 },
        { fecha: '2025-03-03T21:00:00', monto_centavos: 350000 },
        { fecha: '2025-03-03T22:00:00', monto_centavos: 280000 },
        { fecha: '2025-03-03T23:00:00', monto_centavos: 220000 },
    ],
};

const donutData = [
    { key: 'activos', label: 'Activos', value: donutDesdeApi.activos },
    { key: 'inactivos', label: 'Inactivos', value: donutDesdeApi.inactivos },
    { key: 'altas', label: 'Altas', value: donutDesdeApi.altas_mes },
    { key: 'bajas', label: 'Bajas', value: donutDesdeApi.bajas_mes },
];

const fmtARS = (cents: number, moneda: 'ARS' | 'USD' = 'ARS') =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: moneda }).format(cents / 100);

// Función para formatear fechas de manera consistente
const formatMonth = (fecha: string) => {
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const month = new Date(fecha).getMonth();
    return monthNames[month];
};

const formatDay = (fecha: string) => {
    return new Date(fecha).getDate().toString().padStart(2, '0');
};

const formatWeek = (fecha: string) => {
    const date = new Date(fecha);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `Sem ${day}/${month}`;
};

const barsByRange: Record<Rango, { m: string; revenue: number }[]> = {
    '12m': facturacionDesdeApi.por_mes.map(p => ({ m: formatMonth(p.fecha), revenue: p.monto_centavos })),
    '30d': facturacionDesdeApi.por_dia.map(p => ({ m: formatDay(p.fecha), revenue: p.monto_centavos })),
    '7w': facturacionDesdeApi.por_semana.map(p => ({ m: formatWeek(p.fecha), revenue: p.monto_centavos })),
    '24h': facturacionDesdeApi.por_hora.map(p => ({ m: p.fecha.slice(11, 16), revenue: p.monto_centavos })),
};

export function FacturacionSection() {
    const t = useTheme();
    const isMobile = useMediaQuery(t.breakpoints.down('sm'));

    const [range, setRange] = React.useState<Rango>('12m');
    const barData = barsByRange[range];
    const CHART_HEIGHT = 280;

    const barSizeBase = barData.length >= 28 ? 12 : barData.length >= 14 ? 18 : 28;
    const barSize = isMobile ? Math.max(10, barSizeBase - 6) : barSizeBase;

    const cardSx = {
        borderRadius: 2,
        border: `1px solid ${alpha(t.palette.text.primary, 0.06)}`,
        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
        bgcolor: t.palette.background.paper,
        height: '100%',
    } as const;

    return (
        <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '2fr 3fr' }} gap={1.5} alignItems="stretch" mb={1.5}>
            <Card sx={cardSx}>
                <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">Alumnos (estado y movimiento)</Typography>

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
                                    cornerRadius={14}
                                    paddingAngle={-20}
                                    stroke="transparent"
                                >
                                    {donutData.map((d, i) => (
                                        <Cell key={d.key} fill={`url(#donut-grad-${i})`} />
                                    ))}
                                </Pie>

                                <ReTooltip formatter={(v: any, _n: any, p: any) => [String(v), p.payload.label]} />
                            </PieChart>
                        </ResponsiveContainer>
                    </Box>

                    <Box display="flex" gap={3} flexWrap="wrap" justifyContent="center">
                        {donutData.map((d, i) => {
                            const grads = [
                                'linear-gradient(135deg, #FFA45B, #FF6CA3)',
                                'linear-gradient(135deg, #1DC8FF, #1674FF)',
                                'linear-gradient(135deg, #6B00FF, #FF30C8)',
                                'linear-gradient(135deg, #FF0202FF, #FFBCBCFF)',
                            ];
                            return (
                                <Box key={d.key} display="flex" alignItems="center" gap={2}>
                                    <Box sx={{ width: 20, height: 20, borderRadius: '50%', background: grads[i] }} />
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">{d.label}</Typography>
                                        <Typography variant="body2" fontWeight={700} display="block">
                                            {d.value.toLocaleString('es-AR')}
                                        </Typography>
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>
                </CardContent>
            </Card>

            <Card sx={cardSx}>
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
                                <ToggleButton value="12m">
                                    <Chip label="12 meses" size="small" />
                                </ToggleButton>
                                <ToggleButton value="30d">Por día</ToggleButton>
                                <ToggleButton value="7w">Por semana</ToggleButton>
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
                                margin={{ top: 0, right: 8, bottom: 0, left: isMobile ? 8 : 48 }}  // menos margen si ocultamos Y
                            >
                                <defs>
                                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#FF6A00" />
                                        <stop offset="100%" stopColor="#FF2D55" />
                                    </linearGradient>
                                </defs>

                                <CartesianGrid vertical={false} stroke={alpha(t.palette.text.primary, 0.08)} />

                                <XAxis
                                    dataKey="m"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    tick={{ fontSize: isMobile ? 10 : 12 }}
                                />

                                {/* YAxis: oculto en mobile para ganar ancho */}
                                {isMobile ? (
                                    <YAxis hide domain={[0, 'auto']} />
                                ) : (
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        width={80}
                                        tickMargin={8}
                                        tickFormatter={(v) => fmtARS(v as number, facturacionDesdeApi.moneda)}
                                        domain={[0, 'auto']}
                                    />
                                )}

                                <Tooltip
                                    cursor={{ fill: alpha(t.palette.primary.main, 0.06) }}
                                    formatter={(v: any) => [fmtARS(v, facturacionDesdeApi.moneda), 'Facturación']}
                                />

                                <Bar dataKey="revenue" fill="url(#revenueGrad)" radius={[8, 8, 8, 8]} barSize={barSize} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}
