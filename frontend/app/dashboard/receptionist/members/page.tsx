'use client'
import { GenericDataGrid } from '@/components/dashboard/tables/DataGrid';
import { GridColDef } from '@mui/x-data-grid';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import { useFetchOnce } from '@/hooks/useFetchOnce';
import { useAlumnosByGym } from '@/hooks/useAlumnosByGym';
import { useUser } from '@/context/UserContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'

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
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const [page, setPage] = useState(1)
  const pageSize = 20

  const gymId = user?.gym_id ?? ''
  const {
    data,
    isLoading,
    isError,
    error,
    isFetching,
  } = useAlumnosByGym(gymId, page, pageSize)

  const alumnos = data?.items ?? []
  const total = data?.total ?? 0

  useEffect(() => {
    console.log(data)
    if (!user && !userLoading) {
      router.push('/login')
    }
  }, [user, userLoading, router])

  if (userLoading || !user) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (isLoading) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (isError) {
    return (
      <Typography color="error" sx={{ textAlign: 'center', mt: 4 }}>
        {(error as Error).message}
      </Typography>
    )
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Lista de Miembros
      </Typography>
      <Paper sx={{ width: '100%' }}>
        <GenericDataGrid
          title="Miembros"
          rows={alumnos}
          columns={columns}
          paginationMode="server"
          rowCount={total}
          page={page - 1}
          pageSize={pageSize}
          onPaginationModelChange={({ page: newPage }) => setPage(newPage + 1)}
          loading={isFetching}
        />
      </Paper>
    </Box>
  )
}
