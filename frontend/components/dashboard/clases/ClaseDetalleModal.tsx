'use client'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Stack,
    Chip,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    CircularProgress,
    IconButton,
    Collapse,
    List,
    ListItem,
    ListItemText,
    Avatar,
    ListItemAvatar,
} from '@mui/material'
import { Fragment, useState, useEffect } from 'react'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import BadgeIcon from '@mui/icons-material/Badge'
import EmailIcon from '@mui/icons-material/Email'
import PersonIcon from '@mui/icons-material/Person'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import { getDiaNombre } from '@/const/inputs/sesiones'
import { useSesionesByClase } from '@/hooks/sesiones/useSesiones'
import { InscripcionesModal } from './InscripcionesModal'
import {
    useInscribirAlumno,
    useDesinscribirAlumno,
} from '@/hooks/sesiones/useSesiones'
import { notify } from '@/lib/toast'

const formatHora = (hora: string): string => {
    if (!hora) return ''
    const parts = hora.split(':')
    return `${parts[0]}:${parts[1]}`
}

const formatFecha = (fecha: string): string => {
    if (!fecha) return '-'
    const date = new Date(fecha + 'T00:00:00')
    return date.toLocaleDateString('es-AR', { 
        day: '2-digit', 
        month: '2-digit',
        year: 'numeric',
        timeZone: 'America/Argentina/Buenos_Aires'
    })
}

interface ClaseDetalleModalProps {
    open: boolean
    onClose: () => void
    clase: any
    gymId: string
}

