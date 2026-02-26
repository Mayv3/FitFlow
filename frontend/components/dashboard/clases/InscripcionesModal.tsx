'use client'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Typography,
    Box,
    Divider,
    Autocomplete,
    TextField,
    Stack,
    Avatar,
    ListItemAvatar,
    Paper,
    Chip,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import PersonIcon from '@mui/icons-material/Person'
import EmailIcon from '@mui/icons-material/Email'
import BadgeIcon from '@mui/icons-material/Badge'
import { useMemo, useState } from 'react'
import { getDiaNombre } from '@/const/inputs/sesiones'
import { useAlumnosSimpleService } from '@/hooks/alumnos/useAlumnosApi'

// Función para formatear hora a HH:MM
const formatHora = (hora: string): string => {
    if (!hora) return ''
    const parts = hora.split(':')
    return `${parts[0]}:${parts[1]}`
}

interface InscripcionesModalProps {
    open: boolean
    onClose: () => void
    sesion: any
    gymId: string
    onInscribir: (alumnoId: number) => void
    onDesinscribir: (alumnoId: number) => void
}

export function InscripcionesModal({
    open,
    onClose,
    sesion,
    gymId,
    onInscribir,
    onDesinscribir,
}: InscripcionesModalProps) {
    const [selectedAlumno, setSelectedAlumno] = useState<any | null>(null)
    const { data: alumnos = [] } = useAlumnosSimpleService(gymId)

    const alumnosInscritos = sesion.alumnos_inscritos || []
    const alumnosDisponibles = useMemo(
        () => alumnos.filter((a: any) => !alumnosInscritos.some((ai: any) => ai.id === a.id)),
        [alumnos, alumnosInscritos]
    )

    const handleInscribir = () => {
        if (selectedAlumno) {
            onInscribir(selectedAlumno.id)
            setSelectedAlumno(null)
        }
    }

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="md" 
            fullWidth
            sx={{
                '& .MuiDialog-paper': {
                    m: { xs: 1, sm: 2 },
                    maxHeight: { xs: '95vh', sm: '90vh' },
                },
            }}
        >
            <DialogTitle>
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                    <Box sx={{ justifyContent: 'center', display: 'flex', flexDirection: 'column' }}>
                        <Typography textAlign="center" variant="h6">Gestionar inscripciones</Typography>
                        <Typography textAlign="center" variant="body2" color="text.secondary">
                            {getDiaNombre(sesion.dia_semana)} • {formatHora(sesion.hora_inicio)}
                        </Typography>
                    </Box>
                </Stack>
            </DialogTitle>
            <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 2 } }}>
                {/* Sección de inscribir */}
                <Paper elevation={0} sx={{ bgcolor: 'primary.50', p: 2, mb: 3, borderRadius: 2 }}>
                    <Typography variant="subtitle2" gutterBottom fontWeight="bold" color="primary">
                        Inscribir nuevo alumno
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mt: 1 }}>
                        <Chip 
                            label={`${alumnosInscritos.length} / ${sesion.capacidad}`} 
                            color={alumnosInscritos.length >= sesion.capacidad ? 'error' : 'primary'}
                            size="small"
                            sx={{ 
                                height: { xs: 'auto', sm: 40 },
                                '& .MuiChip-label': {
                                    px: 2,
                                },
                            }}
                        />
                        <Autocomplete
                            size="small"
                            fullWidth
                            options={alumnosDisponibles}
                            getOptionLabel={(option: any) => `${option.nombre} (DNI: ${option.dni})`}
                            value={selectedAlumno}
                            onChange={(_, newValue) => setSelectedAlumno(newValue)}
                            renderInput={(params) => (
                                <TextField {...params} label="Buscar alumno" />
                            )}
                            disabled={alumnosInscritos.length >= sesion.capacidad}
                        />
                        <Button
                            variant="contained"
                            onClick={handleInscribir}
                            disabled={!selectedAlumno || alumnosInscritos.length >= sesion.capacidad}
                            sx={{ minWidth: { xs: '100%', sm: '120px' } }}
                        >
                            Inscribir
                        </Button>
                    </Stack>
                </Paper>

                <Divider sx={{ my: 2 }} />

                {/* Lista de alumnos inscritos */}
                <Box>
                    <Typography variant="subtitle2" gutterBottom fontWeight="bold" sx={{ mb: 2 }}>
                        Alumnos inscritos ({alumnosInscritos.length})
                    </Typography>
                    {alumnosInscritos.length === 0 ? (
                        <Paper
                            elevation={0}
                            sx={{
                                p: 4,
                                textAlign: 'center',
                                bgcolor: 'action.hover',
                                borderRadius: 2,
                            }}
                        >
                            <PersonIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                            <Typography variant="body2" color="text.secondary">
                                No hay alumnos inscritos en esta sesión
                            </Typography>
                        </Paper>
                    ) : (
                        <Box
                            sx={{
                                maxHeight: (alumnosInscritos.length || 0) > 3 ? '320px' : 'auto',
                                overflowY: (alumnosInscritos.length || 0) > 3 ? 'auto' : 'visible',
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
                                {alumnosInscritos.map((alumno: any, index: number) => (
                                    alumno ? (
                                        <Paper
                                            key={alumno.id}
                                            elevation={0}
                                            sx={{
                                                mb: 1.5,
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                borderRadius: 2,
                                                transition: 'all 0.2s',
                                                overflow: 'hidden',
                                                '&:hover': {
                                                    borderColor: 'primary.main',
                                                    boxShadow: 1,
                                                },
                                            }}
                                        >
                                            <ListItem
                                                sx={{ px: { xs: 1.5, sm: 2 } }}
                                                secondaryAction={
                                                    <IconButton
                                                        edge="end"
                                                        size="small"
                                                        color="error"
                                                        onClick={() => onDesinscribir(alumno.id)}
                                                        sx={{
                                                            '&:hover': {
                                                                bgcolor: 'error.50',
                                                            },
                                                        }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                }
                                            >
                                                <ListItemAvatar sx={{ minWidth: { xs: 48, sm: 56 } }}>
                                                    <Avatar sx={{ bgcolor: 'primary.main', width: { xs: 36, sm: 40 }, height: { xs: 36, sm: 40 } }}>
                                                        {(alumno.nombre || 'A')[0].toUpperCase()}
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    sx={{ 
                                                        pr: 1,
                                                        overflow: 'hidden',
                                                    }}
                                                    primary={
                                                        <Typography 
                                                            variant="body1" 
                                                            fontWeight="medium"
                                                            noWrap
                                                            sx={{ 
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                            }}
                                                        >
                                                            {alumno.nombre || 'Sin nombre'}
                                                        </Typography>
                                                    }
                                                    secondary={
                                                        <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                                                            <Stack direction="row" spacing={1} alignItems="center">
                                                                <BadgeIcon sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />
                                                                <Typography 
                                                                    variant="body2" 
                                                                    color="text.secondary"
                                                                    noWrap
                                                                    sx={{ 
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                    }}
                                                                >
                                                                    DNI: {alumno.dni || 'N/A'}
                                                                </Typography>
                                                            </Stack>
                                                            {alumno.email && (
                                                                <Stack direction="row" spacing={1} alignItems="center">
                                                                    <EmailIcon sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />
                                                                    <Typography 
                                                                        variant="body2" 
                                                                        color="text.secondary"
                                                                        noWrap
                                                                        sx={{ 
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                        }}
                                                                    >
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
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="outlined">Cerrar</Button>
            </DialogActions>
        </Dialog>
    )
}
