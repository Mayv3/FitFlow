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
import { useNovedadesPaginadas } from '@/hooks/novedades/useNovedadesApi';
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

const READ_KEY = 'readNovedades';

function getReadIds(): Set<number> {
    if (typeof window === 'undefined') return new Set();
    try {
        const raw = sessionStorage.getItem(READ_KEY);
        return new Set(raw ? JSON.parse(raw) : []);
    } catch { return new Set(); }
}

function markAsRead(id: number) {
    if (typeof window === 'undefined') return;
    try {
        const ids = getReadIds();
        ids.add(id);
        sessionStorage.setItem(READ_KEY, JSON.stringify([...ids]));
    } catch {}
}

export default function NovedadesList() {
    const theme = useTheme();
    const { isDarkMode } = useDarkMode();
    const [gymPrimaryColor, setGymPrimaryColor] = useState<string | null>(null);
    const [openModal, setOpenModal] = useState(false);
    const [selectedNovedad, setSelectedNovedad] = useState<Novedad | null>(null);
    const [page, setPage] = useState(1);
    const [acumuladas, setAcumuladas] = useState<Novedad[]>([]);
    const [readIds, setReadIds] = useState<Set<number>>(getReadIds);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const raw = sessionStorage.getItem('gym_settings');
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

    const PAGE_SIZE = 4;
    const { data, isLoading, isError, error, isFetching } = useNovedadesPaginadas(page, PAGE_SIZE);

    const total = data?.total ?? 0;
    const hayMas = acumuladas.length < total;

    useEffect(() => {
        if (!data?.items || isFetching) return;
        setAcumuladas(prev => {
            const ids = new Set(prev.map(n => n.id));
            const nuevas = data.items.filter((n: Novedad) => !ids.has(n.id));
            if (nuevas.length === 0) return prev;
            return [...prev, ...nuevas];
        });
    }, [data, isFetching]);

    const novedadesOrdenadas = acumuladas;

    const primaryColor = gymPrimaryColor || theme.palette.primary.main;



    const unreadCount = novedadesOrdenadas.filter(n => !readIds.has(n.id)).length;

    const handleOpenModal = (novedad: Novedad) => {
        markAsRead(novedad.id);
        setReadIds(prev => new Set(prev).add(novedad.id));
        setSelectedNovedad(novedad);
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setSelectedNovedad(null);
    };

    if (isError && acumuladas.length === 0) {
        const is403 = (error as any)?.response?.status === 403
        return (
            <Typography color="error" align="center">
                {is403
                    ? 'Tu sesión expiró. Por favor, cerrá sesión y volvé a ingresar.'
                    : 'Ocurrió un error al cargar las novedades. Intentá recargar la página.'}
            </Typography>
        );
    }

    return (
        <Box sx={{ py: { xs: 4, md: 6 } }} className="animate-fade-in">
            <Container maxWidth="md">

                <Box sx={{ mb: 5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                    <Box>
                        <Typography variant="h4" fontWeight={800} color={primaryColor} gutterBottom>
                            Novedades
                        </Typography>
                        <Typography color="text.secondary">
                            Acá se publican anuncios, nuevas funcionalidades, actualizaciones, correcciones de errores
                            y avisos sobre incidencias, para que estés siempre al tanto de lo que pasa en la plataforma.
                        </Typography>
                    </Box>
                    {unreadCount > 0 && (
                        <Box sx={{
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 20,
                            bgcolor: alpha(primaryColor, 0.12),
                            color: primaryColor,
                            fontWeight: 700,
                            fontSize: 13,
                            whiteSpace: 'nowrap',
                        }}>
                            {unreadCount} sin leer
                        </Box>
                    )}
                </Box>

                {isLoading && acumuladas.length === 0 ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress sx={{ color: primaryColor }} />
                    </Box>
                ) : novedadesOrdenadas.length === 0 ? (
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
                    <>
                    <div className='grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-4 '>
                        {novedadesOrdenadas.map((novedad, index) => {
                            const isUnread = !readIds.has(novedad.id);
                            return (
                            <Card
                                key={novedad.id}
                                sx={{
                                    animation: index >= novedadesOrdenadas.length - PAGE_SIZE
                                        ? 'fadeSlideIn 0.4s ease forwards'
                                        : undefined,
                                    '@keyframes fadeSlideIn': {
                                        from: { opacity: 0, transform: 'translateY(16px)' },
                                        to: { opacity: 1, transform: 'translateY(0)' },
                                    },
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    borderRadius: 1,
                                    border: '1px solid',
                                    width: '100%',
                                    borderColor: isDarkMode ? alpha(primaryColor, 0.2) : 'divider',
                                    backgroundColor: isUnread
                                        ? alpha(primaryColor, 0.06)
                                        : isDarkMode ? theme.palette.background.paper : '#fff',
                                    animation: isUnread ? 'pulseGlow 3s ease-in-out infinite' : undefined,
                                    '@keyframes pulseGlow': {
                                        '0%, 100%': { boxShadow: `0 0 0 0 ${alpha(primaryColor, 0)}` },
                                        '50%': { boxShadow: `0 0 20px 2px ${alpha(primaryColor, 0.15)}` },
                                    },
                                    transition: 'all 0.25s ease',
                                    cursor: 'pointer',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: isDarkMode
                                            ? `0 8px 24px ${alpha(primaryColor, 0.2)}`
                                            : 4,
                                        borderColor: isUnread
                                            ? alpha(primaryColor, 0.6)
                                            : isDarkMode ? alpha(primaryColor, 0.4) : 'divider',
                                    },
                                }}
                                onClick={() => handleOpenModal(novedad)}
                            >
                                {novedad.imagen_url && (
                                    <CardMedia
                                        component="img"
                                        image={novedad.imagen_url}
                                        alt={novedad.titulo}
                                        loading="lazy"
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

                                        {isUnread && (
                                            <Box sx={{
                                                alignSelf: 'flex-start',
                                                px: 1.2,
                                                py: 0.3,
                                                borderRadius: 1,
                                                bgcolor: alpha(primaryColor, 0.12),
                                                color: primaryColor,
                                                fontWeight: 700,
                                                fontSize: 11,
                                                letterSpacing: '0.3px',
                                            }}>
                                                Sin leer
                                            </Box>
                                        )}
                                    </Stack>
                                </CardContent>
                            </Card>
                        );})}
                    </div>

                    {hayMas && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                            <Button
                                variant="outlined"
                                disabled={isFetching}
                                onClick={() => setPage(p => p + 1)}
                                sx={{
                                    borderColor: primaryColor,
                                    color: primaryColor,
                                    fontWeight: 700,
                                    px: 4,
                                    py: 1.2,
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    '&:hover': {
                                        backgroundColor: alpha(primaryColor, 0.08),
                                        borderColor: primaryColor,
                                    },
                                }}
                            >
                                {isFetching ? <CircularProgress size={20} sx={{ color: primaryColor }} /> : 'Ver más'}
                            </Button>
                        </Box>
                    )}
                    </>

                )}

                <Dialog
                    open={openModal}
                    onClose={handleCloseModal}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{
                        sx: {
                            borderRadius: 3,
                            bgcolor: '#0a0a0a',
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
                                        <Typography variant="body2" color="rgba(255,255,255,0.5)" fontWeight={600}>
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
                                            loading="lazy"
                                            sx={{
                                                maxHeight: 250,
                                                width: '100%',
                                                objectFit: 'cover',
                                                boxShadow: `0 4px 20px ${alpha(getTipoColor(selectedNovedad.tipo, theme), 0.15)}`,
                                            }}
                                        />
                                    )}

                                    <Box p={3}>
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
                                                color={'rgba(255,255,255,0.75)'}
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
