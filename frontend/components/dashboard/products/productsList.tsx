'use client'

import { Box, Button, Stack, CircularProgress, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { useMemo, useState } from 'react'
import { debounce } from '@/utils/debounce/debounce'
import { CustomBreadcrumbs } from '@/components/ui/breadcrums/CustomBreadcrumbs'
import { SearchBar } from '@/components/ui/search/SearchBar'
import { GenericDataGrid } from '@/components/ui/tables/DataGrid'
import { columnsProducts } from '@/const/columns/products'
import { useUser } from '@/context/UserContext'
import { FormModal } from '@/components/ui/modals/FormModal'
import { getInputFieldsProducts, layoutProducts } from '@/const/inputs/products'
import {
  useAddProduct,
  useEditProduct,
  useDeleteProduct,
  useProducts,
} from '@/hooks/products/useProducts'
import { GenericModal } from '@/components/ui/modals/GenericModal'
import { notify } from '@/lib/toast'
import tableSize from '@/const/tables/tableSize'

export default function ProductsList() {
  const { user, loading: userLoading } = useUser()
  const gymId = user?.gym_id ?? ''

  const [openAdd, setOpenAdd] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any | null>(null)
  const [openDelete, setOpenDelete] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')

  const {
    data,
    isLoading,
    isFetching,
  } = useProducts(gymId, page, tableSize, q)

  const products = data?.items ?? []
  const total = data?.total ?? 0

  const addProduct = useAddProduct(gymId)
  const editProduct = useEditProduct(gymId)
  const deleteProduct = useDeleteProduct(gymId)

  const handleSearchChange = useMemo(
    () =>
      debounce((value: string) => {
        const clean = value.trim()
        setQ(clean)
        setPage(1)
      }, 450),
    []
  )

  const handleAddProduct = async (values: any) => {
    try {
      await addProduct.mutateAsync({ ...values, gym_id: gymId })
      setOpenAdd(false)
      notify.success('Producto añadido correctamente')
    } catch (error) {
      console.error('Error al añadir producto:', error)
      notify.error('❌ Error al añadir el producto')
    }
  }

  const handleOpenEdit = (product: any) => {
    setEditingProduct(product)
    setOpenEdit(true)
  }

  const handleCloseEdit = () => {
    setOpenEdit(false)
    setEditingProduct(null)
  }

  const handleEditProduct = async (values: any) => {
    try {
      const id = editingProduct?.id
      if (!id) throw new Error('No hay id para editar el producto')
      handleCloseEdit()
      await editProduct.mutateAsync({ id, values })
      notify.success('Producto editado correctamente')
    } catch (error) {
      console.error('Error al editar producto:', error)
      notify.error('Error al editar el producto')
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
      await deleteProduct.mutateAsync(deletingId)
      setDeletingId(null)
      notify.success('Producto eliminado correctamente')
    } catch (error) {
      console.error('Error al eliminar producto:', error)
      notify.error('Error al eliminar el producto')
    }
  }

  const columns = useMemo(
    () => columnsProducts(handleOpenEdit, handleDelete),
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
          { label: 'Productos' },
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
              placeholder="Buscar productos"
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
            Añadir producto
          </Button>
        </Stack>
      </Box>

      <GenericDataGrid
        rows={products}
        columns={columns}
        paginationMode="server"
        rowCount={total}
        page={page - 1}
        pageSize={tableSize}
        onPaginationModelChange={({ page: newPage }) =>
          setPage(newPage + 1)
        }
        loading={isFetching}
      />

      {openAdd && (
        <FormModal
          open={openAdd}
          title="Añadir un producto"
          fields={getInputFieldsProducts()}
          initialValues={null}
          onClose={() => setOpenAdd(false)}
          onSubmit={handleAddProduct}
          confirmText="Guardar"
          cancelText="Cancelar"
          gridColumns={12}
          gridGap={16}
          mode="create"
          layout={layoutProducts}
          gymId={gymId}
        />
      )}

      {openEdit && editingProduct && (
        <FormModal
          open={openEdit}
          title="Editar producto"
          fields={getInputFieldsProducts()}
          gridColumns={12}
          gridGap={16}
          initialValues={editingProduct}
          onClose={handleCloseEdit}
          onSubmit={handleEditProduct}
          confirmText="Guardar cambios"
          mode="edit"
          cancelText="Cancelar"
          layout={layoutProducts}
        />
      )}

      <GenericModal
        open={openDelete}
        title="Confirmar eliminación"
        content={
          <Typography>
            ¿Estás seguro de que deseas eliminar este producto?
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
