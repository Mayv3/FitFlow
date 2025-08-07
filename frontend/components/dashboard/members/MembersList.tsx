'use client'
import { GenericDataGrid } from '@/components/ui/tables/DataGrid';
import { Box, Typography, Paper, CircularProgress, Button } from '@mui/material';
import { useUser } from '@/context/UserContext';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GenericModal } from '@/components/ui/modals/GenericModal';
import { FormModal } from '@/components/ui/modals/FormModal';
import { Member } from '@/models/Member';
import { getInputFieldsAlumnos, layoutAlumnos } from '@/const/inputs/alumnos';
import { columnsMember } from '@/const/columns/alumnos';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useChangeItem } from '@/hooks/useChangeItem';
import { MemberStats } from './stats/MemberStats';
import {
  useAlumnosByGym,
  useDeleteAlumnoByDNI,
  useEditAlumnoByDNI,
  useAddAlumno
} from '@/hooks/useAlumnosApi';

import AddIcon from '@mui/icons-material/Add';
import { useValidateDniFromApi } from '@/hooks/useValidateDni';

export default function MembersList() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [openModal, setOpenModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<number | null>(null);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const addmember = useAddAlumno();
  const deleteAlumno = useDeleteAlumnoByDNI();
  const editAlumno = useEditAlumnoByDNI();
  const { changeItem } = useChangeItem<Member>();

  const gymId = user?.gym_id ?? '';

  const { data, isLoading, isError, error, isFetching } = useAlumnosByGym(gymId, page, pageSize);
  const alumnos = data?.items ?? [];
  const total = data?.total ?? 0;

  const validateDni = useValidateDniFromApi();
  const fields = getInputFieldsAlumnos(validateDni);

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

  const handleAddMember = async (values: Partial<Member>) => {
    try {
      const temporalId = Date.now();

      const valuesWithDates = {
        ...values,
        fecha_vencimiento: values.fecha_vencimiento,
        fecha_nacimiento: values.fecha_nacimiento,
        fecha_inicio: values.fecha_inicio,
      };

      changeItem({
        queryKey: ['members', gymId, page, pageSize],
        identifierKey: 'dni',
        action: 'add',
        item: { ...valuesWithDates, id: temporalId.toString() }
      });

      console.log('Objeto enviado al backend:', values);

      setOpenAdd(false);
      addmember.mutate({
        ...valuesWithDates,
        gym_id: user.gym_id,
      });

    } catch (err) {
      console.error('Error al añadir miembro:', err);
    }
  };

  const handleEdit = async (values: Partial<Member> & { dni: string }) => {
    const dni = values.dni as string;

    try {
      changeItem({
        queryKey: ['members', gymId, page, pageSize],
        identifierKey: 'dni',
        action: 'edit',
        item: values,
      });

      setOpenEdit(false);

      editAlumno.mutate({ dni: values.dni, values });

    } catch (err) {
      console.error('Error al editar miembro:', err);
    }
  };

  const handleDelete = async (dni: string) => {
    try {
      changeItem({
        queryKey: ['members', gymId, page, pageSize],
        identifierKey: 'dni',
        action: 'delete',
        item: { dni },
      });
      setOpenModal(false);

      deleteAlumno.mutate(dni);

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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Lista de Miembros</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenAdd(true)}>
          Añadir miembro
        </Button>
      </Box>

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

      {openAdd && (
        <FormModal
          open={openAdd}
          title="Añadir miembro"
          fields={fields}
          initialValues={null}
          onClose={() => setOpenAdd(false)}
          onSubmit={handleAddMember}
          confirmText="Guardar"
          cancelText="Cancelar"
          gridColumns={12}
          gridGap={16}
          layout={layoutAlumnos}
        />
      )}

      {editingMember && (
        <FormModal
          gridColumns={3}
          open={openEdit}
          title="Editar miembro"
          fields={fields}
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
