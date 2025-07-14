'use client'
import { useEffect } from 'react';
import { useAppData } from '@/context/AppDataContext';
import { GenericDataGrid } from '@/components/dashboard/tables/DataGrid';
import { GridColDef } from '@mui/x-data-grid';
import { Box, Typography, Paper } from '@mui/material';
import { useFetchOnce } from '@/hooks/useFetchOnce';

const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID', flex: 0.1 },
  { field: 'nombre', headerName: 'Nombre', flex: .4 },
  { field: 'dni', headerName: 'DNI', flex: .3 },
  { field: 'email', headerName: 'Email', flex: .6 },
  { field: 'telefono', headerName: 'Teléfono', flex: .5 },
  { field: 'plan', headerName: 'Plan', flex: .6 },
  { field: 'clases_pagadas', headerName: 'Clases pagadas', type: 'number', flex: .6 },
  { field: 'clases_realizadas', headerName: 'Clases realizadas', type: 'number', flex: .6 },
  { field: 'fecha_nacimiento', headerName: 'Fecha de nacimiento', flex: .5 },
  { field: 'fecha_inicio', headerName: 'Fecha de inicio', flex: .5 },
];

export default function MembersPage() {
  const { members, setMembers } = useAppData();

  const { data, loading, error } = useFetchOnce(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/alumnos`
  );

  useEffect(() => {
    if (!members && data) {
      setMembers(data);
    }
  }, [members, data, setMembers]);

  if (!members && loading) return <p>Cargando...</p>;
  if (!members && error) return <p>Error: {error}</p>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Lista de Miembros
      </Typography>

      <Paper sx={{ width: '100%' }}>
        <GenericDataGrid
          title="Miembros"
          rows={members || []}
          pageSizeOptions={[10]}
          initialPagination={{ page: 0, pageSize: 10 }}
          columns={columns}
        />
      </Paper>
    </Box>
  );
}
