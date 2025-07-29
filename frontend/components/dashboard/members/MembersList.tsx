'use client'
import { GenericDataGrid } from '@/components/ui/tables/DataGrid';
import { Box, Typography, Paper, CircularProgress, IconButton, TextField } from '@mui/material';

import { useAlumnosByGym } from '@/hooks/useAlumnosByGym';
import { useUser } from '@/context/UserContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GenericModal } from '@/components/ui/modals/GenericModal';
import { FormModal } from '@/components/ui/modals/FormModal';
import { Member } from '@/models/Member';
import { inputFieldsAlumnos } from '@/const/inputs/inputsAlumnos';
import { columnsMember } from '@/const/columns/columnsAlumnos';

export default function MembersList() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [openModal, setOpenModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<number | null>(null);
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


  const handleEdit = (member: Member) => {
    setEditingMember(member);
    setOpenEdit(true);
  };

  const handleSubmitEdit = (values: Record<string, any>) => {
    console.log('Valores editados:', values);
    setOpenEdit(false);
  };

  const handleDelete = (id: number) => {
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

  const columns = columnsMember(handleEdit, handleDelete);

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
          gridColumns={3}
          open={openEdit}
          title="Editar miembro"
          fields={inputFieldsAlumnos}
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
