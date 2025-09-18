'use client'

import { Box, Button, Stack, CircularProgress, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { useMemo, useState } from 'react'
import { debounce } from '@/utils/debounce/debounce'
import { CustomBreadcrumbs } from '@/components/ui/breadcrums/CustomBreadcrumbs'
import { SearchBar } from '@/components/ui/search/SearchBar'
import { GenericDataGrid } from '@/components/ui/tables/DataGrid'
import { columnsServices } from '@/const/columns/services'
import { useUser } from '@/context/UserContext'
import { FormModal } from '@/components/ui/modals/FormModal'
import { getInputFieldsServices, layoutServices } from '@/const/inputs/services'
import {
  useAddService,
  useEditService,
  useDeleteService,
  useServices,
} from '@/hooks/services/useServices'
import { GenericModal } from '@/components/ui/modals/GenericModal'
import { notify } from '@/lib/toast'

export default function ServicesList() {
  const { user, loading: userLoading } = useUser()
  const gymId = user?.gym_id ?? ''

  const [openAdd, setOpenAdd] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [editingService, setEditingService] = useState<any | null>(null)
  const [openDelete, setOpenDelete] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [page, setPage] = useState(1)
  const pageSize = 20
  const [q, setQ] = useState('')

  const {
    data,
    isLoading,
    isFetching,
  } = useServices(gymId, page, pageSize, q)

  const services = data?.items ?? []
  const total = data?.total ?? 0

  const addService = useAddService(gymId)
  const editService = useEditService(gymId)
  const deleteService = useDeleteService(gymId)

  const handleSearchChange = useMemo(
    () =>
      debounce((value: string) => {
        const clean = value.trim()
        setQ(clean)
        setPage(1)
      }, 450),
    []
  )

  const handleAddService = async (values: any) => {
    try {
      await addService.mutateAsync({ ...values, gym_id: gymId })
      setOpenAdd(false)
      notify.success('Servicio añadido correctamente')
    } catch (error) {
      console.error('Error al añadir servicio:', error)
      notify.error('❌ Error al añadir el servicio')
    }
  }

  const handleOpenEdit = (service: any) => {
    setEditingService(service)
    setOpenEdit(true)
  }

  const handleCloseEdit = () => {
    setOpenEdit(false)
    setEditingService(null)
  }

  const handleEditService = async (values: any) => {
    try {
      const id = editingService?.id
      if (!id) throw new Error('No hay id para editar el servicio')
      handleCloseEdit()
      await editService.mutateAsync({ id, values })
      notify.success('Servicio editado correctamente')
    } catch (error) {
      console.error('Error al editar servicio:', error)
      notify.error('Error al editar el servicio')
    }
  }

  const handleDelete = (id: string) => {
    setDeletingId(id)
    setOpenDelete(true)
  }

  const confirmDelete = async () => {
    if (!deletingId) return
    try {
      setOpenDelete(false)
      await deleteService.mutateAsync(deletingId)
      setDeletingId(null)
      notify.success('Servicio eliminado correctamente')
    } catch (error) {
      console.error('Error al eliminar servicio:', error)
      notify.error('Error al eliminar el servicio')
    }
  }

  const columns = useMemo(
    () => columnsServices(handleOpenEdit, handleDelete),
    [handleOpenEdit]
  )

  if (userLoading || isLoading) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 'xl', mx: 'auto', py: 2 }}>
      <CustomBreadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard/receptionist' },
          { label: 'Servicios' },
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
              placeholder="Buscar servicios"
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
            Añadir servicio
          </Button>
        </Stack>
      </Box>

      <GenericDataGrid
        rows={services}
        columns={columns}
        paginationMode="server"
        rowCount={total}
        page={page - 1}
        pageSize={pageSize}
        onPaginationModelChange={({ page: newPage }) =>
          setPage(newPage + 1)
        }
        loading={isFetching}
      />

      {openAdd && (
        <FormModal
          open={openAdd}
          title="Añadir un servicio"
          fields={getInputFieldsServices()}
          initialValues={null}
          onClose={() => setOpenAdd(false)}
          onSubmit={handleAddService}
          confirmText="Guardar"
          cancelText="Cancelar"
          gridColumns={12}
          gridGap={16}
          mode="create"
          layout={layoutServices}
          gymId={gymId}
        />
      )}

      {openEdit && editingService && (
        <FormModal
          open={openEdit}
          title="Editar servicio"
          fields={getInputFieldsServices()}
          gridColumns={12}
          gridGap={16}
          initialValues={editingService}
          onClose={handleCloseEdit}
          onSubmit={handleEditService}
          confirmText="Guardar cambios"
          mode="edit"
          cancelText="Cancelar"
          layout={layoutServices}
        />
      )}

      <GenericModal
        open={openDelete}
        title="Confirmar eliminación"
        content={
          <Typography>
            ¿Estás seguro de que deseas eliminar este servicio?
          </Typography>
        }
        onClose={() => setOpenDelete(false)}
        onConfirm={confirmDelete}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </Box>
  )
}
