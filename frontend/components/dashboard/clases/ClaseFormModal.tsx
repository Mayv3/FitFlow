'use client'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    TextField,
    Stack,
    IconButton,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
    List,
    ListItem,
    ListItemText,
    Divider,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { useState, useEffect } from 'react'
import { getDiaNombre } from '@/const/inputs/sesiones'
import axios from 'axios'
import { notify } from '@/lib/toast'
import { ColorPickerPopover } from '@/components/ui/colorSelector/colorSelector'

const DIAS_SEMANA = [
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' },
    { value: 0, label: 'Domingo' },
]

// Función para formatear hora a HH:MM
const formatHora = (hora: string): string => {
    if (!hora) return ''
    // Si viene con segundos (HH:MM:SS), quitar los segundos
    const parts = hora.split(':')
    return `${parts[0]}:${parts[1]}`
}

interface ClaseFormModalProps {
    open: boolean
    onClose: () => void
    onSubmit: (values: any) => void
    initialValues?: any
    mode: 'create' | 'edit'
    title: string
}

export function ClaseFormModal({
    open,
    onClose,
    onSubmit,
    initialValues,
    mode,
    title,
}: ClaseFormModalProps) {
    const [nombre, setNombre] = useState('')
    const [descripcion, setDescripcion] = useState('')
    const [capacidadDefault, setCapacidadDefault] = useState(20)
    const [color, setColor] = useState('#1976d2')
    const [sesiones, setSesiones] = useState<any[]>([])
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [sesionToDelete, setSesionToDelete] = useState<number | null>(null)
    const [editingSesion, setEditingSesion] = useState<any | null>(null)

    // Formulario de nueva sesión
    const [diaSemana, setDiaSemana] = useState<number>(1)
    const [horaInicio, setHoraInicio] = useState('09:00')
    const [capacidad, setCapacidad] = useState(20)

    // Actualizar estado cuando cambian los initialValues
    useEffect(() => {
        if (initialValues) {
            setNombre(initialValues.nombre || '')
            setDescripcion(initialValues.descripcion || '')
            setCapacidadDefault(initialValues.capacidad_default || 20)
            setColor(initialValues.color || '#1976d2')
            setSesiones(initialValues.sesiones || [])
            setCapacidad(initialValues.capacidad_default || 20)
        } else {
            // Reset al crear nueva clase
            setNombre('')
            setDescripcion('')
            setCapacidadDefault(20)
            setColor('#1976d2')
            setSesiones([])
            setCapacidad(20)
        }
    }, [initialValues, open])

    const handleAddSesion = () => {
        if (!horaInicio) return

        if (editingSesion) {
            // Actualizar sesión existente
            const esSesionBD = editingSesion.id < 1000000000000
            
            if (esSesionBD && mode === 'edit') {
                // Actualizar en el backend
                axios.put(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/sesiones/${editingSesion.id}`,
                    {
                        dia_semana: diaSemana,
                        hora_inicio: horaInicio,
                        capacidad: capacidad,
                    }
                ).then(() => {
                    notify.success('Sesión actualizada correctamente')
                }).catch((error) => {
                    console.error('Error actualizando sesión:', error)
                    notify.error('Error al actualizar la sesión')
                })
            }

            // Actualizar en el estado local
            setSesiones(sesiones.map(s => 
                s.id === editingSesion.id 
                    ? { ...s, dia_semana: diaSemana, hora_inicio: horaInicio, capacidad: capacidad }
                    : s
            ))
            
            setEditingSesion(null)
        } else {
            // Crear nueva sesión
            const nuevaSesion = {
                id: Date.now(), // ID temporal
                dia_semana: diaSemana,
                hora_inicio: horaInicio,
                capacidad: capacidad,
            }

            setSesiones([...sesiones, nuevaSesion])
        }

        // Reset form
        setDiaSemana(1)
        setHoraInicio('09:00')
        setCapacidad(capacidadDefault)
    }

    const handleEditSesion = (sesion: any) => {
        setEditingSesion(sesion)
        setDiaSemana(sesion.dia_semana)
        setHoraInicio(sesion.hora_inicio)
        setCapacidad(sesion.capacidad)
    }

    const handleCancelEdit = () => {
        setEditingSesion(null)
        setDiaSemana(1)
        setHoraInicio('09:00')
        setCapacidad(capacidadDefault)
    }

    const handleRemoveSesion = async (id: number) => {
        // Si el ID es menor a 1000000000000 (timestamp), es una sesión de BD
        const esSesionBD = id < 1000000000000
        
        if (esSesionBD && mode === 'edit') {
            // Mostrar modal de confirmación
            setSesionToDelete(id)
            setConfirmDelete(true)
        } else {
            // Eliminar directamente del estado local
            setSesiones(sesiones.filter(s => s.id !== id))
        }
    }

    const handleConfirmDelete = async () => {
        if (sesionToDelete === null) return
        
        try {
            await axios.delete(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/sesiones/${sesionToDelete}`
            )
            
            // Eliminar del estado local
            setSesiones(sesiones.filter(s => s.id !== sesionToDelete))
            
            notify.success('Sesión eliminada correctamente')
        } catch (error: any) {
            console.error('Error eliminando sesión:', error)
            notify.error(error.response?.data?.error || 'Error al eliminar la sesión')
        } finally {
            setConfirmDelete(false)
            setSesionToDelete(null)
        }
    }

    const handleCancelDelete = () => {
        setConfirmDelete(false)
        setSesionToDelete(null)
    }

    // Obtener los días que ya tienen sesiones
    const diasOcupados = sesiones.map(s => s.dia_semana)
    
    // Verificar si un día ya está ocupado
    const isDiaOcupado = (dia: number) => diasOcupados.includes(dia)

    const handleSubmit = () => {
        const values = {
            nombre,
            descripcion,
            capacidad_default: capacidadDefault,
            color,
            sesiones: sesiones.map(s => ({
                dia_semana: s.dia_semana,
                hora_inicio: s.hora_inicio,
                hora_fin: s.hora_fin,
                capacidad: s.capacidad,
            })),
        }

        onSubmit(values)
    }

    const isValid = nombre.trim().length >= 3 && capacidadDefault > 0

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="sm" 
            fullWidth
            sx={{
                '& .MuiDialog-paper': {
                    m: { xs: 1, sm: 2 },
                    maxHeight: { xs: '95vh', sm: '90vh' },
                },
            }}
        >
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <Stack spacing={3} sx={{ mt: 1 }}>
                    {/* Datos básicos */}
                    <Box>
                        <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                            Datos de la clase
                        </Typography>
                        <Stack spacing={2}>
                            <TextField
                                label="Nombre de la clase"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                required
                                fullWidth
                                placeholder="Ej: Yoga, Spinning, CrossFit"
                            />
                            <TextField
                                label="Descripción"
                                value={descripcion}
                                onChange={(e) => {
                                    const value = e.target.value
                                    if (value.length <= 20) {
                                        setDescripcion(value)
                                    }
                                }}
                                fullWidth
                                multiline
                                rows={2}
                                placeholder="Descripción de la clase"
                                helperText={`${descripcion.length}/20 caracteres`}
                                inputProps={{ maxLength: 20 }}
                            />
                            <Stack direction="row" spacing={2}>
                                <TextField
                                    label="Capacidad por defecto"
                                    type="number"
                                    value={capacidadDefault}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value) || 0
                                        setCapacidadDefault(val)
                                        setCapacidad(val)
                                    }}
                                    required
                                    fullWidth
                                />
                                <Box sx={{ width: '100%' }}>
                                    <ColorPickerPopover
                                        value={color}
                                        onChange={(c) => setColor(c)}
                                        label="Color"
                                    />
                                </Box>
                            </Stack>
                        </Stack>
                    </Box>

                    <Divider />

                    {/* Sesiones */}
                    <Box>
                        <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                            Sesiones de la clase
                        </Typography>
                        
                        {/* Formulario para agregar/editar sesión */}
                        <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1, mb: 2 }}>
                            {editingSesion && (
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                    <Typography variant="body2" color="primary" fontWeight="medium">
                                        Editando sesión
                                    </Typography>
                                    <Button size="small" onClick={handleCancelEdit}>
                                        Cancelar
                                    </Button>
                                </Stack>
                            )}
                            <Stack spacing={2}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Día de la semana</InputLabel>
                                    <Select
                                        value={diaSemana}
                                        label="Día de la semana"
                                        onChange={(e) => setDiaSemana(Number(e.target.value))}
                                    >
                                        {DIAS_SEMANA.map((dia) => (
                                            <MenuItem 
                                                key={dia.value} 
                                                value={dia.value}
                                                disabled={isDiaOcupado(dia.value)}
                                            >
                                                {dia.label} {isDiaOcupado(dia.value) ? '(ya tiene sesión)' : ''}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <Stack direction="row" spacing={2}>
                                    <TextField
                                        label="Hora de inicio"
                                        type="time"
                                        value={horaInicio}
                                        onChange={(e) => setHoraInicio(e.target.value)}
                                        size="small"
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                        inputProps={{ step: 300 }}
                                    />
                                    <TextField
                                        label="Capacidad"
                                        type="number"
                                        value={capacidad}
                                        onChange={(e) => setCapacidad(parseInt(e.target.value) || 0)}
                                        size="small"
                                        fullWidth
                                    />
                                </Stack>

                                <Button
                                    variant="outlined"
                                    startIcon={editingSesion ? undefined : <AddIcon />}
                                    onClick={handleAddSesion}
                                    fullWidth
                                    disabled={!editingSesion && isDiaOcupado(diaSemana)}
                                >
                                    {editingSesion 
                                        ? 'Guardar cambios' 
                                        : isDiaOcupado(diaSemana) 
                                            ? 'Día ya ocupado' 
                                            : 'Añadir sesión'}
                                </Button>
                            </Stack>
                        </Box>

                        {/* Lista de sesiones */}
                        {sesiones.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                                No hay sesiones agregadas. Añade al menos una sesión.
                            </Typography>
                        ) : (
                            <List dense>
                                {sesiones
                                    .sort((a, b) => {
                                        if (a.dia_semana !== b.dia_semana) return a.dia_semana - b.dia_semana
                                        return a.hora_inicio.localeCompare(b.hora_inicio)
                                    })
                                    .map((sesion) => (
                                        <ListItem
                                            key={sesion.id}
                                            secondaryAction={
                                                <Stack direction="row" spacing={0.5}>
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        onClick={() => handleEditSesion(sesion)}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleRemoveSesion(sesion.id)}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Stack>
                                            }
                                            sx={{ bgcolor: 'background.default', mb: 1, borderRadius: 1 }}
                                        >
                                            <ListItemText
                                                primary={
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <Chip
                                                            label={getDiaNombre(sesion.dia_semana)}
                                                            size="small"
                                                            color="primary"
                                                        />
                                                        <Typography variant="body2">
                                                            {formatHora(sesion.hora_inicio)}
                                                        </Typography>
                                                    </Stack>
                                                }
                                                secondary={`Capacidad: ${sesion.capacidad} personas`}
                                            />
                                        </ListItem>
                                    ))}
                            </List>
                        )}
                    </Box>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={!isValid}
                >
                    {mode === 'create' ? 'Crear clase' : 'Guardar cambios'}
                </Button>
            </DialogActions>

            {/* Modal de confirmación de eliminación */}
            <Dialog
                open={confirmDelete}
                onClose={handleCancelDelete}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>¿Eliminar sesión?</DialogTitle>
                <DialogContent>
                    <Typography>
                        ¿Estás seguro de eliminar esta sesión? Se eliminarán también todas las inscripciones.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelDelete}>Cancelar</Button>
                    <Button onClick={handleConfirmDelete} color="error" variant="contained">
                        Eliminar
                    </Button>
                </DialogActions>
            </Dialog>
        </Dialog>
    )
}
