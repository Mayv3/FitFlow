'use client';

import {
    Card, CardContent, Typography, Box, Skeleton, useMediaQuery
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
    ResponsiveContainer, PieChart, Pie, Cell, Tooltip as ReTooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import { RoundedTooltip } from '@/components/ui/tooltip/InfoTooltip';
import { useDemografia } from '@/hooks/dashboard/useDemografia';

export function DemografiaSection() {
    const { data, isLoading, error } = useDemografia();
    const t = useTheme();
    const isMobile = useMediaQuery(t.breakpoints.down('sm'));

    const cardSx = {
        borderRadius: 2,
        border: `1px solid ${alpha(t.palette.text.primary, 0.06)}`,
        bgcolor: t.palette.background.paper,
        height: '100%',
        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
    } as const;

    if (isLoading) {
        return (
            <Box mt={2} display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={1.5}>
                <Card sx={cardSx}>
                    <CardContent>
                        <Typography variant="subtitle2" color="text.secondary" mb={2}>
                            Distribución por Sexo
                        </Typography>
                        <Box display="flex" justifyContent="center" alignItems="center" height={280}>
                            <Skeleton variant="circular" width={180} height={180} />
                        </Box>
                    </CardContent>
                </Card>

                <Card sx={cardSx}>
                    <CardContent>
                        <Typography variant="subtitle2" color="text.secondary" mb={2}>
                            Distribución por Edad y Sexo
                        </Typography>
                        <Skeleton variant="rectangular" height={280} />
                    </CardContent>
                </Card>
            </Box>
        );
    }

    if (error) {
        return (
            <Box mt={2} textAlign="center">
                <Typography color="error">❌ Error cargando demografía</Typography>
            </Box>
        );
    }

    if (!data) return null;

    const porSexo = data.porSexo ?? [];
    const porEdad = data.porEdad ?? [];

    const edades = porEdad.reduce((acc: any[], item: any) => {
        let row = acc.find((r) => r.rango_etario === item.rango_etario);
        if (!row) {
            row = { rango_etario: item.rango_etario, M: 0, F: 0 };
            acc.push(row);
        }
        row[item.sexo] = item.cantidad;
        return acc;
    }, []);

    return (
        <Box mt={2} display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={1.5}>
            {/* Gráfico por Edad y Sexo */}
            <Card sx={cardSx}>
                <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" mb={2}>
                        Distribución por Edad y Sexo
                    </Typography>
                    <Box sx={{ height: 280 }}>
                        <ResponsiveContainer>
                            <BarChart data={edades} barCategoryGap={8} barGap={4}>
                                <defs>
                                    <linearGradient id="barM" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#1DC8FF" />
                                        <stop offset="100%" stopColor="#1674FF" />
                                    </linearGradient>
                                    <linearGradient id="barF" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#FFA45B" />
                                        <stop offset="100%" stopColor="#FF6CA3" />
                                    </linearGradient>
                                </defs>

                                <CartesianGrid vertical={false} stroke={alpha(t.palette.text.primary, 0.08)} />
                                <XAxis dataKey="rango_etario" tickLine={false} axisLine={false} tickMargin={8} />
                                <YAxis
                                    hide={isMobile}
                                    tickLine={false}
                                    axisLine={false}
                                    domain={[0, 'auto']}
                                    allowDecimals={false}
                                    tickFormatter={(v) => v.toFixed(0)}
                                />

                                <Tooltip
                                    content={
                                        <RoundedTooltip
                                            formatter={(entry) =>
                                                `${entry.dataKey === 'M' ? 'Hombres' : 'Mujeres'}: ${entry.value}`
                                            }
                                        />
                                    }
                                    cursor={{ fill: alpha(t.palette.primary.main, 0.06) }}
                                />

                                <Legend
                                    verticalAlign="bottom"
                                    content={({ payload }) => (
                                        <Box display="flex" gap={3} flexWrap="wrap" justifyContent="center" mt={1}>
                                            {payload?.map((entry, i) => {
                                                const grads = [
                                                    'linear-gradient(135deg, #1DC8FF, #1674FF)', // Hombres
                                                    'linear-gradient(135deg, #FFA45B, #FF6CA3)', // Mujeres
                                                ];
                                                return (
                                                    <Box key={`legend-item-${i}`} display="inline-flex" alignItems="center" gap={1}>
                                                        <Box
                                                            sx={{
                                                                width: 20,
                                                                height: 20,
                                                                borderRadius: '50%',
                                                                background: grads[i % grads.length],
                                                            }}
                                                        />
                                                        <Typography variant="body2" color="text.secondary">
                                                            {entry.value}
                                                        </Typography>
                                                    </Box>
                                                );
                                            })}
                                        </Box>
                                    )}
                                />

                                <Bar dataKey="M" stackId="a" fill="url(#barM)" name="Hombres" />
                                <Bar dataKey="F" stackId="a" fill="url(#barF)" radius={[8, 8, 0, 0]} name="Mujeres" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Box>
                </CardContent>
            </Card>

            {/* Gráfico por Sexo */}
            <Card sx={cardSx}>
                <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" mb={2}>
                        Distribución por Sexo
                    </Typography>
                    <Box sx={{ height: 280, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <ResponsiveContainer>
                            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                                <defs>
                                    {[
                                        ['#1DC8FF', '#1674FF'], // Hombres
                                        ['#FFA45B', '#FF6CA3'], // Mujeres
                                    ].map(([c1, c2], i) => (
                                        <linearGradient key={i} id={`donut-grad-sex-${i}`} x1="0" y1="0" x2="1" y2="1">
                                            <stop offset="0%" stopColor={c1} />
                                            <stop offset="100%" stopColor={c2} />
                                        </linearGradient>
                                    ))}
                                </defs>

                                <Pie
                                    data={porSexo.map((d: any) => ({
                                        ...d,
                                        label: d.sexo === 'M' ? 'Hombres' : 'Mujeres',
                                        value: d.cantidad,
                                    }))}
                                    dataKey="value"
                                    nameKey="label"
                                    innerRadius="62%"
                                    outerRadius="90%"
                                    startAngle={90}
                                    endAngle={-270}
                                    stroke="transparent"
                                >
                                    {porSexo.map((_: any, i: any) => (
                                        <Cell key={i} fill={`url(#donut-grad-sex-${i})`} />
                                    ))}
                                </Pie>

                                <ReTooltip
                                    content={
                                        <RoundedTooltip
                                            formatter={(entry) => `${entry.payload.label}: ${entry.value}`}
                                        />
                                    }
                                />
                            </PieChart>
                        </ResponsiveContainer>

                        <Box display="flex" gap={3} flexWrap="wrap" justifyContent="center" mt={2}>
                            {porSexo.map((d: any, i: any) => {
                                const grads = [
                                    'linear-gradient(135deg, #1DC8FF, #1674FF)',
                                    'linear-gradient(135deg, #FFA45B, #FF6CA3)',
                                ];
                                return (
                                    <Box key={d.sexo} display="inline-flex" alignItems="center" gap={1.5}>
                                        <Box
                                            sx={{
                                                width: 18,
                                                height: 18,
                                                borderRadius: '50%',
                                                background: grads[i],
                                            }}
                                        />
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                {d.sexo === 'M' ? 'Hombres' : 'Mujeres'}
                                            </Typography>
                                            <Typography variant="body2" fontWeight={700}>
                                                {d.cantidad.toLocaleString('es-AR')}
                                            </Typography>
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}
