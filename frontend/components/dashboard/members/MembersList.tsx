'use client';
import { GenericDataGrid } from '@/components/ui/tables/DataGrid';
import {
  Box, Typography, Button, Stack,
  Badge, Chip, Dialog, DialogContent,
  IconButton, Tooltip, Checkbox,
  Table, TableBody, TableCell, TableRow,
} from '@mui/material';
import { useUser } from '@/context/UserContext';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GenericModal } from '@/components/ui/modals/GenericModal';
import { FormModal } from '@/components/ui/modals/FormModal';
import { Member } from '@/models/Member/Member';
import { getApiErrorStatus } from '@/utils/errors/apiError';
import { getInputFieldsAlumnos, layoutAlumnos } from '@/const/inputs/alumnos';
import { columnsMember, normalizeArPhone } from '@/const/columns/members';
import { estadoVencimiento } from '@/utils/date/dateUtils';
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
import PersonOffIcon from '@mui/icons-material/PersonOff';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { darken } from '@mui/material/styles';
import { useGymThemeSettings } from '@/hooks/useGymThemeSettings';
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
  const [now] = useState(() => Date.now());
  const asyncValidators = useMemberAsyncValidators();

  const addmember = useAddAlumno();
  const deleteAlumno = useDeleteAlumnoByDNI();
  const editAlumno = useEditAlumnoByDNI();

  const { changeItem } = useChangeItem<Member>();

  const gymId = user?.gym_id ?? '';
  const { primaryColor } = useGymThemeSettings();

  // localStorage solo existe en el cliente y gymId recien se conoce cuando carga
  // la sesion, asi que la lectura va en un efecto a proposito. Devuelve un Set,
  // que no sirve para useClientSnapshot (identidad nueva en cada render).
  useEffect(() => {
    if (!gymId) return;
    try {
      const stored = localStorage.getItem(`fitflow_waSent_${gymId}`);
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
  // El backend devuelve todos los vencidos; acá los separamos:
  // - vencidos "reales": venció hace <= 2 meses
  // - inactivos: venció hace > 2 meses (dejaron de venir) → no cuentan como vencidos
  const { vencidosMembers, inactivosMembers } = useMemo(() => {
    const v: Member[] = [];
    const i: Member[] = [];
    for (const m of expiredData?.items ?? []) {
      const inactivo = estadoVencimiento(m.fecha_de_vencimiento).code === 'inactive';
      (inactivo ? i : v).push(m);
    }
    return { vencidosMembers: v, inactivosMembers: i };
  }, [expiredData]);
  const expiredCount = vencidosMembers.length;
  const inactivosCount = inactivosMembers.length;
  // Resumen del modal: cuántos vencidos ya se marcaron como avisados
  const avisados = [...vencidosMembers, ...inactivosMembers]
    .filter(m => waSent.has(`${m.dni}_${m.fecha_de_vencimiento ?? 'sin-fecha'}`)).length;
  const pendientesAvisar = expiredCount + inactivosCount - avisados;
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

    }

    return base;
  }, [planOptions, plansLoading]);


  useEffect(() => {
    if (!user && !userLoading) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  if (isError) {
    const is403 = getApiErrorStatus(error) === 403
    return (
      <Typography color="error" sx={{ textAlign: 'center', mt: 4 }}>
        {is403
          ? 'Tu sesión expiró. Por favor, cerrá sesión y volvé a ingresar.'
          : 'Ocurrió un error al cargar los alumnos. Intentá recargar la página.'}
      </Typography>
    );
  }

  const handleAddMember = async (values: Partial<Member>) => {
    // Sin sesion no hay gym_id: cortar antes de mutar en vez de mandar undefined.
    if (!user?.gym_id) {
      notify.error('Tu sesión expiró. Volvé a iniciar sesión.');
      return;
    }

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
    setEditingMember(member);
    setOpenEdit(true);
  };

  const triggerDelete = (dni: number) => {
    setSelectedMember(Number(dni));
    setOpenModal(true);
  };

  const gymName = Cookies.get('gym_name') ?? '';
  const columns = columnsMember(triggerEdit, triggerDelete, gymName, byId, toggleWaSent, waSent);

  const renderExpiredRow = (m: Member) => {
    const dniKey = `${m.dni}_${m.fecha_de_vencimiento ?? 'sin-fecha'}`;
    const sent = waSent.has(dniKey);
    const phone = normalizeArPhone(m.telefono);
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

    const dias = fv ? Math.max(0, Math.floor((now - new Date(fv).getTime()) / 86_400_000)) : null;
    const hace =
      dias == null ? null
        : dias < 1 ? 'Hoy'
        : dias < 30 ? `Hace ${dias} ${dias === 1 ? 'día' : 'días'}`
        : `Hace ${Math.floor(dias / 30)} ${Math.floor(dias / 30) === 1 ? 'mes' : 'meses'}`;
    const haceColor = dias == null ? 'default' : dias <= 7 ? 'warning' : dias <= 60 ? 'error' : 'default';

    return (
      <TableRow
        key={dniKey}
        hover
        sx={{ opacity: sent ? 0.5 : 1, transition: 'opacity 0.2s', '&:last-child td': { border: 0 } }}
      >
        <TableCell padding="none" sx={{ width: 44, pl: 1 }}>
          <Tooltip title={sent ? 'Marcar como no avisado' : 'Marcar como avisado'}>
            <Checkbox
              checked={sent}
              onChange={() => toggleWaSent(dniKey)}
              color="success"
              size="small"
              sx={{ p: 0.75, '& .MuiSvgIcon-root': { fontSize: 20 } }}
            />
          </Tooltip>
        </TableCell>
        <TableCell sx={{ py: 1, px: 1 }}>
          {/* El nombre puede ocupar dos renglones en vez de cortarse */}
          <Typography sx={{ fontSize: '0.85rem', fontWeight: sent ? 400 : 600, lineHeight: 1.3, overflowWrap: 'anywhere' }}>
            {m.nombre}
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', lineHeight: 1.3, whiteSpace: 'nowrap' }}>
            {m.telefono ?? 'Sin teléfono'}
          </Typography>
        </TableCell>
        <TableCell align="right" sx={{ py: 1, px: 1, whiteSpace: 'nowrap', width: 128 }}>
          {hace && (
            <Chip
              label={hace}
              size="small"
              color={haceColor}
              variant={haceColor === 'default' ? 'outlined' : 'filled'}
              sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600, '& .MuiChip-label': { px: 1 } }}
            />
          )}
          <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', lineHeight: 1.3, mt: 0.25 }}>{fechaVenc}</Typography>
        </TableCell>
        <TableCell align="center" padding="none" sx={{ width: 48, pr: 1 }}>
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
                <WhatsAppIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </span>
          </Tooltip>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Box sx={{ maxWidth: 'xl', mx: 'auto', py: 2 }} className="animate-fade-in">
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
        loading={isLoading}
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

      <MemberStats gymId={gymId} onOpenInactivos={() => setOpenExpired(true)} />

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

      <Dialog open={openExpired} onClose={() => setOpenExpired(false)} maxWidth="lg" fullWidth
        PaperProps={{ sx: { borderRadius: 2, overflow: 'hidden', backgroundImage: 'none' } }}
      >
        <Box sx={{ bgcolor: primaryColor, color: '#fff', px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Box display="flex" alignItems="center" gap={1.5} sx={{ minWidth: 0 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <WarningAmberIcon fontSize="small" />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" fontWeight={700} fontSize="1.1rem" lineHeight={1.25}>
                Miembros vencidos
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', opacity: 0.85 }}>
                {pendientesAvisar} sin avisar · {avisados} avisado{avisados !== 1 ? 's' : ''}
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={() => setOpenExpired(false)}
            aria-label="Cerrar"
            size="small"
            sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.18)', '&:hover': { bgcolor: 'rgba(255,255,255,0.32)' } }}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Box>
        <DialogContent sx={{
          p: 0, maxHeight: '70vh', overflowX: 'hidden',
          scrollbarWidth: 'thin',
          scrollbarColor: `${primaryColor} transparent`,
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
          '&::-webkit-scrollbar-thumb': { bgcolor: primaryColor, borderRadius: 3 },
          '&::-webkit-scrollbar-thumb:hover': { bgcolor: darken(primaryColor, 0.3) },
        }}>
          {vencidosMembers.length === 0 && inactivosMembers.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
              <Typography sx={{ fontWeight: 600 }}>No hay miembros vencidos</Typography>
              <Typography sx={{ fontSize: '0.85rem' }}>Todos tus alumnos están al día.</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'stretch' }}>
              {vencidosMembers.length > 0 && (
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{
                    px: 2, py: 1.25, display: 'flex', alignItems: 'center', gap: 1,
                    bgcolor: 'background.paper',
                    borderBottom: '1px solid', borderColor: 'divider',
                    position: 'sticky', top: 0, zIndex: 1,
                  }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }} />
                    <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', flex: 1 }}>
                      Vencidos · hasta 2 meses
                    </Typography>
                    <Chip label={expiredCount} size="small" sx={{ height: 20, fontWeight: 700, fontSize: '0.72rem' }} />
                  </Box>
                  <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
                    <TableBody>
                      {vencidosMembers.map(renderExpiredRow)}
                    </TableBody>
                  </Table>
                </Box>
              )}

              {inactivosMembers.length > 0 && (
                <Box sx={{
                  flex: 1, minWidth: 0,
                  borderTop: { xs: vencidosMembers.length > 0 ? '1px solid' : 0, md: 0 },
                  borderLeft: { md: vencidosMembers.length > 0 ? '1px solid' : 0 },
                  borderColor: 'divider',
                }}>
                  <Box sx={{
                    px: 2, py: 1.25, display: 'flex', alignItems: 'center', gap: 1,
                    bgcolor: 'background.paper',
                    borderBottom: '1px solid', borderColor: 'divider',
                    position: 'sticky', top: 0, zIndex: 1,
                  }}>
                    <PersonOffIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', flex: 1 }}>
                      Inactivos · más de 2 meses
                    </Typography>
                    <Chip label={inactivosCount} size="small" sx={{ height: 20, fontWeight: 700, fontSize: '0.72rem' }} />
                  </Box>
                  <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
                    <TableBody>
                      {inactivosMembers.map(renderExpiredRow)}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>

    </Box>
  );
}