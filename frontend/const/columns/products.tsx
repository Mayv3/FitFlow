import { Box, Chip, IconButton } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'

const ARS = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})

const center = { align: 'center' as const, headerAlign: 'center' as const }

const CATEGORY_COLORS: Record<string, 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'> = {
  'Suplementos': 'primary',
  'Bebidas': 'info',
  'Merchandising': 'secondary',
  'Accesorios': 'warning',
  'Alimentos': 'success',
  'Otros': 'error',
}

const getCategoryColor = (categoria: string) => CATEGORY_COLORS[categoria] ?? 'primary'

export const columnsProducts = (
  handleEdit: (product: any) => void,
  handleDelete: (id: string) => void
): GridColDef[] => [
    {
      field: 'nombre',
      headerName: 'Nombre',
      flex: 0.25,
      ...center,
      renderCell: (p) => p.row?.nombre ?? '—',
    },
    {
      field: 'descripcion',
      headerName: 'Descripción',
      flex: 0.3,
      ...center,
      renderCell: (p) => p.row?.descripcion ?? '—',
    },
    {
      field: 'categoria',
      headerName: 'Categoría',
      flex: 0.15,
      ...center,
      renderCell: (p) => p.row?.categoria
        ? <span style={{ display: 'inline-flex' }}><Chip label={p.row.categoria} size="small" color={getCategoryColor(p.row.categoria)} variant="outlined" /></span>
        : '—',
    },
    {
      field: 'precio',
      headerName: 'Precio',
      flex: 0.15,
      ...center,
      renderCell: (p) => p.row?.precio
        ? ARS.format(Number(p.row.precio))
        : '—',
    },
    {
      field: 'stock',
      headerName: 'Stock',
      flex: 0.1,
      ...center,
      renderCell: (p) => {
        const stock = p.row?.stock ?? 0
        return (
          <Chip
            label={stock}
            size="small"
            color={stock > 10 ? 'success' : stock > 0 ? 'warning' : 'error'}
          />
        )
      },
    },
    {
      field: 'acciones',
      headerName: 'Acciones',
      flex: 0.1,
      sortable: false,
      ...center,
      renderCell: (p) => (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 1,
            width: '100%',
            height: '100%',
          }}
        >
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleEdit(p.row)}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDelete(p.row.id)}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ]
