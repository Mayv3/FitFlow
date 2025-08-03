'use client'
import { GenericDataGrid } from '@/components/ui/tables/DataGrid';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import { useAlumnosByGym } from '@/hooks/useAlumnosByGym';
import { useUser } from '@/context/UserContext';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GenericModal } from '@/components/ui/modals/GenericModal';
import { FormModal } from '@/components/ui/modals/FormModal';
import { Member } from '@/models/Member';
import { inputFieldsAlumnos } from '@/const/inputs/alumnos';
import { columnsMember } from '@/const/columns/alumnos';
import { deleteAlumnoByDNI, editAlumnoByDNI } from '@/lib/api/alumnos';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useChangeItem } from '@/hooks/useChangeItem';
import { MemberStats } from './stats/MemberStats';

export default function MembersList() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [openModal, setOpenModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<number | null>(null);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const { changeItem } = useChangeItem<Member>();

  const gymId = user?.gym_id ?? '';

  const { data, isLoading, isError, error, isFetching } = useAlumnosByGym(gymId, page, pageSize);
  const alumnos = data?.items ?? [];
  const total = data?.total ?? 0;

  useEffect(() => {
    if (!user && !userLoading) {
      router.push('/login');
    }

  }, [user, userLoading, router]);

  if (userLoading || !user) {
    return <Box sx={{ textAlign: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  if (isLoading) {
    return <Box sx={{ textAlign: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  if (isError) {
    return (
      <Typography color="error" sx={{ textAlign: 'center', mt: 4 }}>
        {(error as Error).message}
      </Typography>
    );
  }

  const handleEdit = async (values: Partial<Member> & { dni: string }) => {
    const dni = values.dni as string;

    try {
      await editAlumnoByDNI({ dni: values.dni, values });

      changeItem({
        queryKey: ['members', gymId, page, pageSize],
        identifierKey: 'dni',
        action: 'edit',
        item: values,
      });

      setOpenEdit(false);
    } catch (err) {
      console.error('Error al editar miembro:', err);
    }
  };

  const handleDelete = async (dni: string) => {
    try {
      await deleteAlumnoByDNI(dni);

      changeItem({
        queryKey: ['members', gymId, page, pageSize],
        identifierKey: 'dni',
        action: 'delete',
        item: { dni },
      });

      setOpenModal(false);
      setSelectedMember(null);
    } catch (err) {
      console.error('Error al eliminar miembro:', err);
    }
  };

  const confirmDelete = () => {
    if (selectedMember !== null) {
      handleDelete(selectedMember.toString());
    }
  };

  const triggerEdit = (member: Member) => {
    setEditingMember(member);
    setOpenEdit(true);
  };

  const triggerDelete = (dni: number) => {
    setSelectedMember(Number(dni));
    setOpenModal(true);
  };

  const columns = columnsMember(triggerEdit, triggerDelete);

  return (
    <Box sx={{
      height: "auto", mb:
        { xs: '60px', md: '0px' },
      minWidth: {
        sx: '200px',
        md: '100%'
      },
      maxWidth: '84vw',
      mx: 'auto'
    }}>
      <Typography variant="h4" gutterBottom>
        Lista de Miembros
      </Typography>

      <GenericDataGrid
        rows={alumnos}
        columns={columns}
        paginationMode="server"
        rowCount={total}
        page={page - 1}
        pageSize={pageSize}
        onPaginationModelChange={({ page: newPage }) => setPage(newPage + 1)}
        loading={isFetching}
      />

      <GenericModal
        open={openModal}
        title="Confirmar eliminación"
        content={<Typography>¿Estás seguro de que deseas eliminar este miembro?</Typography>}
        onClose={() => setOpenModal(false)}
        onConfirm={confirmDelete}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />

      <MemberStats />

      {editingMember && (
        <FormModal
          gridColumns={3}
          open={openEdit}
          title="Editar miembro"
          fields={inputFieldsAlumnos}
          initialValues={editingMember}
          onClose={() => setOpenEdit(false)}
          onSubmit={handleEdit}
          confirmText="Guardar"
          cancelText="Cancelar"
        />
      )}

      <ReactQueryDevtools initialIsOpen={false} />
    </Box>
  );
}
