'use client';

import {
    Box,
    Card,
    CardContent,
    Typography,
    CircularProgress,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';

import { useUser } from '@/context/UserContext';
import { useAsistenciasHoyPorHora } from '@/hooks/assists/useAsistenciasHoy';

const COLOR_MAIN = '#ff7a18';

export function AsistenciasHoyListaCard() {
    const { user } = useUser();
    const gymId = user?.gym_id ?? '';
    const { data, isLoading } = useAsistenciasHoyPorHora(gymId);
    const t = useTheme();
    const horaToMinutos = (hora: string) => {
        const [h, m] = hora.split(':').map(Number);
        return h * 60 + m;
    };
    const alumnosHoy =
        data?.items
            ?.flatMap((item: any) => item.alumnos ?? [])
            ?.reduce((acc: any[], alumno: any) => {
                if (!acc.find(a => a.alumno_id === alumno.alumno_id)) {
                    acc.push(alumno);
                }
                return acc;
            }, [])
            ?.sort((a: any, b: any) => b.hora.localeCompare(a.hora))
        ?? [];

    const totalAsistencias = alumnosHoy.length;

    return (
        <Card
            sx={{
                borderRadius: 2,
                border: `1px solid ${alpha(t.palette.text.primary, 0.06)}`,
                height: '100%',
            }}
        >
            <CardContent>
                <Typography variant="subtitle1" fontWeight={600} mb={1}>
                    Alumnos que asistieron hoy
                </Typography>

                {isLoading ? (
                    <Box
                        sx={{
                            height: 200,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <CircularProgress size={28} sx={{ color: COLOR_MAIN }} />
                    </Box>
                ) : alumnosHoy.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                        No hubo asistencias registradas hoy.
                    </Typography>
                ) : (
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: '1fr',
                            gap: 1,
                            mt: 1,
                            maxHeight: 250,
                            overflowY: 'auto',
                            pr: 0.5,
                            scrollbarWidth: 'none',
                            '&::-webkit-scrollbar': {
                                width: 6,
                            },
                            '&::-webkit-scrollbar-thumb': {
                                backgroundColor: alpha(t.palette.primary.main, 0.25),
                                borderRadius: 8,
                            },
                            '&::-webkit-scrollbar-track': {
                                background: 'transparent',
                            },
                        }}
                    >
                        {alumnosHoy.map((a: any, idx: number) => (
                            <Box
                                key={a.alumno_id}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    bgcolor: alpha(t.palette.primary.main, 0.06),
                                    borderRadius: 2,
                                    px: 2,
                                    py: 1.5,
                                    gap: 1,
                                }}
                            >
                                <Box display="flex" alignItems="center" minWidth={0}>


                                    <Typography fontWeight={500} noWrap>
                                        {a.nombre}
                                    </Typography>
                                </Box>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}
                                >
                                    {a.hora} hs
                                </Typography>
                            </Box>
                        ))}
                    </Box>

                )}
            </CardContent>
        </Card>
    );
}
