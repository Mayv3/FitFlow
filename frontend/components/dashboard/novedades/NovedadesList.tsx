'use client';

import { useState, useMemo, useEffect } from 'react';
import {
    Box,
    Typography,
    CircularProgress,
    Card,
    CardContent,
    Chip,
    Stack,
    alpha,
    useTheme,
    Paper,
    CardMedia,
    Container,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import CloseIcon from '@mui/icons-material/Close';
import { useNovedades } from '@/hooks/novedades/useNovedadesApi';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import EventIcon from '@mui/icons-material/Event';
import BugReportIcon from '@mui/icons-material/BugReport';
import BuildIcon from '@mui/icons-material/Build';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useDarkMode } from '@/context/DarkModeContext';

interface Novedad {
    id: number;
    titulo: string;
    descripcion?: string;
    tipo: 'novedad' | 'feature' | 'promocion' | 'evento' | 'error' | 'fix';
    activo: boolean;
    fecha_publicacion: string;
    imagen_url?: string;
}

const getTipoIcon = (tipo: string) => {
    const icons = {
        novedad: <NewReleasesIcon />,
        feature: <AnnouncementIcon />,
        promocion: <LocalOfferIcon />,
        evento: <EventIcon />,
        error: <BugReportIcon />,
        fix: <BuildIcon />,
    };
    return icons[tipo as keyof typeof icons] || <AnnouncementIcon />;
};

const getTipoLabel = (tipo: string) => {
    const labels = {
        novedad: 'Novedad',
        feature: 'Funcionalidad',
        promocion: 'Promoción',
        evento: 'Evento',
        error: 'Error',
        fix: 'Corrección',
    };
    return labels[tipo as keyof typeof labels] || tipo;
};

const getTipoColor = (tipo: string, theme: any) => {
    const colors = {
        novedad: theme.palette.info.main,
        feature: theme.palette.secondary.main,
        promocion: theme.palette.warning.main,
        evento: theme.palette.primary.main,
        error: theme.palette.error.main,
        fix: theme.palette.success.main,
    };
    return colors[tipo as keyof typeof colors] || theme.palette.primary.main;
};

