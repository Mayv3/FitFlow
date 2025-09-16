'use client';

import * as React from 'react';
import {
    Card, CardContent, Box, Typography, Chip, Avatar, Stack, LinearProgress,
    useMediaQuery, List, ListItem, ListItemAvatar, ListItemText, Divider,
    Select,
    MenuItem
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
    ResponsiveContainer, PieChart, Pie, Cell, Tooltip as ReTooltip
} from 'recharts';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';

type Pago = {
    id: string;
    alumno: string;
    plan: string;
    monto_centavos: number;
    medio: 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'MercadoPago';
    fecha_iso: string; // ISO
    estado: 'Confirmado' | 'Pendiente' | 'Rechazado';
};

type Vencimiento = {
    id: string;
    alumno: string;
    plan: string;
    vence_iso: string;
    dias: number;
};

const fmtARS = (cents: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(cents / 100);

const pagosMock: Pago[] = [
    { id: 'p1', alumno: 'Agustina R.', plan: 'Mensual Full', monto_centavos: 2500000, medio: 'Tarjeta', fecha_iso: '2025-03-03T10:30:00.000Z', estado: 'Confirmado' },
    { id: 'p2', alumno: 'Lucas P.', plan: 'Mensual Musculación', monto_centavos: 2200000, medio: 'Efectivo', fecha_iso: '2025-03-03T08:30:00.000Z', estado: 'Confirmado' },
    { id: 'p3', alumno: 'Camila S.', plan: 'Pase 8 clases', monto_centavos: 1800000, medio: 'Transferencia', fecha_iso: '2025-03-03T04:30:00.000Z', estado: 'Pendiente' },
    { id: 'p4', alumno: 'Diego V.', plan: 'Mensual Full', monto_centavos: 2500000, medio: 'MercadoPago', fecha_iso: '2025-03-02T10:30:00.000Z', estado: 'Confirmado' },
    { id: 'p5', alumno: 'Nahir T.', plan: 'Mensual Funcional', monto_centavos: 2100000, medio: 'Tarjeta', fecha_iso: '2025-03-01T10:30:00.000Z', estado: 'Confirmado' },
];

const topPlanesMock = [
    { name: 'Mensual Full', value: 65, alumnos: 88, ventas: 120 },
    { name: 'Funcional', value: 45, alumnos: 54, ventas: 85 },
    { name: 'Musculación', value: 35, alumnos: 42, ventas: 70 },
    { name: 'Pase 8 clases', value: 22, alumnos: 30, ventas: 50 },
];



const vencimientosMock: Vencimiento[] = [
    { id: 'v1', alumno: 'Brenda C.', plan: 'Mensual Full', vence_iso: '2025-03-05', dias: 2 },
    { id: 'v2', alumno: 'Matías G.', plan: 'Musculación', vence_iso: '2025-03-07', dias: 4 },
    { id: 'v3', alumno: 'Sofía L.', plan: 'Funcional', vence_iso: '2025-03-04', dias: 1 },
    { id: 'v4', alumno: 'Tomás R.', plan: 'Pase 8 clases', vence_iso: '2025-03-09', dias: 6 },
    { id: 'v5', alumno: 'Evelyn A.', plan: 'Mensual Full', vence_iso: '2025-03-02', dias: -1 }, // vencido ayer
];

const ringColors = [
    ['#FFA45B', '#FF6CA3'],
    ['#1DC8FF', '#1674FF'],
    ['#6B00FF', '#FF30C8'],
    ['#FFDD00', '#FF8800'],
];

const timeAgo = (iso: string) => {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `hace ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs} h`;
    const days = Math.floor(hrs / 24);
    return `hace ${days} d`;
};

export function AlumnosSection() {
    const t = useTheme();
    const isMobile = useMediaQuery(t.breakpoints.down('sm'));

    const cardSx = {
        borderRadius: 2,
        border: `1px solid ${alpha(t.palette.text.primary, 0.06)}`,
        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
        bgcolor: t.palette.background.paper,
        height: '100%',
    } as const;

    return (
        <Box
            display="grid"
            gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr 1fr' }}
            gap={1.5}
            alignItems="stretch"
            mb={1.5}
        >
            <Card sx={{ ...cardSx, display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Últimos pagos
                    </Typography>

                    <List
                        disablePadding
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            flex: 1,
                            minHeight: 0,
                            justifyContent: 'space-between'
                        }}
                    >
                        {pagosMock.map((p) => (
                            <ListItem
                                key={p.id}
                                sx={{ px: 3.5, py: 2.5, border: '1px solid #0001', borderRadius: '20px' }}
                                secondaryAction={<Chip size="small" label={p.medio} />}
                            >
                                <ListItemAvatar>
                                    <Avatar sx={{ width: 34, height: 34 }}>
                                        {p.alumno.charAt(0)}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Typography fontWeight={600}>{p.alumno}</Typography>
                                            <Typography variant="body2" color="text.secondary">• {p.plan}</Typography>
                                        </Box>
                                    }
                                    secondary={
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Typography variant="body2">{fmtARS(p.monto_centavos)}</Typography>
                                            <Typography variant="caption" color="text.secondary">{timeAgo(p.fecha_iso)}</Typography>
                                        </Box>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                </CardContent>
            </Card>

            <Card sx={cardSx}>
                <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Planes más vendidos
                    </Typography>

                    <Box sx={{ height: 280 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <defs>
                                    {ringColors.map(([c1, c2], i) => (
                                        <linearGradient key={i} id={`ring-${i}`} x1="0" y1="0" x2="1" y2="1">
                                            <stop offset="0%" stopColor={c1} />
                                            <stop offset="100%" stopColor={c2} />
                                        </linearGradient>
                                    ))}
                                </defs>

                                {topPlanesMock.map((p, idx) => (
                                    <Pie
                                        key={p.name}
                                        data={[{ name: p.name, value: p.value }, { name: 'resto', value: 100 - p.value }]}
                                        dataKey="value"
                                        startAngle={90}
                                        endAngle={-270}
                                        innerRadius={60 + idx * 18}
                                        outerRadius={72 + idx * 18}
                                        paddingAngle={2}
                                        cornerRadius={20}
                                        stroke="transparent"
                                    >
                                        <Cell fill={`url(#ring-${idx % ringColors.length})`} />
                                        <Cell fill={alpha('#000', 0.06)} />
                                    </Pie>
                                ))}

                                <ReTooltip formatter={(v: any, _n: any, p: any) => [`${p.payload.name}: ${v}%`, '']} />
                            </PieChart>
                        </ResponsiveContainer>
                    </Box>

                    <Stack spacing={2} mt={2}>
                        {topPlanesMock.map((p, i) => {
                            const [c1, c2] = ringColors[i % ringColors.length];
                            return (
                                <Box
                                    key={p.name}
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="space-between"
                                >
                                    <Box display="flex" alignItems="center" gap={1.5}>
                                        <Box
                                            sx={{
                                                width: 24,
                                                height: 24,
                                                borderRadius: '50%',
                                                background: `linear-gradient(135deg, ${c1}, ${c2})`,
                                            }}
                                        />
                                        <Box>
                                            <Typography variant="body2" fontWeight={600}>
                                                {p.name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {p.alumnos} alumnos • {p.ventas} ventas
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Typography variant="body2" fontWeight={700}>
                                        {p.value}%
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Stack>
                </CardContent>
            </Card>
            <Card sx={{ ...cardSx, display: 'flex', flexDirection: 'column' }}>
                <CardContent
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        flex: 1,
                        minHeight: 0,
                    }}
                >
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2" color="text.secondary">
                            Próximos vencimientos
                        </Typography>
                        <Chip size="small" variant="outlined" label="7 días" />
                    </Box>

                    <List
                        disablePadding
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            flex: 1,
                            justifyContent: 'space-between',
                            minHeight: 0,
                        }}
                    >
                        {vencimientosMock.map((v, i) => {
                            const dias = v.dias;
                            const pct = Math.min(100, Math.max(0, (7 - dias) * (100 / 7)));
                            const color = dias < 0 ? 'error' : dias <= 2 ? 'warning' : 'success';

                            return (
                                <ListItem key={v.id} sx={{ px: 3.5, py: 1.5, border: '1px solid #0001', borderRadius: '20px' }}
                                >
                                    <ListItemAvatar>
                                        <Avatar sx={{ width: 34, height: 34 }}>
                                            {v.alumno.charAt(0)}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Typography fontWeight={600}>{v.alumno}</Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    • {v.plan}
                                                </Typography>
                                            </Box>
                                        }
                                        secondary={
                                            <Box>
                                                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                                    <Chip
                                                        size="small"
                                                        color={color as any}
                                                        label={
                                                            dias < 0
                                                                ? `Vencido hace ${Math.abs(dias)} d`
                                                                : `Vence en ${dias} d`
                                                        }
                                                    />
                                                    <Typography variant="caption" color="text.secondary">
                                                        {new Date(v.vence_iso).toLocaleDateString('es-AR')}
                                                    </Typography>
                                                </Box>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={pct}
                                                    sx={{
                                                        height: 6,
                                                        borderRadius: 3,
                                                        bgcolor: alpha(t.palette.text.primary, 0.06),
                                                    }}
                                                />
                                            </Box>
                                        }
                                    />
                                </ListItem>
                            );
                        })}
                    </List>
                </CardContent>
            </Card>


        </Box>
    );
}
