import { Box, IconButton, Chip, Stack } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import VisibilityIcon from '@mui/icons-material/Visibility'
import AutorenewIcon from '@mui/icons-material/Autorenew'

const center = { align: 'center' as const, headerAlign: 'center' as const }

export const columnsClases = (
  handleEdit: (clase: any) => void,
  handleDelete: (id: number) => void,
  handleVerDetalle: (clase: any) => void
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
      field: 'capacidad_default',
      headerName: 'Capacidad',
      flex: 0.12,
      ...center,
      renderCell: (p) => p.row?.capacidad_default ?? '—',
    },
    {
      field: 'acciones',
      headerName: 'Acciones',
      flex: 0.23,
      sortable: false,
      ...center,
      renderCell: (p) => (
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 0.5,
          width: '100%',
          height: '100%'
        }}>
          <IconButton
            size="small"
            color="info"
            onClick={() => handleVerDetalle(p.row)}
            title="Ver inscripciones"
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
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

