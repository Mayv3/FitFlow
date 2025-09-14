import { Box, IconButton } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'

const ARS = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})

const center = { align: 'center' as const, headerAlign: 'center' as const }

export const columnsPlans = (
  handleEdit: (plan: any) => void,
  handleDelete: (id: number) => void
): GridColDef[] => [
    {
      field: 'color',
      headerName: 'Color',
      flex: 0.1,
      sortable: false,
      ...center,
      renderCell: (p) => (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%',
          }}
        >
          <Box
            sx={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              backgroundColor: p.row?.color || '#ccc',
            }}
          />
        </Box>
      ),
    },
    {
      field: 'nombre',
      headerName: 'Nombre',
      flex: 0.3,
      ...center,
      renderCell: (p) => p.row?.nombre ?? '—',
    },
    {
      field: 'numero_clases',
      headerName: 'N° Clases',
      flex: 0.2,
      ...center,
      renderCell: (p) => p.row?.numero_clases ?? '—',
    },
    {
      field: 'precio',
      headerName: 'Precio',
      flex: 0.2,
      ...center,
      renderCell: (p) => ARS.format(Number(p.row?.precio ?? 0)),
    },
    {
      field: 'acciones',
      headerName: 'Acciones',
      flex: 0.2,
      sortable: false,
      ...center,
      renderCell: (p) => (
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 1,
          width: '100%',
          height: '100%'
        }}>
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
            onClick={() => handleDelete(p.row?.id)}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ]
