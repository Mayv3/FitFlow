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

export const columnsServices = (
  handleEdit: (service: any) => void,
  handleDelete: (id: string) => void
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
      flex: 0.2,
      ...center,
      renderCell: (p) => p.row?.nombre ?? '—',
    },
    {
      field: 'descripcion',
      headerName: 'Descripción',
      flex: 0.3,
      ...center,
      renderCell: (p) => (p.row?.descripcion ? p.row.descripcion : '—'),
    },
    {
      field: 'duracion_minutos',
      headerName: 'Duración',
      flex: 0.15,
      ...center,
      renderCell: (p) => p.row?.duracion_minutos
        ? `${p.row.duracion_minutos} min`
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
            onClick={() => handleDelete(p.row?.id)}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ]
