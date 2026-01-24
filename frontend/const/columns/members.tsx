
import { Box, IconButton } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Member } from '@/models/Member/Member';
import { estadoVencimiento, formatearFecha } from '@/utils/date/dateUtils';
import { StateCheap } from '@/components/ui/cheap/StateCheap';

export const columnsMember = (
  handleEdit: (member: Member) => void,
  handleDelete: (id: number) => void
): GridColDef[] => [
    { field: 'nombre', headerName: 'Nombre', flex: 0.18, align: 'center', headerAlign: 'center' },
    { field: 'dni', headerName: 'DNI', flex: 0.10, align: 'center', headerAlign: 'center' },
    { field: 'email', headerName: 'Email', flex: 0.20, align: 'center', headerAlign: 'center' },
    { field: 'telefono', headerName: 'Teléfono', flex: 0.12, align: 'center', headerAlign: 'center' },
    {
      field: 'plan_nombre',
      headerName: 'Plan',
      flex: 0.14,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => params.value ?? '-',
    },
    {
      field: 'clases_pagadas',
      headerName: 'Clases pagadas',
      type: 'number',
      flex: 0.10,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'clases_realizadas',
      headerName: 'Clases realizadas',
      type: 'number',
      flex: 0.12,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const realizadas = params.row.clases_realizadas ?? 0;
        const pagadas = params.row.clases_pagadas ?? 0;

        if (realizadas >= pagadas && pagadas > 0) {
          return (
            <Box component="span" sx={{ display: 'inline-flex' }}>
              <StateCheap code="limit" label="Límite" daysDiff={null} />
            </Box>
          );
        }

        return realizadas;
      },
    },
    {
      field: 'fecha_nacimiento',
      headerName: 'Fecha de nacimiento',
      flex: 0.14,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => formatearFecha(params.row.fecha_nacimiento),
    },
    {
      field: 'fecha_inicio',
      headerName: 'Fecha de inicio',
      flex: 0.12,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => formatearFecha(params.row.fecha_inicio),
    },
    {
      field: 'fecha_de_vencimiento',
      headerName: 'Fecha de vencimiento',
      flex: 0.14,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => formatearFecha(params.row.fecha_de_vencimiento),
    },
    {
      field: 'estado_alumno',
      headerName: 'Estado',
      flex: 0.16,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const fv = params.row.fecha_de_vencimiento ?? params.row.fecha_vencimiento;
        const { label, code, daysDiff } = estadoVencimiento(fv);
        return <StateCheap code={code} label={label} daysDiff={daysDiff} />;

      },
    },
    {
      field: 'acciones',
      headerName: 'Acciones',
      flex: 0.12,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box>
          <IconButton color="primary" onClick={() => handleEdit(params.row)}>
            <EditIcon />
          </IconButton>
          <IconButton color="error" onClick={() => handleDelete(params.row.dni)}>
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];
