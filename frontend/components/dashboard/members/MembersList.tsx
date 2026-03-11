'use client';
import { GenericDataGrid } from '@/components/ui/tables/DataGrid';
import {
  Box, Typography, CircularProgress, Button, Stack,
  Badge, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Tooltip, Checkbox,
  Table, TableBody, TableCell, TableHead, TableRow,
} from '@mui/material';
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
  useAddAlumno,
  useExpiredAlumnos,
} from '@/hooks/alumnos/useAlumnosApi';
import AddIcon from '@mui/icons-material/Add';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useMemberAsyncValidators } from '@/hooks/validatorsInput/UseAsyncValidators';
import { usePlanesPrecios } from '@/hooks/plans/usePlanesPrecios';
import { SearchBar } from '@/components/ui/search/SearchBar';
import { debounce } from '@/utils/debounce/debounce';
import { CustomBreadcrumbs } from '@/components/ui/breadcrums/CustomBreadcrumbs';
import { notify } from '@/lib/toast';
import Cookies from 'js-cookie';
import tableSize from '@/const/tables/tableSize';

export default function MembersList() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();

  const [page, setPage] = useState(1);


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
  const [openExpired, setOpenExpired] = useState(false);
  const [waSent, setWaSent] = useState<Set<string>>(new Set());
  const [openEdit, setOpenEdit] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const asyncValidators = useMemberAsyncValidators();

  const addmember = useAddAlumno();
  const deleteAlumno = useDeleteAlumnoByDNI();
  const editAlumno = useEditAlumnoByDNI();

  const { changeItem } = useChangeItem<Member>();

  const gymId = user?.gym_id ?? '';

  useEffect(() => {
    if (!gymId) return;
    try {
      const stored = localStorage.getItem(`fitflow_waSent_${gymId}`);
      if (stored) setWaSent(new Set(JSON.parse(stored)));
    } catch {}
  }, [gymId]);

  const toggleWaSent = (dni: string) => {
    setWaSent(prev => {
      const next = new Set(prev);
      if (next.has(dni)) next.delete(dni); else next.add(dni);
      localStorage.setItem(`fitflow_waSent_${gymId}`, JSON.stringify([...next]));
      return next;
    });
  };

  const { data, isLoading, isError, error, isFetching } = useAlumnosByGym(gymId, page, tableSize, q);
  const { data: expiredData } = useExpiredAlumnos(gymId);
  const expiredMembers = expiredData?.items ?? [];
  const expiredCount = expiredData?.total ?? 0;
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
          if (!newPlanId) {
            return {
              ...next,
              plan_id: null,
              clases_pagadas: null,
              clases_realizadas: 0,
            };
          }

          const plan = byId[String(newPlanId)];

          return {
            ...next,
            plan_id: newPlanId,
            clases_pagadas: plan?.numero_clases ?? null,
            clases_realizadas: 0,
          };
        };
      }
    }

    return base;
  }, [planOptions, byId, plansLoading]);


  const toNumOrNull = (v: any) =>
    v === '' || v === undefined || v === null ? null : Number(v);

  const normalizeMemberValues = (values: Partial<Member>) => ({
    ...values,
    plan_id: values.plan_id === '' || values.plan_id == null ? null : Number(values.plan_id),
    clases_pagadas: toNumOrNull(values.clases_pagadas),
    clases_realizadas: toNumOrNull(values.clases_realizadas),
    origen: values.origen ?? null, 
    fecha_vencimiento: (values as any).fecha_vencimiento || null,
    fecha_nacimiento: values.fecha_nacimiento || null,
    fecha_inicio: values.fecha_inicio || null,
  });

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
    console.log('Adding member with values:', values);
    const v = {
      ...values,
      plan_id:
        values.plan_id === '' || values.plan_id === undefined || values.plan_id === null
          ? null
          : Number(values.plan_id),
    };

    const plan_nombre = byId[String(v.plan_id)]?.nombre ?? null;

    try {
      const temporalId = Date.now();

      changeItem({
        queryKey: ['members', gymId, page, tableSize, q],
        identifierKey: 'dni',
        action: 'add',
        item: { ...v, plan_nombre, id: temporalId.toString() },
      });

      setOpenAdd(false);

      addmember.mutate(
        { ...v, gym_id: user.gym_id },
        {
          onSuccess: () => notify.success('Miembro añadido correctamente'),
          onError: () => notify.error('Error al añadir el miembro'),
        }
      );
    } catch (err) {
      console.error('Error al añadir miembro:', err);
    }
  };


  const handleEdit = async (values: Partial<Member> & { dni: string }) => {
    const plan_id =
      values.plan_id === '' || values.plan_id === undefined || values.plan_id === null
        ? null
        : Number(values.plan_id);

    const plan_nombre = byId[String(plan_id)]?.nombre ?? null;

    changeItem({
      queryKey: ['members', gymId, page, tableSize, q],
      identifierKey: 'dni',
      action: 'edit',
      item: { ...values, plan_id, plan_nombre },
    });

    setOpenEdit(false);

    editAlumno.mutate(
      { dni: values.dni, values: { ...values, plan_id } },
      {
        onSuccess: () => notify.success('Miembro editado correctamente'),
        onError: () => notify.error('Error al editar el miembro'),
      }
    );
  };


  const handleDelete = async (dni: string) => {
    try {
      changeItem({
        queryKey: ['members', gymId, page, tableSize, q],
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
    console.log(member)
    setEditingMember(member);
    setOpenEdit(true);
  };

  const triggerDelete = (dni: number) => {
    setSelectedMember(Number(dni));
    setOpenModal(true);
  };

  const gymName = Cookies.get('gym_name') ?? '';
  const columns = columnsMember(triggerEdit, triggerDelete, gymName, byId, toggleWaSent, waSent);

  return (
    <Box sx={{ maxWidth: 'xl', mx: 'auto', py: 2 }}>
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

          <Badge badgeContent={expiredCount} color="error" max={999}>
            <Button
              variant="outlined"
              color="warning"
              startIcon={<WarningAmberIcon />}
              sx={{ whiteSpace: 'nowrap', height: '56px', minWidth: '180px' }}
              onClick={() => setOpenExpired(true)}
            >
              Vencidos
            </Button>
          </Badge>

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
        pageSize={tableSize}
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

      <ReactQueryDevtools initialIsOpen={true} />

      <Dialog open={openExpired} onClose={() => setOpenExpired(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ py: 1.5, display: 'flex', alignItems: 'center', gap: 1, fontSize: '1rem' }}>
          <WarningAmberIcon color="warning" fontSize="small" />
          Miembros vencidos ({expiredCount})
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {expiredMembers.length === 0 ? (
            <Typography sx={{ p: 3, textAlign: 'center', color: 'text.secondary', fontSize: '0.875rem' }}>
              No hay miembros vencidos
            </Typography>
          ) : (
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" />
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Nombre</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Plan</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Venció</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Teléfono</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>WA</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {expiredMembers.map((m) => {
                  const dniKey = `${m.dni}_${m.fecha_de_vencimiento ?? 'sin-fecha'}`;
                  const sent = waSent.has(dniKey);
                  const phone = (m.telefono ?? '').replace(/\D/g, '');
                  const planNombre = m.plan_nombre ?? '—';
                  const precio = m.plan_precio != null ? `$${m.plan_precio}` : 'consultar precio';
                  const fv = m.fecha_de_vencimiento;
                  const fechaVenc = fv
                    ? new Date(fv).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                    : '—';
                  const mensaje =
                    `¡Hola ${m.nombre}! ¿Cómo estás?\n\n` +
                    `Te escribimos desde *${gymName}* con un recordatorio rápido\n\n` +
                    `Tu membresía venció el ${fechaVenc} y te extrañamos por acá!\n\n` +
                    `*Tu plan*:\n${planNombre}\nPrecio: ${precio}\n\n` +
                    `¡Renovar es muy fácil, avisanos y te ayudamos!\nTe esperamos con las puertas abiertas`;
                  const waUrl = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(mensaje)}` : null;

                  return (
                    <TableRow
                      key={dniKey}
                      sx={{ opacity: sent ? 0.45 : 1, transition: 'opacity 0.2s' }}
                    >
                      <TableCell padding="checkbox">
                        <Tooltip title={sent ? 'Marcar como no enviado' : 'Marcar como enviado'}>
                          <Checkbox
                            size="small"
                            checked={sent}
                            onChange={() => toggleWaSent(dniKey)}
                            color="success"
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', fontWeight: sent ? 400 : 500 }}>
                        {m.nombre}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{planNombre}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', color: 'error.main' }}>{fechaVenc}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{m.telefono ?? '—'}</TableCell>
                      <TableCell align="center" padding="checkbox">
                        <Tooltip title={waUrl ? 'Enviar por WhatsApp' : 'Sin teléfono registrado'}>
                          <span>
                            <IconButton
                              size="small"
                              sx={{ color: waUrl ? '#25D366' : 'action.disabled' }}
                              component={waUrl ? 'a' : 'button'}
                              href={waUrl ?? undefined}
                              target={waUrl ? '_blank' : undefined}
                              rel={waUrl ? 'noopener noreferrer' : undefined}
                              disabled={!waUrl}
                            >
                              <WhatsAppIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions sx={{ py: 1 }}>
          <Button size="small" onClick={() => setOpenExpired(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}