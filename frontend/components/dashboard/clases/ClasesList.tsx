'use client'
import { Box, Button, Stack, CircularProgress, Typography, IconButton } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import VisibilityIcon from '@mui/icons-material/Visibility'
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
import axios from 'axios'
import { useQueryClient } from '@tanstack/react-query'
import tableSize from '@/const/tables/tableSize'

export default function ClasesList() {
    const { user, loading: userLoading } = useUser()
    const gymId = user?.gym_id ?? ''
    const queryClient = useQueryClient()
    
    // role_id: 1 = admin, 2 = receptionist
    const userRole = user?.role_id === 1 ? 'administrator' : 'receptionist'

    const [openAdd, setOpenAdd] = useState(false)
    const [openEdit, setOpenEdit] = useState(false)
    const [editingClase, setEditingClase] = useState<any | null>(null)
    const [openDelete, setOpenDelete] = useState(false)
    const [deletingId, setDeletingId] = useState<number | null>(null)
    const [openDetalle, setOpenDetalle] = useState(false)
    const [claseDetalle, setClaseDetalle] = useState<any | null>(null)

    const [page, setPage] = useState(1)

    const [q, setQ] = useState('')

    const {
        rows: clases,
        total,
        isLoading,
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

    const handleAddClase = async (values: any) => {
        try {
            const { sesiones, ...claseData } = values
            
            // Crear la clase
            const nuevaClase = await addClase.mutateAsync({ ...claseData, gym_id: gymId })

            // Crear las sesiones
            if (sesiones && sesiones.length > 0) {
                for (const sesion of sesiones) {
                    try {
                        await axios.post(
                            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/sesiones`,
                            {
                                ...sesion,
                                clase_id: nuevaClase.id,
                                gym_id: gymId,
                            }
                        )
                    } catch (err: any) {
                        console.error('Error creando sesión:', err.response?.data || err.message)
                    }
                }
                // Invalidar queries para refrescar
                queryClient.invalidateQueries({ queryKey: ['sesiones', nuevaClase.id] })
            }
            
            setOpenAdd(false)
            notify.success('Clase y sesiones creadas correctamente')
        } catch (error: any) {
            console.error('Error al añadir clase:', error)
            notify.error(error.response?.data?.error || 'Error al añadir la clase')
        }
    }

    const handleOpenEdit = useCallback(async (clase: any) => {
        try {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/sesiones/clase/${clase.id}`
            )
            setEditingClase({ ...clase, sesiones: response.data || [] })
            setOpenEdit(true)
        } catch (error) {
            console.error('Error cargando sesiones:', error)
            setEditingClase(clase)
            setOpenEdit(true)
        }
    }, [gymId])

    const handleCloseEdit = () => {
        setOpenEdit(false)
        setEditingClase(null)
    }

    const handleEditClase = async (values: any) => {
        try {
            const { sesiones, ...claseData } = values
            const id = editingClase?.id
            if (!id) throw new Error('No hay id para editar la clase')
            
            // Actualizar la clase
            await editClase.mutateAsync({ id, values: claseData })

            // Crear nuevas sesiones (las que tienen ID temporal con Date.now())
            if (sesiones && sesiones.length > 0) {
                const sesionesBD = editingClase?.sesiones || []
                const idsSesionesBD = sesionesBD.map((s: any) => s.id)
                const diasSesionesBD = sesionesBD.map((s: any) => s.dia_semana)

                const sesionesNuevas = sesiones.filter((s: any) => {
                    const esNueva = !idsSesionesBD.includes(s.id)
                    const diaNoOcupado = !diasSesionesBD.includes(s.dia_semana)
                    return esNueva && diaNoOcupado
                })

                for (const sesion of sesionesNuevas) {
                    try {
                        await axios.post(
                            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/sesiones`,
                            {
                                ...sesion,
                                clase_id: id,
                                gym_id: gymId,
                            }
                        )
                    } catch (err: any) {
                        console.error('[handleEditClase] Error creando sesión:', err.response?.data || err.message)
                    }
                }
                
                // Invalidar queries para refrescar
                queryClient.invalidateQueries({ queryKey: ['sesiones', id] })
            }
            
            handleCloseEdit()
            notify.success('Clase editada correctamente')
        } catch (error: any) {
            console.error('Error al editar clase:', error)
            notify.error(error.response?.data?.error || 'Error al editar la clase')
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
        } catch (error: any) {
            console.error('Error al eliminar clase:', error)
            notify.error(error.response?.data?.error || 'Error al eliminar la clase')
        }
    }

    const handleVerDetalle = useCallback((clase: any) => {
        setClaseDetalle(clase)
        setOpenDetalle(true)
    }, [])

    const columns = useMemo(() => columnsClases(handleOpenEdit, handleDelete, handleVerDetalle), [handleOpenEdit, handleDelete, handleVerDetalle])

    if (userLoading || isLoading) {
        return <Box sx={{ textAlign: 'center', mt: 4 }}><CircularProgress /></Box>
    }

    return (
        <Box sx={{ maxWidth: 'xl', mx: 'auto', py: 2 }}>
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
