'use client'
import { Box, Button, Stack, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { useCallback, useMemo, useState } from 'react'
import { debounce } from '@/utils/debounce/debounce'
import { CustomBreadcrumbs } from '@/components/ui/breadcrums/CustomBreadcrumbs'
import { SearchBar } from '@/components/ui/search/SearchBar'
import { GenericDataGrid } from '@/components/ui/tables/DataGrid'
import { columnsClases } from '@/const/columns/clases'
import { useUser } from '@/context/UserContext'
import {
    useAddClase,
    useEditClase,
    useDeleteClase,
    useClases,
} from '@/hooks/clases/useClases'
import { GenericModal } from '@/components/ui/modals/GenericModal'
import { notify } from '@/lib/toast'
import { ClaseFormModal } from './ClaseFormModal'
import { ClaseDetalleModal } from './ClaseDetalleModal'
import { api } from '@/lib/api'
import { useQueryClient } from '@tanstack/react-query'
import tableSize from '@/const/tables/tableSize'
import { Clase, ClaseConSesiones, ClasePayload } from '@/models/Clase/Clase'
import { getApiErrorDetail, getApiErrorMessage } from '@/utils/errors/apiError'

export default function ClasesList() {
    const { user } = useUser()
    const gymId = user?.gym_id ?? ''
    const queryClient = useQueryClient()
    
    // role_id: 1 = admin, 2 = receptionist
    const userRole = user?.role_id === 1 ? 'administrator' : 'receptionist'

    const [openAdd, setOpenAdd] = useState(false)
    const [openEdit, setOpenEdit] = useState(false)
    const [editingClase, setEditingClase] = useState<ClaseConSesiones | null>(null)
    const [openDelete, setOpenDelete] = useState(false)
    const [deletingId, setDeletingId] = useState<number | null>(null)
    const [openDetalle, setOpenDetalle] = useState(false)
    const [claseDetalle, setClaseDetalle] = useState<Clase | null>(null)

    const [page, setPage] = useState(1)

    const [q, setQ] = useState('')

    const {
        rows: clases,
        total,
        isFetching,
    } = useClases(gymId, page, tableSize, q)

    const addClase = useAddClase(gymId)
    const editClase = useEditClase(gymId)
    const deleteClase = useDeleteClase(gymId)

    const handleSearchChange = useMemo(
        () =>
            debounce((value: string) => {
                const clean = value.trim()
                setQ(clean)
                setPage(1)
            }, 450),
        []
    )

    const handleAddClase = async (values: ClasePayload) => {
        try {
            const { sesiones, ...claseData } = values

            // Crear la clase (useAddClase ya agrega gym_id)
            const nuevaClase = await addClase.mutateAsync(claseData)

            // Crear las sesiones
            let fallidas = 0
            if (sesiones && sesiones.length > 0) {
                for (const sesion of sesiones) {
                    try {
                        await api.post('/api/sesiones', {
                            ...sesion,
                            clase_id: nuevaClase.id,
                            gym_id: gymId,
                        })
                    } catch (err) {
                        fallidas++
                        console.error('Error creando sesión:', getApiErrorDetail(err))
                    }
                }
                // Invalidar queries para refrescar
                queryClient.invalidateQueries({ queryKey: ['sesiones', nuevaClase.id] })
            }

            setOpenAdd(false)
            if (fallidas > 0) {
                notify.error(`Clase creada, pero ${fallidas} sesión(es) no se pudieron crear`)
            } else {
                notify.success('Clase y sesiones creadas correctamente')
            }
        } catch (error) {
            console.error('Error al añadir clase:', error)
            notify.error(getApiErrorMessage(error) || 'Error al añadir la clase')
        }
    }

    const handleOpenEdit = useCallback(async (clase: Clase) => {
        try {
            const response = await api.get(`/api/sesiones/clase/${clase.id}`)
            setEditingClase({ ...clase, sesiones: response.data || [] })
            setOpenEdit(true)
        } catch (error) {
            console.error('Error cargando sesiones:', error)
            setEditingClase(clase)
            setOpenEdit(true)
        }
    }, [])

    const handleCloseEdit = () => {
        setOpenEdit(false)
        setEditingClase(null)
    }

    const handleEditClase = async (values: ClasePayload) => {
        try {
            const { sesiones, ...claseData } = values
            const id = editingClase?.id
            if (!id) throw new Error('No hay id para editar la clase')

            // Actualizar la clase
            await editClase.mutateAsync({ id, values: claseData })

            // Crear nuevas sesiones (las que tienen ID temporal con Date.now())
            if (sesiones && sesiones.length > 0) {
                const sesionesBD = editingClase?.sesiones || []
                const diasSesionesBD = sesionesBD.map(s => s.dia_semana)

                // ClaseFormModal descarta el id al armar el payload, asi que el unico
                // criterio disponible es el dia: se crean las sesiones de dias libres.
                const sesionesNuevas = sesiones.filter(
                    s => !diasSesionesBD.includes(s.dia_semana)
                )

                for (const sesion of sesionesNuevas) {
                    try {
                        await api.post('/api/sesiones', {
                            ...sesion,
                            clase_id: id,
                            gym_id: gymId,
                        })
                    } catch (err) {
                        console.error('[handleEditClase] Error creando sesión:', getApiErrorDetail(err))
                    }
                }

                // Invalidar queries para refrescar
                queryClient.invalidateQueries({ queryKey: ['sesiones', id] })
            }

            handleCloseEdit()
            notify.success('Clase editada correctamente')
        } catch (error) {
            console.error('Error al editar clase:', error)
            notify.error(getApiErrorMessage(error) || 'Error al editar la clase')
        }
    }

    const handleDelete = useCallback((id: number) => {
        setDeletingId(id)
        setOpenDelete(true)
    }, [])

    const confirmDelete = async () => {
        if (!deletingId) return
        try {
            setOpenDelete(false)
            await deleteClase.mutateAsync(deletingId)
            setDeletingId(null)
            notify.success('Clase eliminada correctamente')
        } catch (error) {
            console.error('Error al eliminar clase:', error)
            notify.error(getApiErrorMessage(error) || 'Error al eliminar la clase')
        }
    }

    const handleVerDetalle = useCallback((clase: Clase) => {
        setClaseDetalle(clase)
        setOpenDetalle(true)
    }, [])

    const columns = useMemo(() => columnsClases(handleOpenEdit, handleDelete, handleVerDetalle), [handleOpenEdit, handleDelete, handleVerDetalle])

    return (
        <Box sx={{ maxWidth: 'xl', mx: 'auto', py: 2 }} className="animate-fade-in">
            <CustomBreadcrumbs
                items={[
                    { label: 'Dashboard', href: `/dashboard/${userRole}` },
                    { label: 'Clases' },
                ]}
            />

            <Box mb={2}>
                <Stack
                    gap={2}
                    direction={{ xs: 'column', md: 'row' }}
                    alignItems="stretch"
                    justifyContent="space-between"
                >
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: 2,
                            flex: 1,
                        }}
                    >
                        <SearchBar
                            value={q}
                            onChange={(val) => handleSearchChange(val)}
                            onSearch={(text) => {
                                setQ(text)
                                setPage(1)
                            }}
                            isLoading={isFetching}
                            placeholder="Buscar clases por nombre o descripción"
                        />
                    </Box>

                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        sx={{
                            whiteSpace: 'nowrap',
                            width: { xs: '100%', md: '300px' },
                            height: '56px',
                        }}
                        onClick={() => setOpenAdd(true)}
                    >
                        Añadir clase
                    </Button>
                </Stack>
            </Box>

            <GenericDataGrid
                rows={clases}
                columns={columns}
                paginationMode="server"
                rowCount={total}
                page={page - 1}
                pageSize={tableSize}
                onPaginationModelChange={({ page: newPage }) => setPage(newPage + 1)}
                loading={isFetching}
            />

            {openAdd && (
                <ClaseFormModal
                    open={openAdd}
                    title="Crear nueva clase"
                    onClose={() => setOpenAdd(false)}
                    onSubmit={handleAddClase}
                    mode="create"
                />
            )}

            {openEdit && editingClase && (
                <ClaseFormModal
                    open={openEdit}
                    title="Editar clase"
                    initialValues={editingClase}
                    onClose={handleCloseEdit}
                    onSubmit={handleEditClase}
                    mode="edit"
                />
            )}

            {openDetalle && claseDetalle && (
                <ClaseDetalleModal
                    open={openDetalle}
                    onClose={() => {
                        setOpenDetalle(false)
                        setClaseDetalle(null)
                    }}
                    clase={claseDetalle}
                    gymId={gymId}
                />
            )}

            <GenericModal
                open={openDelete}
                title="Confirmar eliminación"
                content={<Typography>¿Estás seguro de que deseas eliminar esta clase?</Typography>}
                onClose={() => setOpenDelete(false)}
                onConfirm={confirmDelete}
                confirmText="Eliminar"
                cancelText="Cancelar"
            />
        </Box>
    )
}