export default function NovedadesList() {
    const theme = useTheme();
    const { isDarkMode } = useDarkMode();
    const [gymPrimaryColor, setGymPrimaryColor] = useState<string | null>(null);
    const [openModal, setOpenModal] = useState(false);
    const [selectedNovedad, setSelectedNovedad] = useState<Novedad | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const raw = localStorage.getItem('gym_settings');
            if (raw) {
                try {
                    const settings = JSON.parse(raw);
                    if (settings?.colors?.primary) {
                        setGymPrimaryColor(settings.colors.primary);
                    }
                } catch { }
            }
        }
    }, []);

    const { data, isLoading, isError, error } = useNovedades();

    const novedades = useMemo(() => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if ((data as any).items) return (data as any).items;
        return [];
    }, [data]) as Novedad[];

    const novedadesOrdenadas = useMemo(
        () =>
            [...novedades].sort(
                (a, b) =>
                    new Date(b.fecha_publicacion).getTime() -
                    new Date(a.fecha_publicacion).getTime()
            ),
        [novedades]
    );

    const primaryColor = gymPrimaryColor || theme.palette.primary.main;

    const handleOpenModal = (novedad: Novedad) => {
        setSelectedNovedad(novedad);
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setSelectedNovedad(null);
    };

    if (isLoading) {
        return (
            <Box sx={{ minHeight: '60vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (isError) {
        return (
            <Typography color="error" align="center">
                {(error as Error).message}
            </Typography>
        );
    }

    return (
        <Box sx={{ py: { xs: 4, md: 6 } }}>
            <Container maxWidth="md">

                <Box sx={{ mb: 5 }}>
                    <Typography variant="h4" fontWeight={800} color={primaryColor} gutterBottom>
                        Novedades
                    </Typography>
                    <Typography color="text.secondary">
                        Acá se publican anuncios, nuevas funcionalidades, actualizaciones, correcciones de errores
                        y avisos sobre incidencias, para que estés siempre al tanto de lo que pasa en la plataforma.
                    </Typography>
                </Box>

                {novedadesOrdenadas.length === 0 ? (
                    <Paper
                        sx={{
                            p: 6,
                            textAlign: 'center',
                            bgcolor: isDarkMode
                                ? theme.palette.background.paper
                                : alpha(theme.palette.background.paper, 0.6),
                            border: isDarkMode ? `1px solid ${alpha(primaryColor, 0.2)}` : 'none',
                        }}
                    >
                        <AnnouncementIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            No hay novedades disponibles
                        </Typography>
                        <Typography variant="body2" color="text.disabled">
                            Pronto habrá nuevas actualizaciones
                        </Typography>
                    </Paper>
                ) : (
                    <div className='grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-4 '>
                        {novedadesOrdenadas.map((novedad) => (
                            <Card 
                                key={novedad.id}
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    borderRadius: 1,
                                    border: '1px solid',
                                    width: '100%',
                                    borderColor: isDarkMode ? alpha(primaryColor, 0.2) : 'divider',
                                    backgroundColor: isDarkMode
                                        ? theme.palette.background.paper
                                        : '#fff',
                                    transition: 'all 0.25s ease',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: isDarkMode
                                            ? `0 8px 24px ${alpha(primaryColor, 0.2)}`
                                            : 4,
                                        borderColor: isDarkMode
                                            ? alpha(primaryColor, 0.4)
                                            : 'divider',
                                    },
                                }}
                            >
                                {novedad.imagen_url && (
                                    <CardMedia
                                        component="img"
                                        image={novedad.imagen_url}
                                        alt={novedad.titulo}
                                        sx={{
                                            height: 200,
                                            objectFit: 'cover',
                                        }}
                                    />
                                )}

                                <CardContent sx={{ p: 3, flex: 1 }}>
                                    <Stack spacing={1.5}>
                                        <div className='flex justify-between'>
                                            <Chip
                                                icon={getTipoIcon(novedad.tipo)}
                                                label={getTipoLabel(novedad.tipo)}
                                                size="small"
                                                sx={{
                                                    alignSelf: 'flex-start',
                                                    bgcolor: isDarkMode
                                                        ? alpha(getTipoColor(novedad.tipo, theme), 0.2)
                                                        : alpha(getTipoColor(novedad.tipo, theme), 0.1),
                                                    color: isDarkMode
                                                        ? getTipoColor(novedad.tipo, theme)
                                                        : getTipoColor(novedad.tipo, theme),
                                                    fontWeight: 600,
                                                    '& .MuiChip-icon': {
                                                        color: isDarkMode
                                                            ? getTipoColor(novedad.tipo, theme)
                                                            : getTipoColor(novedad.tipo, theme),
                                                    },
                                                }}
                                            />

                                            <Typography
                                                fontSize={13}
                                                fontWeight={600}
                                                color="text.secondary"
                                            >
                                                {format(
                                                    new Date(novedad.fecha_publicacion),
                                                    "d 'de' MMMM yyyy",
                                                    { locale: es }
                                                )}
                                            </Typography>


                                        </div>


                                        <Typography
                                            variant="h6"
                                            fontWeight={800}
                                            color={primaryColor}
                                            sx={{
                                                lineHeight: 1.6,
                                                display: '-webkit-box',
                                                WebkitLineClamp: 1,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            {novedad.titulo}
                                        </Typography>

                                        {novedad.descripcion && (
                                            <Typography
                                                color="text.secondary"
                                                sx={{
                                                    lineHeight: 1.6,
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 3,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                {novedad.descripcion}
                                            </Typography>
                                        )}

                                        <Button
                                            size="small"
                                            onClick={() => handleOpenModal(novedad)}
                                            sx={{
                                                alignSelf: 'flex-start',
                                                color: isDarkMode
                                                    ? theme.palette.primary.light
                                                    : primaryColor,
                                                fontWeight: 700,
                                                px: 0,
                                                '&:hover': {
                                                    background: 'transparent',
                                                    textDecoration: 'underline',
                                                },
                                            }}
                                        >
                                            Leer más →
                                        </Button>
                                    </Stack>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                )}

                <Dialog
                    open={openModal}
                    onClose={handleCloseModal}
                    maxWidth="md"
                    fullWidth
                    PaperProps={{
                        sx: {
                            borderRadius: 3,
                            bgcolor: isDarkMode ? theme.palette.background.paper : '#fff',
                            '& .MuiDialogContent-root': {
                                '&::-webkit-scrollbar': {
                                    display: 'none',
                                },
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none',
                            },
                        },
                    }}
                >
                    {selectedNovedad && (
                        <>
                            <DialogTitle
                                sx={{
                                    p: 3,
                                    position: 'relative',
                                    background: `linear-gradient(135deg, ${alpha(
                                        getTipoColor(selectedNovedad.tipo, theme),
                                        0.1
                                    )} 0%, ${alpha(getTipoColor(selectedNovedad.tipo, theme), 0.05)} 100%)`,
                                    borderBottom: `3px solid ${getTipoColor(selectedNovedad.tipo, theme)}`,
                                }}
                            >
                                <IconButton
                                    onClick={handleCloseModal}
                                    sx={{
                                        position: 'absolute',
                                        right: 16,
                                        top: 16,
                                        color: 'text.secondary',
                                    }}
                                >
                                    <CloseIcon />
                                </IconButton>

                                <Stack spacing={2}>
                                    <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                                        <Chip
                                            icon={getTipoIcon(selectedNovedad.tipo)}
                                            label={getTipoLabel(selectedNovedad.tipo)}
                                            sx={{
                                                bgcolor: alpha(getTipoColor(selectedNovedad.tipo, theme), 0.2),
                                                color: getTipoColor(selectedNovedad.tipo, theme),
                                                fontWeight: 700,
                                                '& .MuiChip-icon': {
                                                    color: getTipoColor(selectedNovedad.tipo, theme),
                                                },
                                            }}
                                        />
                                        <Typography variant="body2" color="text.secondary" fontWeight={600}>
                                            {format(
                                                new Date(selectedNovedad.fecha_publicacion),
                                                "d 'de' MMMM 'de' yyyy",
                                                { locale: es }
                                            )}
                                        </Typography>
                                    </Stack>


                                </Stack>
                            </DialogTitle>

                            {/* Contenido del modal */}
                            <DialogContent 
                                sx={{ 
                                    p: 0,
                                    '&::-webkit-scrollbar': {
                                        display: 'none',
                                    },
                                    scrollbarWidth: 'none',
                                    msOverflowStyle: 'none',
                                }}
                            >
                                <Stack>
                                    {selectedNovedad.imagen_url && (
                                        <Box
                                            component="img"
                                            src={selectedNovedad.imagen_url}
                                            alt={selectedNovedad.titulo}
                                            sx={{
                                                maxHeight: 500,
                                                objectFit: 'cover',
                                                borderBottomLeftRadius: 30,
                                                borderBottomRightRadius: 30,
                                                boxShadow: `0 4px 20px ${alpha(getTipoColor(selectedNovedad.tipo, theme), 0.15)}`,
                                            }}
                                        />
                                    )}

                                    <Box p={5}>
                                        {/* Título */}
                                        <Typography
                                            variant="h4"
                                            marginBottom={4}
                                            fontWeight={800}
                                            color={getTipoColor(selectedNovedad.tipo, theme)}
                                        >
                                            {selectedNovedad.titulo}
                                        </Typography>
                                        {selectedNovedad.descripcion && (
                                            <Typography
                                                variant="body1"
                                                color="text.secondary"
                                                sx={{
                                                    lineHeight: 1.8,
                                                    whiteSpace: 'pre-wrap',
                                                    fontSize: '1rem',
                                                }}
                                            >
                                                {selectedNovedad.descripcion}
                                            </Typography>
                                        )}
                                    </Box>


                                </Stack>
                            </DialogContent>
                        </>
                    )}
                </Dialog>

            </Container>
        </Box >
    );
}
