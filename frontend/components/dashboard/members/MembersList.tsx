'use client';
import { GenericDataGrid } from '@/components/ui/tables/DataGrid';
import { Box, Typography, CircularProgress, Button, Stack } from '@mui/material';
import { useUser } from '@/context/UserContext';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GenericModal } from '@/components/ui/modals/GenericModal';
import { FormModal } from '@/components/ui/modals/FormModal';
import { Member } from '@/models/Member/Member';
import { getInputFieldsAlumnos, layoutAlumnos } from '@/const/inputs/alumnos';
import { columnsMember } from '@/const/columns/members';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useChangeItem } from '@/hooks/changeItemCache/useChangeItem';
import { MemberStats } from './stats/MemberStats';
import {
  useAlumnosByGym,
  useDeleteAlumnoByDNI,
  useEditAlumnoByDNI,
  useAddAlumno
} from '@/hooks/alumnos/useAlumnosApi';
import AddIcon from '@mui/icons-material/Add';
import { useMemberAsyncValidators } from '@/hooks/validatorsInput/UseAsyncValidators';
import { usePlanesPrecios } from '@/hooks/plans/usePlanesPrecios';
import { SearchBar } from '@/components/ui/search/SearchBar';
import { debounce } from '@/utils/debounce/debounce';
import { CustomBreadcrumbs } from '@/components/ui/breadcrums/CustomBreadcrumbs';
import { usePlanNameFromCache } from '@/hooks/plans/usePlanesPrecios';
import { notify } from '@/lib/toast';

export default function MembersList() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();

  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [q, setQ] = useState('');

  const handleSearchChange = useMemo(
    () =>
      debounce((value: string) => {
        setQ(value);
        setPage(1);
      }, 450),
    []
  );

  const [openModal, setOpenModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<number | null>(null);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const asyncValidators = useMemberAsyncValidators();

  const getPlanNameFromCache = usePlanNameFromCache();

  const addmember = useAddAlumno();
  const deleteAlumno = useDeleteAlumnoByDNI();
  const editAlumno = useEditAlumnoByDNI();

  const { changeItem } = useChangeItem<Member>();

  const gymId = user?.gym_id ?? '';

  const { data, isLoading, isError, error, isFetching } = useAlumnosByGym(gymId, page, pageSize, q);
  const alumnos = data?.items ?? [];
  const total = data?.total ?? 0;
  const { options: planOptions, byId, isLoading: plansLoading } = usePlanesPrecios(gymId);

  const fields = useMemo(() => {
    const base = getInputFieldsAlumnos.map(f => ({ ...f }));
    const planField = base.find(f => f.name === 'plan_id');
    if (planField) {
      planField.type = 'select';
      planField.options = [
        { value: null, label: 'No tiene plan' },
        ...planOptions
      ];
      if (plansLoading) {
        planField.disabled = true;
        planField.placeholder = 'Cargando planes...';
      }
      const clasesField = base.find(f => f.name === 'clases_pagadas');
      if (clasesField) {
        planField.onChange = (newPlanId: string | number | null, next) => {
          if (!newPlanId) return { ...next, clases_pagadas: '' };
          const opt = byId[String(newPlanId)];
          return opt ? { ...next, clases_pagadas: String(opt.numero_clases ?? '') } : next;
        };
      }
    }
    return base;
  }, [planOptions, byId, plansLoading]);

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
    const plan_nombre = getPlanNameFromCache(gymId!, values.plan_id);

    try {
      const temporalId = Date.now();
      const valuesWithDates = {
        ...values,
        fecha_vencimiento: values.fecha_vencimiento,
        fecha_nacimiento: values.fecha_nacimiento,
        fecha_inicio: values.fecha_inicio,
      };

      changeItem({
        queryKey: ['members', gymId, page, pageSize, q],
        identifierKey: 'dni',
        action: 'add',
        item: { ...valuesWithDates, plan_nombre, id: temporalId.toString() }
      });

      setOpenAdd(false);
      addmember.mutate({ ...valuesWithDates, gym_id: user.gym_id, },
        {
          onSuccess: () => notify.success('Miembro añadido correctamente'),
          onError: () => notify.error('Error al añadir el miembro'),
        });
    } catch (err) {
      console.error('Error al añadir miembro:', err);
    }
  };

  const handleEdit = async (values: Partial<Member> & { dni: string }) => {
    const plan_nombre = getPlanNameFromCache(gymId!, values.plan_id);
    changeItem({
      queryKey: ['members', gymId, page, pageSize, q],
      identifierKey: 'dni',
      action: 'edit',
      item: { ...values, plan_nombre },
    });
    setOpenEdit(false);
    editAlumno.mutate({ dni: values.dni, values },
      {
        onSuccess: () => notify.success('Miembro editado correctamente'),
        onError: () => notify.error('Error al editar el miembro'),
      });
  };

  const handleDelete = async (dni: string) => {
    try {
      changeItem({
        queryKey: ['members', gymId, page, pageSize, q],
        identifierKey: 'dni',
        action: 'delete',
        item: { dni },
      });
      setOpenModal(false);
      deleteAlumno.mutate(dni, {
        onSuccess: () => notify.success('Miembro eliminado correctamente'),
        onError: () => notify.error('Error al eliminar el miembro'),
      });
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
    <Box>
      <CustomBreadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard/receptionist' },
          { label: 'Miembros' }
        ]}
      />

      <Box mb={2}>
        <Stack
          gap={2}
          direction={{ xs: 'column', md: 'row' }}
          alignItems="stretch"
          justifyContent="space-between"
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              flex: 1,
            }}
          >
            <SearchBar
              value={q}
              onChange={(val) => handleSearchChange(val)}
              onSearch={(text) => {
                setQ(text);
                setPage(1);
              }}
              isLoading={isFetching}
              placeholder="Buscar miembros (DNI, nombre, email, teléfono)…"
            />
          </Box>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              whiteSpace: 'nowrap',
              width: { xs: '100%', md: '300px' },
              height: '56px',
            }}
            onClick={() => setOpenAdd(true)}
          >
            Añadir miembro
          </Button>
        </Stack>
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

      <MemberStats gymId={gymId} />

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
          mode="create"
          asyncValidators={asyncValidators}
          layout={layoutAlumnos}
        />
      )}

      {editingMember && (
        <FormModal
          open={openEdit}
          title="Editar miembro"
          fields={fields}
          gridColumns={12}
          gridGap={16}
          initialValues={editingMember}
          onClose={() => setOpenEdit(false)}
          onSubmit={handleEdit}
          confirmText="Guardar"
          cancelText="Cancelar"
          layout={layoutAlumnos}
          mode="edit"
          lockedFields={['dni']}
        />
      )}

      <ReactQueryDevtools initialIsOpen={false} />

    </Box>
  );
}