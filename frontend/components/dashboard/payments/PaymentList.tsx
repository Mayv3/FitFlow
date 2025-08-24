'use client';
import { Box, Button, Stack, CircularProgress, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { debounce } from '@/utils/debounce/debounce';
import { CustomBreadcrumbs } from '@/components/ui/breadcrums/CustomBreadcrumbs';
import { SearchBar } from '@/components/ui/search/SearchBar';
import { GenericDataGrid } from '@/components/ui/tables/DataGrid';
import { columnsPayments } from '@/const/columns/payments';
import { useUser } from '@/context/UserContext';
import { DatePicker } from '@mui/x-date-pickers-pro';

import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { FormModal } from '@/components/ui/modals/FormModal';
import { getInputFieldsPagos, layoutPayments } from '@/const/inputs/payments';
import { useMethodsPaymentsByGym } from '@/hooks/payments/useMethodsPayments';
import { usePlanesPrecios } from '@/hooks/plans/usePlanesPrecios';
import { useAlumnosSimpleByGym } from '@/hooks/alumnos/useAlumnosByGym';

import {
    usePagosByGym,
    useAddPago,
    useEditPago,
    useDeletePago,
} from '@/hooks/payments/usePaymentsApi';
import { GenericModal } from '@/components/ui/modals/GenericModal';
import { notify } from '@/lib/toast';
import { PaymentStats } from './stats/PaymentStats';
import { fechaHoyArgentinaSinFormato, finDeMes, inicioDelMes } from '@/utils/date/dateUtils';
import moment from 'moment';
import { usePaymentsStats } from '@/hooks/stats/usePaymentsStats';


export default function PaymentList() {
    const { user, loading: userLoading } = useUser();
    const gymId = user?.gym_id ?? '';
    const { data: alumnosRes } = useAlumnosSimpleByGym(gymId);

    const alumnos = useMemo(
        () => (alumnosRes?.items ?? alumnosRes ?? []) as Array<{ id: number; nombre: string; dni?: string }>,
        [alumnosRes]
    );

    const { options: planOptions, byId: plansById } = usePlanesPrecios(gymId);
    const { data: paymentMethods = [] } = useMethodsPaymentsByGym(gymId);

    const [openAdd, setOpenAdd] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [editingPago, setEditingPago] = useState<any | null>(null);
    const [openDelete, setOpenDelete] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const [fromDate, setFromDate] = useState<moment.Moment | null>(fechaHoyArgentinaSinFormato);
    const [toDate, setToDate] = useState<moment.Moment | null>(fechaHoyArgentinaSinFormato);

    const [page, setPage] = useState(1);
    const pageSize = 20;
    const [q, setQ] = useState('');

    const fromDateISO = fromDate?.format('YYYY-MM-DD') ?? null;
    const toDateISO = toDate?.format('YYYY-MM-DD') ?? null;

    const { data, isLoading, isError, error, isFetching } = usePagosByGym(gymId, page, pageSize, q, { fromDate: fromDateISO, toDate: toDateISO });
    const { data: stats, isLoading: statsLoading } = usePaymentsStats(gymId, { fromDate: fromDateISO, toDate: toDateISO, })

    const addPago = useAddPago(gymId);
    const editPago = useEditPago(gymId);
    const deletePago = useDeletePago(gymId);

    const searchFromCache = useCallback((_: string, q: string) => {
        const list = alumnos;
        if (!q) return list.map(a => ({ label: `${a.nombre} (${a.dni ?? ''})`, value: a.id }));
        const lower = q.toLowerCase();
        return list
            .filter(a => a.nombre?.toLowerCase().includes(lower) || String(a.dni ?? '').includes(lower))
            .map(a => ({ label: `${a.nombre} (${a.dni ?? ''})`, value: a.id }));
    }, [alumnos]);

    const fields = useMemo(() => getInputFieldsPagos({
        planOptions,
        paymentMethodOptions: paymentMethods.map((pm: any) => ({ label: pm.nombre, value: pm.id })),
        searchFromCache,
    }), [planOptions, paymentMethods, searchFromCache]);

    const handleSearchChange = useMemo(
        () =>
            debounce((value: string) => {
                setQ(value);
                setPage(1);
            }, 450),
        []
    );

    const pagos = useMemo(() => {
        const items = data?.items ?? [];
        return [...items].sort((a, b) => {
            const fechaA = new Date(`${a.fecha_de_pago}T${a.hora ?? '00:00:00'}`);
            const fechaB = new Date(`${b.fecha_de_pago}T${b.hora ?? '00:00:00'}`);
            return fechaB.getTime() - fechaA.getTime();
        });
    }, [data]);

    const total = data?.total ?? 0;

    const handleAddPayment = async (values: any) => {
        try {
            const payment = await addPago.mutateAsync({ ...values, gym_id: gymId });
            console.log(payment)
            setOpenAdd(false);
            notify.success("Pago añadido correctamente");
        } catch (error) {
            console.error('Error al añadir pago:', error);
            notify.error("❌ Error al añadir el pago");
        }
    };

    const handleOpenEdit = (payment: any) => {
        const sanitized = {
            ...payment,
            hora: payment.hora ? payment.hora.slice(0, 5) : '',
        };
        setEditingPago(sanitized);
        setOpenEdit(true);
    };

    const handleCloseEdit = () => {
        setOpenEdit(false);
        setEditingPago(null);
    };

    const handleEditPayment = async (values: any) => {
        try {
            const id = editingPago?.id;
            if (!id) throw new Error("No hay id para editar el pago");
            handleCloseEdit();
            await editPago.mutateAsync({ id, values });
            notify.success("Pago editado correctamente");
        } catch (error) {
            console.error("Error al editar pago:", error);
            notify.error("Error al editar el pago");
        }
    };

    const handleDelete = (id: number) => {
        setDeletingId(id);
        setOpenDelete(true);
    };

    const confirmDelete = async () => {
        if (!deletingId) return;
        try {
            setOpenDelete(false);
            await deletePago.mutateAsync(deletingId);
            setDeletingId(null);
            notify.success("Pago eliminado correctamente");
        } catch (error) {
            console.error("Error al eliminar pago:", error);
            notify.error("Error al eliminar el pago");
        }
    };

    const columns = useMemo(() => columnsPayments(handleOpenEdit, handleDelete), [handleOpenEdit]);


    if (userLoading || isLoading) {
        return <Box sx={{ textAlign: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    if (isError) {
        return (
            <Box sx={{ textAlign: 'center', mt: 4, color: 'error.main' }}>
                {(error as Error)?.message ?? 'Error al cargar pagos'}
            </Box>
        );
    }

    return (
        <Box>
            <CustomBreadcrumbs
                items={[
                    { label: 'Dashboard', href: '/dashboard/receptionist' },
                    { label: 'Pagos' },
                ]}
            />

            <Box mb={2}>
                <Box mb={2}>
                    <Stack
                        gap={2}
                        direction={{ xs: 'column', md: 'row' }}
                        alignItems={{ xs: 'stretch', md: 'center' }}
                        justifyContent="space-between"
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: { xs: 'column', sm: 'row' },
                                gap: 2,
                                width: '100%',
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
                                placeholder="Buscar pagos (Alumno/Responsable/Método de pago"
                            />
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    gap: 2,
                                    flex: 1,
                                }}
                            >
                                <DatePicker
                                    label="Desde"
                                    value={fromDate}
                                    onChange={(newValue) => setFromDate(newValue)}
                                    minDate={moment().startOf('year')}
                                    maxDate={moment()}
                                    slotProps={{ textField: { fullWidth: true } }}
                                />
                                <DatePicker
                                    label="Hasta"
                                    value={toDate}
                                    onChange={(newValue) => setToDate(newValue)}
                                    minDate={moment().startOf('year')}
                                    maxDate={moment()}
                                    slotProps={{ textField: { fullWidth: true } }}
                                />
                            </Box>
                        </Box>

                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            sx={{
                                whiteSpace: 'nowrap',
                                width: { xs: '100%', md: 'auto' }
                            }}
                            onClick={() => setOpenAdd(true)}
                        >
                            Añadir pago
                        </Button>
                    </Stack>
                </Box>

            </Box>

            <GenericDataGrid
                rows={pagos}
                columns={columns}
                paginationMode="server"
                rowCount={total}
                page={page - 1}
                pageSize={pageSize}
                onPaginationModelChange={({ page: newPage }) => setPage(newPage + 1)}
                loading={isFetching}
            />

            <PaymentStats data={stats} isLoading={statsLoading} />


            {openAdd && (
                <FormModal
                    open={openAdd}
                    title="Añadir un pago"
                    fields={fields}
                    initialValues={null}
                    onClose={() => setOpenAdd(false)}
                    onSubmit={handleAddPayment}
                    confirmText="Guardar"
                    cancelText="Cancelar"
                    gridColumns={12}
                    gridGap={16}
                    mode="create"
                    layout={layoutPayments}
                    gymId={gymId}
                    lockedFields={['responsable']}
                />
            )}

            {openEdit && editingPago && (
                <FormModal
                    open={openEdit}
                    title="Editar pago"
                    fields={fields}
                    gridColumns={12}
                    gridGap={16}
                    initialValues={editingPago}
                    onClose={handleCloseEdit}
                    onSubmit={handleEditPayment}
                    confirmText="Guardar cambios"
                    mode="edit"
                    lockedFields={['alumno_id', 'fecha_de_pago', 'hora', 'responsable']}
                    cancelText="Cancelar"
                    layout={layoutPayments}
                />
            )}

            <GenericModal
                open={openDelete}
                title="Confirmar eliminación"
                content={<Typography>¿Estás seguro de que deseas eliminar este pago?</Typography>}
                onClose={() => setOpenDelete(false)}
                onConfirm={confirmDelete}
                confirmText="Eliminar"
                cancelText="Cancelar"
            />

            <ReactQueryDevtools initialIsOpen={false} />

        </Box>


    );
}
