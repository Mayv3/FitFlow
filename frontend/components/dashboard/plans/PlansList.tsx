

'use client'
import { Box, Button, Stack, CircularProgress, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { useMemo, useState } from 'react'
import { debounce } from '@/utils/debounce/debounce'
import { CustomBreadcrumbs } from '@/components/ui/breadcrums/CustomBreadcrumbs'
import { SearchBar } from '@/components/ui/search/SearchBar'
import { GenericDataGrid } from '@/components/ui/tables/DataGrid'
import { columnsPlans } from '@/const/columns/plans'
import { useUser } from '@/context/UserContext'
import { FormModal } from '@/components/ui/modals/FormModal'
import { getInputFieldsPlans, layoutPlans } from '@/const/inputs/plans'
import {
    useAddPlan,
    useEditPlan,
    useDeletePlan,
    usePlanesPrecios,
} from '@/hooks/plans/usePlanesPrecios'
import { GenericModal } from '@/components/ui/modals/GenericModal'
import { notify } from '@/lib/toast'

export default function PlansList() {
    const { user, loading: userLoading } = useUser()
    const gymId = user?.gym_id ?? ''

    const [openAdd, setOpenAdd] = useState(false)
    const [openEdit, setOpenEdit] = useState(false)
    const [editingPlan, setEditingPlan] = useState<any | null>(null)
    const [openDelete, setOpenDelete] = useState(false)
    const [deletingId, setDeletingId] = useState<number | null>(null)

    const [page, setPage] = useState(1)
    const pageSize = 20
    const [q, setQ] = useState('')

    const {
        rows: planes,
        total,
        isLoading,
        isFetching,
    } = usePlanesPrecios(gymId, page, pageSize, q)

    const addPlan = useAddPlan(gymId)
    const editPlan = useEditPlan(gymId)
    const deletePlan = useDeletePlan(gymId)


    const handleSearchChange = useMemo(
        () =>
            debounce((value: string) => {
                const clean = value.trim()
                setQ(clean)
                setPage(1)
            }, 450),
        []
    )

    const handleAddPlan = async (values: any) => {
        try {
            await addPlan.mutateAsync({ ...values, gym_id: gymId })
            setOpenAdd(false)
            notify.success('Plan añadido correctamente')
        } catch (error) {
            console.error('Error al añadir plan:', error)
            notify.error('❌ Error al añadir el plan')
        }
    }

    const handleOpenEdit = (plan: any) => {
        setEditingPlan(plan)
        setOpenEdit(true)
    }

    const handleCloseEdit = () => {
        setOpenEdit(false)
        setEditingPlan(null)
    }

    const handleEditPlan = async (values: any) => {
        try {
            const id = editingPlan?.id
            if (!id) throw new Error('No hay id para editar el plan')
            handleCloseEdit()
            await editPlan.mutateAsync({ id, values })
            notify.success('Plan editado correctamente')
        } catch (error) {
            console.error('Error al editar plan:', error)
            notify.error('Error al editar el plan')
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
            await deletePlan.mutateAsync(deletingId)
            setDeletingId(null)
            notify.success('Plan eliminado correctamente')
        } catch (error) {
            console.error('Error al eliminar plan:', error)
            notify.error('Error al eliminar el plan')
        }
    }

    const columns = useMemo(() => columnsPlans(handleOpenEdit, handleDelete), [handleOpenEdit])

    if (userLoading || isLoading) {
        return <Box sx={{ textAlign: 'center', mt: 4 }}><CircularProgress /></Box>
    }


    return (
        <Box sx={{ maxWidth: 'xl', mx: 'auto', py: 2 }}>
            <CustomBreadcrumbs
                items={[
                    { label: 'Dashboard', href: '/dashboard/receptionist' },
                    { label: 'Planes' },
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
                            placeholder="Buscar planes"
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
                        Añadir plan
                    </Button>
                </Stack>
            </Box>

            <GenericDataGrid
                rows={planes}
                columns={columns}
                paginationMode="client"
                rowCount={total}
                loading={isFetching}
            />

            {openAdd && (
                <FormModal
                    open={openAdd}
                    title="Añadir un plan"
                    fields={getInputFieldsPlans()}
                    initialValues={null}
                    onClose={() => setOpenAdd(false)}
                    onSubmit={handleAddPlan}
                    confirmText="Guardar"
                    cancelText="Cancelar"
                    gridColumns={12}
                    gridGap={16}
                    mode="create"
                    layout={layoutPlans}
                    gymId={gymId}
                />
            )}

            {openEdit && editingPlan && (
                <FormModal
                    open={openEdit}
                    title="Editar plan"
                    fields={getInputFieldsPlans()}
                    gridColumns={12}
                    gridGap={16}
                    initialValues={editingPlan}
                    onClose={handleCloseEdit}
                    onSubmit={handleEditPlan}
                    confirmText="Guardar cambios"
                    mode="edit"
                    cancelText="Cancelar"
                    layout={layoutPlans}
                />
            )}

            <GenericModal
                open={openDelete}
                title="Confirmar eliminación"
                content={<Typography>¿Estás seguro de que deseas eliminar este plan?</Typography>}
                onClose={() => setOpenDelete(false)}
                onConfirm={confirmDelete}
                confirmText="Eliminar"
                cancelText="Cancelar"
            />
        </Box>
    )
}
