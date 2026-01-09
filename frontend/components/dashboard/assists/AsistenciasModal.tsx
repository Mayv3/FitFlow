'use client';

import {
    Dialog,
    DialogTitle,
    DialogContent,
    Box,
    Typography,
    IconButton,
    CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { alpha, useTheme } from '@mui/material/styles';

import { useAsistencias } from '@/hooks/assists/useAsistenciasHoy';

type Props = {
    open: boolean;
    onClose: () => void;
    gymId?: string;
};

export function AsistenciasHoyModal({
    open,
    onClose,
    gymId,
}: Props) {
    const t = useTheme();

    const { data, isLoading } = useAsistencias(gymId);

    const toMinutes = (h: string) => {
        const [hh, mm = '0'] = h.split(':');
        return Number(hh) * 60 + Number(mm);
    };

    const alumnosDia =
        (data?.porHora?.flatMap((h: any) => h.alumnos ?? []) ?? [])
            .sort((a: any, b: any) => toMinutes(b.hora) - toMinutes(a.hora));

    const total = alumnosDia.length;

    const itemSx = {
        px: 1.5,
        py: 1,
        borderRadius: 1.5,
        border: `1px solid ${alpha(t.palette.text.primary, 0.08)}`,
        background: alpha(t.palette.background.paper, 0.6),
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="xs"
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    p: 1.5,
                },
            }}
        >
            <DialogTitle
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    pb: 1,
                }}
            >
                <Box>
                    <Typography variant="inherit" color="text.secondary">
                        Asistencias del día
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                        {total} asistencias
                    </Typography>
                </Box>

                <IconButton onClick={onClose}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent
                sx={{
                    pt: 1,
                    maxHeight: { xs: '50vh' },
                    overflowY: 'auto',
                    scrollbarWidth: 'none',
                    '&::-webkit-scrollbar': { display: 'none' },
                }}
            >
                {isLoading ? (
                    <Box display="flex" justifyContent="center" py={4}>
                        <CircularProgress size={24} />
                    </Box>
                ) : alumnosDia.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                        No hubo asistencias hoy.
                    </Typography>
                ) : (
                    <Box display="grid" gap={1.5} sx={{cursor:'pointer'}}>
                        {alumnosDia.map((a: any) => (
                            <Box key={a.alumno_id} sx={itemSx}>
                                <Box display="flex" justifyContent="space-between">
                                    <Typography fontWeight={500} noWrap>
                                        {a.nombre}
                                    </Typography>

                                    <Typography
                                        variant="body2"
                                        fontWeight={600}
                                        sx={{ color: '#14b8a6', whiteSpace: 'nowrap' }}
                                    >
                                        {a.hora} hs
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
}
