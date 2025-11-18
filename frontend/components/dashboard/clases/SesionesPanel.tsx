'use client'
import { Box, Button, Stack, Typography, IconButton, Chip, Table, TableBody, TableCell, TableHead, TableRow, Paper } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import { useState } from 'react'
import { FormModal } from '@/components/ui/modals/FormModal'
import { GenericModal } from '@/components/ui/modals/GenericModal'
import { getInputFieldsSesiones, layoutSesiones, getDiaNombre } from '@/const/inputs/sesiones'
import {
    useSesionesByClase,
    useAddSesion,
    useEditSesion,
    useDeleteSesion,
    useInscribirAlumno,
    useDesinscribirAlumno,
} from '@/hooks/sesiones/useSesiones'
import { notify } from '@/lib/toast'
import { InscripcionesModal } from './InscripcionesModal'

interface SesionesPanelProps {
    claseId: number
    gymId: string
}

export function SesionesPanel({ claseId, gymId }: SesionesPanelProps) {
    const [openAdd, setOpenAdd] = useState(false)
    const [openEdit, setOpenEdit] = useState(false)
    const [editingSesion, setEditingSesion] = useState<any | null>(null)
    const [openDelete, setOpenDelete] = useState(false)
    const [deletingId, setDeletingId] = useState<number | null>(null)
    const [openInscripciones, setOpenInscripciones] = useState(false)
    const [selectedSesion, setSelectedSesion] = useState<any | null>(null)

    const { data: sesiones = [], isLoading } = useSesionesByClase(claseId)
    const addSesion = useAddSesion(claseId)
    const editSesion = useEditSesion(claseId)
    const deleteSesion = useDeleteSesion(claseId)
    const inscribirAlumno = useInscribirAlumno(claseId)
    const desinscribirAlumno = useDesinscribirAlumno(claseId)

    const handleAddSesion = async (values: any) => {
        try {
            await addSesion.mutateAsync({ ...values, clase_id: claseId, gym_id: gymId })
            setOpenAdd(false)
            notify.success('Sesión añadida correctamente')
        } catch (error: any) {
            console.error('Error al añadir sesión:', error)
            notify.error(error.response?.data?.error || 'Error al añadir la sesión')
        }
    }

    const handleOpenEdit = (sesion: any) => {
        setEditingSesion(sesion)
        setOpenEdit(true)
    }

    const handleEditSesion = async (values: any) => {
        try {
            const id = editingSesion?.id
            if (!id) throw new Error('No hay id para editar la sesión')
            await editSesion.mutateAsync({ id, values: { ...values, gym_id: gymId } })
            setOpenEdit(false)
            setEditingSesion(null)
            notify.success('Sesión editada correctamente')
        } catch (error: any) {
            console.error('Error al editar sesión:', error)
            notify.error(error.response?.data?.error || 'Error al editar la sesión')
        }
    }

    const handleDelete = (id: number) => {
        setDeletingId(id)
        setOpenDelete(true)
    }

    const confirmDelete = async () => {
        if (!deletingId) return
        try {
            setOpenDelete(false)
            await deleteSesion.mutateAsync({ id: deletingId, gym_id: gymId })
            setDeletingId(null)
            notify.success('Sesión eliminada correctamente')
        } catch (error: any) {
            console.error('Error al eliminar sesión:', error)
            notify.error(error.response?.data?.error || 'Error al eliminar la sesión')
        }
    }

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

    if (isLoading) {
        return <Typography>Cargando sesiones...</Typography>
    }

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Sesiones de la clase</Typography>
                <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenAdd(true)}
                >
                    Añadir sesión
                </Button>
            </Stack>

            {sesiones.length === 0 ? (
                <Typography color="text.secondary">No hay sesiones creadas para esta clase</Typography>
            ) : (
                <Paper variant="outlined">
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Día</TableCell>
                                <TableCell>Horario</TableCell>
                                <TableCell align="center">Capacidad</TableCell>
                                <TableCell align="center">Inscritos</TableCell>
                                <TableCell align="center">Disponibles</TableCell>
                                <TableCell align="center">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sesiones.map((sesion) => (
                                <TableRow key={sesion.id}>
                                    <TableCell>
                                        <Chip label={getDiaNombre(sesion.dia_semana)} size="small" />
                                    </TableCell>
                                    <TableCell>
                                        {sesion.hora_inicio} - {sesion.hora_fin}
                                    </TableCell>
                                    <TableCell align="center">{sesion.capacidad}</TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={sesion.capacidad_actual || 0}
                                            size="small"
                                            color={sesion.capacidad_actual === sesion.capacidad ? 'error' : 'primary'}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        {sesion.capacidad - (sesion.capacidad_actual || 0)}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Stack direction="row" spacing={0.5} justifyContent="center">
                                            <IconButton
                                                size="small"
                                                color="success"
                                                onClick={() => handleOpenInscripciones(sesion)}
                                                title="Gestionar inscripciones"
                                            >
                                                <PersonAddIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                onClick={() => handleOpenEdit(sesion)}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleDelete(sesion.id)}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Paper>
            )}

            {openAdd && (
                <FormModal
                    open={openAdd}
                    title="Añadir sesión"
                    fields={getInputFieldsSesiones()}
                    initialValues={{}}
                    onClose={() => setOpenAdd(false)}
                    onSubmit={handleAddSesion}
                    confirmText="Guardar"
                    cancelText="Cancelar"
                    gridColumns={12}
                    gridGap={16}
                    mode="create"
                    layout={layoutSesiones}
                />
            )}

            {openEdit && editingSesion && (
                <FormModal
                    open={openEdit}
                    title="Editar sesión"
                    fields={getInputFieldsSesiones()}
                    gridColumns={12}
                    gridGap={16}
                    initialValues={editingSesion}
                    onClose={() => {
                        setOpenEdit(false)
                        setEditingSesion(null)
                    }}
                    onSubmit={handleEditSesion}
                    confirmText="Guardar cambios"
                    mode="edit"
                    cancelText="Cancelar"
                    layout={layoutSesiones}
                />
            )}

            <GenericModal
                open={openDelete}
                title="Confirmar eliminación"
                content={<Typography>¿Estás seguro de que deseas eliminar esta sesión?</Typography>}
                onClose={() => setOpenDelete(false)}
                onConfirm={confirmDelete}
                confirmText="Eliminar"
                cancelText="Cancelar"
            />

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
        </Box>
    )
}
