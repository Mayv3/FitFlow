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


export default function PaymentList() {
    const { user, loading: userLoading } = useUser();
    const gymId = user?.gym_id ?? '';

    const { data: alumnosRes, isLoading: alumnosLoading } = useAlumnosSimpleByGym(gymId);

    const alumnos = useMemo(
        () => (alumnosRes?.items ?? alumnosRes ?? []) as Array<{ id: number; nombre: string; dni?: string }>,
        [alumnosRes]
    );

    const searchFromCache = useCallback((_: string, q: string) => {
        const list = alumnos;
        if (!q) return list.map(a => ({ label: `${a.nombre} (${a.dni ?? ''})`, value: a.id }));
        const lower = q.toLowerCase();
        return list
            .filter(a => a.nombre?.toLowerCase().includes(lower) || String(a.dni ?? '').includes(lower))
            .map(a => ({ label: `${a.nombre} (${a.dni ?? ''})`, value: a.id }));
    }, [alumnos]);

    const { options: planOptions, byId: plansById } = usePlanesPrecios(gymId);
    const { data: paymentMethods = [], isLoading: methodsLoading } = useMethodsPaymentsByGym(gymId);

    const [openAdd, setOpenAdd] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [editingPago, setEditingPago] = useState<any | null>(null);
    const [openDelete, setOpenDelete] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const fields = useMemo(() => getInputFieldsPagos({
        planOptions,
        paymentMethodOptions: paymentMethods.map((pm: any) => ({ label: pm.nombre, value: pm.id })),
        searchFromCache,
    }), [planOptions, paymentMethods, searchFromCache]);

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

    const { data, isLoading, isError, error, isFetching } = usePagosByGym(
        gymId,
        page,
        pageSize,
        q
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

    const addPago = useAddPago(gymId);
    const editPago = useEditPago(gymId);
    const deletePago = useDeletePago(gymId);

    const handleAddPayment = async (values: any) => {
        console.log("📤 Valores mandados al backend:", JSON.stringify(values, null, 2));

        try {
            await addPago.mutateAsync({ ...values, gym_id: gymId });
            setOpenAdd(false);
        } catch (error) {
            console.error('Error al añadir pago:', error);
        }
    };

    const handleEdit = (payment: any) => {
        const sanitized = {
            ...payment,
            hora: payment.hora ? payment.hora.slice(0, 5) : '',
        };
        setEditingPago(sanitized);
        setOpenEdit(true);
    };

    const handleDelete = (id: number) => {
        setDeletingId(id);
        setOpenDelete(true);
    };

    const confirmDelete = async () => {
        if (!deletingId) return;
        try {
            await deletePago.mutateAsync(deletingId);
            setOpenDelete(false);
            setDeletingId(null);
        } catch (error) {
            console.error("❌ Error al eliminar pago:", error);
        }
    };

    const columns = useMemo(() => columnsPayments(handleEdit, handleDelete), []);

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
                <Stack
                    gap={{ xs: 2, md: 0 }}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                >
                    <Box sx={{ flex: 1, maxWidth: 400 }}>
                        <SearchBar
                            value={q}
                            onChange={(val) => handleSearchChange(val)}
                            onSearch={(text) => {
                                setQ(text);
                                setPage(1);
                            }}
                            isLoading={isFetching}
                            placeholder="Buscar pagos (responsable)…"
                        />
                    </Box>

                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        sx={{ whiteSpace: 'nowrap' }}
                        onClick={() => setOpenAdd(true)}
                    >
                        Añadir pago
                    </Button>
                </Stack>
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
                    onClose={() => {
                        setOpenEdit(false);
                        setEditingPago(null);
                    }}
                    onSubmit={async (values) => {
                        try {
                            await editPago.mutateAsync({ id: editingPago.id, values });
                            setOpenEdit(false);
                            setEditingPago(null);
                        } catch (error) {
                            console.error("❌ Error al editar pago:", error);
                        }
                    }}
                    confirmText="Guardar cambios"
                    cancelText="Cancelar"
                    layout={layoutPayments}
                    mode="edit"
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