export function ClaseDetalleModal({ open, onClose, clase, gymId }: ClaseDetalleModalProps) {
    const [expandedSesion, setExpandedSesion] = useState<number | null>(null)
    const [openInscripciones, setOpenInscripciones] = useState(false)
    const [selectedSesion, setSelectedSesion] = useState<any | null>(null)

    const { data: sesiones = [], isLoading, refetch } = useSesionesByClase(clase?.id)
    const inscribirAlumno = useInscribirAlumno(clase?.id)
    const desinscribirAlumno = useDesinscribirAlumno(clase?.id)

    // Refrescar sesiones cuando se abre el modal
    useEffect(() => {
        if (open && clase?.id) {
            refetch()
        }
    }, [open, clase?.id, refetch])

    sesiones.forEach((sesion, index) => {
        console.log(`[ClaseDetalleModal] Alumnos inscritos en sesión ${index}:`, sesion.alumnos_inscritos)
    })

    useEffect(() => {
        if (selectedSesion && sesiones.length > 0) {
            const sesionActualizada = sesiones.find(s => s.id === selectedSesion.id)
            if (sesionActualizada) {
                setSelectedSesion(sesionActualizada)
            }
        }
    }, [sesiones])

    const handleOpenInscripciones = (sesion: any) => {
        setSelectedSesion(sesion)
        setOpenInscripciones(true)
    }

    const handleInscribir = async (alumnoId: number) => {
        if (!selectedSesion) return
        try {
            await inscribirAlumno.mutateAsync({
                sesion_id: selectedSesion.id,
                alumno_id: alumnoId,
                gym_id: gymId,
            })
            notify.success('Alumno inscrito correctamente')
        } catch (error: any) {
            console.error('Error al inscribir:', error)
            notify.error(error.response?.data?.error || 'Error al inscribir')
        }
    }

    const handleDesinscribir = async (alumnoId: number) => {
        if (!selectedSesion) return
        try {
            await desinscribirAlumno.mutateAsync({
                sesion_id: selectedSesion.id,
                alumno_id: alumnoId,
                gym_id: gymId,
            })
            notify.success('Alumno desinscrito correctamente')
        } catch (error: any) {
            console.error('Error al desinscribir:', error)
            notify.error(error.response?.data?.error || 'Error al desinscribir')
        }
    }

    return (
        <>
            <Dialog 
                open={open} 
                onClose={onClose} 
                maxWidth="md" 
                fullWidth
                fullScreen={false}
                sx={{
                    '& .MuiDialog-paper': {
                        m: { xs: 1, sm: 2 },
                        maxHeight: { xs: '95vh', sm: '90vh' },
                    },
                }}
            >
                <DialogTitle sx={{ pb: { xs: 2, sm: 3 } }}>
                    <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                        <Stack direction="row" spacing={2} alignItems="center" flex={1}>
                            <Box
                                sx={{
                                    width: { xs: 28, sm: 32 },
                                    height: { xs: 28, sm: 32 },
                                    borderRadius: '50%',
                                    backgroundColor: clase?.color || '#ccc',
                                }}
                            />
                            <Box flex={1}>
                                <Typography variant="h6" fontSize={{ xs: '1.1rem', sm: '1.25rem' }}>
                                    {clase?.nombre}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" fontSize={{ xs: '0.8rem', sm: '0.875rem' }}>
                                    {clase?.descripcion || 'Sin descripción'}
                                </Typography>
                            </Box>
                        </Stack>
                        <Chip
                            label={`${sesiones.length} sesiones`}
                            color="primary"
                            size="small"
                        />
                    </Stack>
                </DialogTitle>
                <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 2 } }}>
                    {isLoading ? (
                        <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            py: 8 
                        }}>
                            <CircularProgress size={48} sx={{ mb: 2 }} />
                            <Typography variant="body2" color="text.secondary">
                                Cargando sesiones...
                            </Typography>
                        </Box>
                    ) : sesiones.length === 0 ? (
                        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                            No hay sesiones creadas para esta clase
                        </Typography>
                    ) : (
                        <>
                            {/* Vista mobile - Cards */}
                            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                                <Stack spacing={2}>
                                    {sesiones.map((sesion) => (
                                        <Paper 
                                            key={sesion.id}
                                            variant="outlined" 
                                            sx={{ 
                                                p: 2,
                                                borderRadius: 2,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                '&:hover': {
                                                    borderColor: 'primary.main',
                                                    boxShadow: 1,
                                                },
                                            }}
                                            onClick={() =>
                                                setExpandedSesion(
                                                    expandedSesion === sesion.id ? null : sesion.id
                                                )
                                            }
                                        >
                                            <Stack spacing={2}>
                                                {/* Header del card */}
                                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                                    <Stack spacing={0.5} flex={1}>
                                                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                                            <Chip label={getDiaNombre(sesion.dia_semana)} size="small" color="primary" />
                                                            <Typography variant="body2" fontWeight="medium">
                                                                {formatHora(sesion.hora_inicio)}
                                                            </Typography>
                                                        </Stack>
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            📅 {formatFecha((sesion as any).fecha_proxima)}
                                                        </Typography>
                                                    </Stack>
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleOpenInscripciones(sesion)
                                                        }}
                                                    >
                                                        <PersonAddIcon fontSize="small" />
                                                    </IconButton>
                                                </Stack>

                                                {/* Info del card */}
                                                <Stack direction="row" spacing={2} justifyContent="space-between">
                                                    <Box>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Capacidad
                                                        </Typography>
                                                        <Typography variant="body2" fontWeight="medium">
                                                            {sesion.capacidad} personas
                                                        </Typography>
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Inscritos
                                                        </Typography>
                                                        <Box sx={{ mt: 0.5 }}>
                                                            <Chip
                                                                label={sesion.capacidad_actual || 0}
                                                                size="small"
                                                                color={
                                                                    sesion.capacidad_actual === sesion.capacidad
                                                                        ? 'error'
                                                                        : 'primary'
                                                                }
                                                            />
                                                        </Box>
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Disponibles
                                                        </Typography>
                                                        <Typography variant="body2" fontWeight="medium">
                                                            {sesion.capacidad - (sesion.capacidad_actual || 0)}
                                                        </Typography>
                                                    </Box>
                                                </Stack>

                                                {/* Alumnos inscritos expandibles */}
                                                {(sesion.alumnos_inscritos?.length || 0) > 0 && (
                                                    <>
                                                        <Collapse in={expandedSesion === sesion.id}>
                                                            <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
                                                                <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                                                                    Alumnos inscritos ({sesion.capacidad_actual || 0})
                                                                </Typography>
                                                                {sesion.alumnos_inscritos?.length === 0 ? (
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        No hay alumnos inscritos
                                                                    </Typography>
                                                                ) : (
                                                                    <List sx={{ p: 0 }}>
                                                                        {sesion.alumnos_inscritos?.map((alumno: any) => (
                                                                            alumno ? (
                                                                                <Paper
                                                                                    key={alumno.id}
                                                                                    elevation={0}
                                                                                    sx={{
                                                                                        mb: 1,
                                                                                        border: '2px solid',
                                                                                        borderColor: alumno.es_fija ? '#F59E0B' : 'divider',
                                                                                        borderRadius: 1,
                                                                                        bgcolor: alumno.es_fija ? '#FEF3C7' : 'transparent',
                                                                                    }}
                                                                                >
                                                                                    <ListItem sx={{ py: 1 }}>
                                                                                        <ListItemAvatar>
                                                                                            <Avatar sx={{ 
                                                                                                bgcolor: alumno.es_fija ? '#F59E0B' : 'primary.main', 
                                                                                                width: 32, 
                                                                                                height: 32 
                                                                                            }}>
                                                                                                {alumno.es_fija ? <AutorenewIcon sx={{ fontSize: 18 }} /> : (alumno.nombre || 'A')[0].toUpperCase()}
                                                                                            </Avatar>
                                                                                        </ListItemAvatar>
                                                                                        <ListItemText
                                                                                            primary={
                                                                                                <Stack direction="row" spacing={1} alignItems="center">
                                                                                                    <Typography variant="body2" fontWeight="medium">
                                                                                                        {alumno.nombre || 'Sin nombre'}
                                                                                                    </Typography>
                                                                                                    {alumno.es_fija && (
                                                                                                        <Chip
                                                                                                            label="Fija"
                                                                                                            size="small"
                                                                                                            sx={{
                                                                                                                bgcolor: '#F59E0B',
                                                                                                                color: '#fff',
                                                                                                                fontWeight: 600,
                                                                                                                fontSize: '0.65rem',
                                                                                                                height: 18,
                                                                                                            }}
                                                                                                        />
                                                                                                    )}
                                                                                                </Stack>
                                                                                            }
                                                                                            secondary={
                                                                                                <Stack spacing={0.3} sx={{ mt: 0.3 }}>
                                                                                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                                                                                        <BadgeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                                                                        <Typography variant="caption" color="text.secondary">
                                                                                                            {alumno.dni || 'N/A'}
                                                                                                        </Typography>
                                                                                                    </Stack>
                                                                                                </Stack>
                                                                                            }
                                                                                            secondaryTypographyProps={{ component: 'div' }}
                                                                                        />
                                                                                    </ListItem>
                                                                                </Paper>
                                                                            ) : null
                                                                        ))}
                                                                    </List>
                                                                )}
                                                            </Box>
                                                        </Collapse>
                                                    </>
                                                )}
                                            </Stack>
                                        </Paper>
                                    ))}
                                </Stack>
                            </Box>

                            {/* Vista desktop - Tabla */}
                            <Paper variant="outlined" sx={{ display: { xs: 'none', md: 'block' } }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell width={50}></TableCell>
                                            <TableCell>Día</TableCell>
                                            <TableCell>Prox. Fecha</TableCell>
                                            <TableCell>Hora</TableCell>
                                            <TableCell align="center">Capacidad</TableCell>
                                            <TableCell align="center">Inscritos</TableCell>
                                            <TableCell align="center">Disponibles</TableCell>
                                            <TableCell align="center">Acciones</TableCell>
                                        </TableRow>
                                    </TableHead>
                                <TableBody>
                                    {sesiones.map((sesion) => (
                                        <Fragment key={sesion.id}>
                                            <TableRow 
                                                hover
                                                sx={{ 
                                                    cursor: 'pointer',
                                                    '&:hover': {
                                                        bgcolor: 'action.hover',
                                                    },
                                                }}
                                                onClick={() =>
                                                    setExpandedSesion(
                                                        expandedSesion === sesion.id ? null : sesion.id
                                                    )
                                                }
                                            >
                                                <TableCell>
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setExpandedSesion(
                                                                expandedSesion === sesion.id ? null : sesion.id
                                                            )
                                                        }}
                                                    >
                                                        {expandedSesion === sesion.id ? (
                                                            <ExpandLessIcon fontSize="small" />
                                                        ) : (
                                                            <ExpandMoreIcon fontSize="small" />
                                                        )}
                                                    </IconButton>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip label={getDiaNombre(sesion.dia_semana)} size="small" />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {formatFecha((sesion as any).fecha_proxima)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    {formatHora(sesion.hora_inicio)}
                                                </TableCell>
                                                <TableCell align="center">{sesion.capacidad}</TableCell>
                                                <TableCell align="center">
                                                    <Chip
                                                        label={sesion.capacidad_actual || 0}
                                                        size="small"
                                                        color={
                                                            sesion.capacidad_actual === sesion.capacidad
                                                                ? 'error'
                                                                : 'primary'
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell align="center">
                                                    {sesion.capacidad - (sesion.capacidad_actual || 0)}
                                                </TableCell>
                                                <TableCell align="center">
                                                    <IconButton
                                                        size="small"
                                                        color="success"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleOpenInscripciones(sesion)
                                                        }}
                                                        title="Gestionar inscripciones"
                                                    >
                                                        <PersonAddIcon fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell colSpan={8} sx={{ py: 0, px: 0 }}>
                                                    <Collapse
                                                        in={expandedSesion === sesion.id}
                                                        timeout="auto"
                                                        unmountOnExit
                                                    >
                                                        <Box sx={{ p: 2, bgcolor: 'background.default' }}>
                                                            <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                                                                Alumnos inscritos ({sesion.capacidad_actual || 0})
                                                            </Typography>
                                                            {sesion.alumnos_inscritos?.length === 0 ? (
                                                                <Paper 
                                                                    elevation={0} 
                                                                    sx={{ 
                                                                        p: 3, 
                                                                        textAlign: 'center', 
                                                                        bgcolor: 'grey.50',
                                                                        borderRadius: 2,
                                                                    }}
                                                                >
                                                                    <PersonIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        No hay alumnos inscritos
                                                                    </Typography>
                                                                </Paper>
                                                            ) : (
                                                                <Box
                                                                    sx={{
                                                                        maxHeight: (sesion.alumnos_inscritos?.length || 0) > 3 ? '280px' : 'auto',
                                                                        overflowY: (sesion.alumnos_inscritos?.length || 0) > 3 ? 'auto' : 'visible',
                                                                        '&::-webkit-scrollbar': {
                                                                            width: '8px',
                                                                        },
                                                                        '&::-webkit-scrollbar-track': {
                                                                            backgroundColor: 'background.default',
                                                                            borderRadius: '4px',
                                                                        },
                                                                        '&::-webkit-scrollbar-thumb': {
                                                                            backgroundColor: 'primary.main',
                                                                            borderRadius: '4px',
                                                                            '&:hover': {
                                                                                backgroundColor: 'primary.dark',
                                                                            },
                                                                        },
                                                                    }}
                                                                >
                                                                    <List sx={{ p: 0 }}>
                                                                        {sesion.alumnos_inscritos?.map((alumno: any) => (
                                                                            alumno ? (
                                                                                <Paper
                                                                                    key={alumno.id}
                                                                                    elevation={0}
                                                                                    sx={{
                                                                                        mb: 1,
                                                                                        border: '2px solid',
                                                                                        borderColor: alumno.es_fija ? '#F59E0B' : 'divider',
                                                                                        borderRadius: 1,
                                                                                        bgcolor: alumno.es_fija ? '#FEF3C7' : 'transparent',
                                                                                        transition: 'all 0.2s',
                                                                                        '&:hover': {
                                                                                            borderColor: alumno.es_fija ? '#F59E0B' : 'primary.main',
                                                                                            boxShadow: 1,
                                                                                        },
                                                                                    }}
                                                                                >
                                                                                    <ListItem>
                                                                                        <ListItemAvatar>
                                                                                            <Avatar sx={{ 
                                                                                                bgcolor: alumno.es_fija ? '#F59E0B' : 'primary.main', 
                                                                                                width: 36, 
                                                                                                height: 36 
                                                                                            }}>
                                                                                                {alumno.es_fija ? <AutorenewIcon sx={{ fontSize: 20 }} /> : (alumno.nombre || 'A')[0].toUpperCase()}
                                                                                            </Avatar>
                                                                                        </ListItemAvatar>
                                                                                        <ListItemText
                                                                                            primary={
                                                                                                <Stack direction="row" spacing={1} alignItems="center">
                                                                                                    <Typography variant="body2" fontWeight="medium">
                                                                                                        {alumno.nombre || 'Sin nombre'}
                                                                                                    </Typography>
                                                                                                    {alumno.es_fija && (
                                                                                                        <Chip
                                                                                                            label="Fija"
                                                                                                            size="small"
                                                                                                            sx={{
                                                                                                                bgcolor: '#F59E0B',
                                                                                                                color: '#fff',
                                                                                                                fontWeight: 600,
                                                                                                                fontSize: '0.7rem',
                                                                                                                height: 20,
                                                                                                            }}
                                                                                                        />
                                                                                                    )}
                                                                                                </Stack>
                                                                                            }
                                                                                            secondary={
                                                                                                <Stack spacing={0.3} sx={{ mt: 0.3 }}>
                                                                                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                                                                                        <BadgeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                                                                        <Typography variant="caption" color="text.secondary">
                                                                                                            {alumno.dni || 'N/A'}
                                                                                                        </Typography>
                                                                                                    </Stack>
                                                                                                    {alumno.email && (
                                                                                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                                                                                            <EmailIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                                                                            <Typography variant="caption" color="text.secondary">
                                                                                                                {alumno.email}
                                                                                                            </Typography>
                                                                                                        </Stack>
                                                                                                    )}
                                                                                                </Stack>
                                                                                            }
                                                                                            secondaryTypographyProps={{ component: 'div' }}
                                                                                        />
                                                                                    </ListItem>
                                                                                </Paper>
                                                                            ) : null
                                                                        ))}
                                                                    </List>
                                                                </Box>
                                                            )}
                                                        </Box>
                                                    </Collapse>
                                                </TableCell>
                                            </TableRow>
                                        </Fragment>
                                    ))}
                                </TableBody>
                            </Table>
                        </Paper>
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cerrar</Button>
                </DialogActions>
            </Dialog>

            {openInscripciones && selectedSesion && (
                <InscripcionesModal
                    open={openInscripciones}
                    onClose={() => {
                        setOpenInscripciones(false)
                        setSelectedSesion(null)
                    }}
                    sesion={selectedSesion}
                    gymId={gymId}
                    onInscribir={handleInscribir}
                    onDesinscribir={handleDesinscribir}
                />
            )}
        </>
    )
}
