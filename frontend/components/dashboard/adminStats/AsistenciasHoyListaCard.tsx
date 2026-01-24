'use client';

import {
    Box,
    Card,
    CardContent,
    Typography,
    CircularProgress,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { useGymThemeSettings } from '@/hooks/useGymThemeSettings';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { useUser } from '@/context/UserContext';
import { useAsistencias } from '@/hooks/assists/useAsistenciasHoy';
import moment, { Moment } from 'moment';
const COLOR_MAIN = '#ff7a18';

type Props = {
    fecha: string | null;
    onFechaChange: (fecha: string | null) => void;
};

export function AsistenciasHoyListaCard({ fecha, onFechaChange }: Props) {
    const { user } = useUser();
    const gymId = user?.gym_id ?? '';
    const { data, isLoading } = useAsistencias(gymId, { fecha });
    const t = useTheme();
    const { borderRadius } = useGymThemeSettings();

    const alumnosHoy =
        data?.porHora
            ?.flatMap((item: any) => item.alumnos ?? [])
            ?.reduce((acc: any[], alumno: any) => {
                if (!acc.find(a => a.alumno_id === alumno.alumno_id)) {
                    acc.push(alumno);
                }
                return acc;
            }, [])
            ?.sort((a: any, b: any) => b.hora.localeCompare(a.hora))
        ?? [];

    return (
        <Box sx={{ position: 'relative', borderRadius }}>
            <GlowingEffect
                spread={40}
                glow={true}
                disabled={false}
                proximity={64}
                inactiveZone={0.01}
                borderWidth={3}
            />
            <Card
                sx={{
                    borderRadius,
                    height: '100%',
                    position: 'relative',
                    md: { width: '490px' },
                    bgcolor: t.palette.mode === 'dark' ? '#0a0a0a' : t.palette.background.paper,

                }}
            >
                <CardContent>
                    <Box
                        display="flex"
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                        justifyContent="space-between"
                        p={1}
                        mb={1}
                    >
                        <Typography variant="subtitle2" color="text.secondary">
                            Alumnos que asistieron
                        </Typography>

                        <DatePicker
                            label="Fecha"
                            value={fecha ? moment(fecha) : moment()}
                            onChange={(newValue: Moment | null) =>
                                onFechaChange(newValue ? newValue.format('YYYY-MM-DD') : null)
                            }
                            maxDate={moment()}
                            slotProps={{
                                textField: {
                                    size: 'small',
                                    sx: {
                                        width: 160,
                                    },
                                },
                            }}
                        />

                    </Box>

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
                            No hubo asistencias registradas para esta fecha.
                        </Typography>
                    ) : (
                        <Box
                            sx={{
                                display: 'grid',
                                gap: 2,
                                mt: 1,
                                maxHeight: 250,
                                overflowY: 'auto',
                                scrollbarWidth: 'none',          // Firefox
                                '&::-webkit-scrollbar': {
                                    display: 'none',               // Chrome / Safari
                                },
                                cursor: 'pointer',
                            }}
                        >
                            {alumnosHoy.map((a: any) => (
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
                                    }}
                                >
                                    <Typography fontWeight={500} noWrap>
                                        {a.nombre}
                                    </Typography>

                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ fontWeight: 600 }}
                                    >
                                        {a.hora} hs
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
}
