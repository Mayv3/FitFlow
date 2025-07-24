'use client'
import { GenericDataGrid } from '@/components/ui/tables/DataGrid';
import { GridColDef } from '@mui/x-data-grid';
import { Box, Typography, Paper, CircularProgress, IconButton, TextField } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAlumnosByGym } from '@/hooks/useAlumnosByGym';
import { useUser } from '@/context/UserContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GenericModal } from '@/components/ui/modals/GenericModal';
import { FormModal } from '@/components/ui/modals/FormModal';

export default function MembersList() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [openModal, setOpenModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);

  const gymId = user?.gym_id ?? '';
  const { data, isLoading, isError, error, isFetching } = useAlumnosByGym(gymId, page, pageSize);

  const alumnos = data?.items ?? [];
  const total = data?.total ?? 0;

  useEffect(() => {
    if (!user && !userLoading) {
      router.push('/login');
    }
  }, [user, userLoading, router]);


  const handleEdit = (member: any) => {
    setEditingMember(member);
    setOpenEdit(true);
  };

  const handleSubmitEdit = (values: any) => {
    console.log('Valores editados:', values);
    setOpenEdit(false);
  };

  const handleDelete = (id: string) => {
    setSelectedMember(id);
    setOpenModal(true);
  };

  const confirmDelete = () => {
    console.log('Eliminar miembro con id:', selectedMember);
    setOpenModal(false);
  };

  if (userLoading || !user) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Typography color="error" sx={{ textAlign: 'center', mt: 4 }}>
        {(error as Error).message}
      </Typography>
    );
  }

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', flex: 0.1 },
    { field: 'nombre', headerName: 'Nombre', flex: 0.1 },
    { field: 'dni', headerName: 'DNI', flex: 0.1 },
    { field: 'email', headerName: 'Email', flex: 0.1 },
    { field: 'telefono', headerName: 'Teléfono', flex: 0.1 },
    { field: 'plan', headerName: 'Plan', flex: 0.1 },
    { field: 'clases_pagadas', headerName: 'Clases pagadas', type: 'number', flex: 0.1 },
    { field: 'clases_realizadas', headerName: 'Clases realizadas', type: 'number', flex: 0.1 },
    { field: 'fecha_nacimiento', headerName: 'Fecha de nacimiento', flex: 0.1 },
    { field: 'fecha_inicio', headerName: 'Fecha de inicio', flex: 0.1 },
    {
      field: 'acciones',
      headerName: 'Acciones',
      flex: 0.15,
      renderCell: (params) => (
        <Box>
          <IconButton color="primary" onClick={() => handleEdit(params.row)}>
            <EditIcon />
          </IconButton>
          <IconButton color="error" onClick={() => handleDelete(params.row.id)}>
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  const inputFields = [
    {
      label: 'Nombre',
      name: 'nombre',
      required: true,
      minLength: 3,
      maxLength: 50,
      gridSize: { xs: 12, sm: 4 }
    },
    {
      label: 'DNI',
      name: 'dni',
      type: 'text',
      required: true,
      minLength: 7,
      maxLength: 8,
      inputProps: {
        inputMode: 'numeric',
        pattern: '[0-9]*'
      },
      gridSize: { xs: 12, sm: 4 }
    },
    {
      label: 'Email',
      type: 'email',
      name: 'email',
      maxLength: 60,
      gridSize: { xs: 12, sm: 4 }
    },
    {
      label: 'Teléfono',
      name: 'telefono',
      minLength: 8,
      maxLength: 20,
      gridSize: { xs: 12, sm: 4 }
    }
  ];

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
      <GenericModal
        open={openModal}
        title="Confirmar eliminación"
        content={<Typography>¿Estás seguro de que deseas eliminar este miembro?</Typography>}
        onClose={() => setOpenModal(false)}
        onConfirm={confirmDelete}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
      {editingMember && (
        <FormModal
          gridColumns={2}
          open={openEdit}
          title="Editar miembro"
          fields={inputFields}
          initialValues={editingMember}
          onClose={() => setOpenEdit(false)}
          onSubmit={handleSubmitEdit}
          confirmText="Guardar"
          cancelText="Cancelar"
        />
      )}
    </Box>
  );
}
