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
import { usePlanesPrecios } from '@/hooks/plans/usePlanesPrecios';
import { useAlumnosSimpleByGym } from '@/hooks/alumnos/useAlumnosByGym';
import { useServicesByGym } from '@/hooks/services/useServicesOptions';
import { useProducts } from '@/hooks/products/useProducts';
import { useQueryClient } from '@tanstack/react-query';

import {
    usePagosByGym,
    useAddPago,
    useEditPago,
    useDeletePago,
} from '@/hooks/payments/usePaymentsApi';
import { GenericModal } from '@/components/ui/modals/GenericModal';
import { notify } from '@/lib/toast';
import { PaymentStats } from './stats/PaymentStats';
import { fechaHoyArgentinaSinFormato, horaActualArgentina, horaActualArgentinaFunction } from '@/utils/date/dateUtils';
import moment from 'moment';
import { usePaymentsStats } from '@/hooks/stats/usePaymentsStats';
import tableSize from '@/const/tables/tableSize';

export default function PaymentList() {
    
    const queryClient = useQueryClient();
    const { user, loading: userLoading } = useUser();
    const gymId = user?.gym_id ?? '';
    const { data: alumnosRes } = useAlumnosSimpleByGym(gymId);
    const { data: services } = useServicesByGym(gymId);
    const { data: productsData } = useProducts(gymId, 1, 1000);
    const alumnos = useMemo(
        () => (alumnosRes?.items ?? alumnosRes ?? []) as Array<{ id: number; nombre: string; dni?: string }>,
        [alumnosRes]
    );

    const { options: planOptions, byId: plansById } = usePlanesPrecios(gymId);

    const [openAdd, setOpenAdd] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [editingPago, setEditingPago] = useState<any | null>(null);
    const [openDelete, setOpenDelete] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const [fromDate, setFromDate] = useState<moment.Moment | null>(fechaHoyArgentinaSinFormato);
    const [toDate, setToDate] = useState<moment.Moment | null>(fechaHoyArgentinaSinFormato);

    const [page, setPage] = useState(1);
    const [q, setQ] = useState('');

    const fromDateISO = fromDate?.format('YYYY-MM-DD') ?? null;
    const toDateISO = toDate?.format('YYYY-MM-DD') ?? null;

    const { data, isLoading, isError, error, isFetching } = usePagosByGym(gymId, page, tableSize, q, { fromDate: fromDateISO, toDate: toDateISO });
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

    const serviceOptions = useMemo(() => {
        if (!services?.items) return [];
        return services.items.map((s: any) => {
            const duracion = s.duracion_minutos ? `${s.duracion_minutos} min` : '';
            const precio = s.precio ? `($${s.precio.toLocaleString('es-AR')})` : '';
            const label = `${s.nombre}${duracion ? ` — ${duracion}` : ''} ${precio}`.trim();
            return { label, value: s.id };
        });
    }, [services]);

    const productOptions = useMemo(() => {
        if (!productsData?.items) return [];
        return productsData.items.map((p: any) => {
            const precio = p.precio ? `($${p.precio.toLocaleString('es-AR')})` : '';
            const stock = p.stock !== undefined ? `[Stock: ${p.stock}]` : '';
            const sinStock = p.stock <= 0 ? ' - SIN STOCK' : '';
            const label = `${p.nombre} ${precio} ${stock}${sinStock}`.trim();
            return {
                label,
                value: p.id,
                stock: p.stock,
                disabled: p.stock <= 0
            };
        });
    }, [productsData]);

    const fields = useMemo(() => getInputFieldsPagos({
        planOptions,
        serviceOptions,
        productOptions,
        searchFromCache,
    }), [planOptions, serviceOptions, productOptions, searchFromCache]);

    const handleSearchChange = useMemo(
        () =>
            debounce((value: string) => {
                setQ(value);
                setPage(1);
            }, 450),
        []
    );

    const pagos = data?.items ?? [];

    const total = data?.total ?? 0;

    const handleAddPayment = async (values: any) => {
        try {
            // 1. Validar método de pago
            const metodoPago = Number(values.metodo_pago);
            if (!metodoPago || ![1, 2, 3, 4].includes(metodoPago)) {
                notify.error('❌ Debes seleccionar un método de pago válido');
                return;
            }

            // 2. Construir items según método de pago
            const items: { metodo_de_pago_id: number; monto: number }[] = [];

            if (metodoPago === 4) {
                // Mixto: puede tener efectivo, tarjeta y/o mercado pago
                const montoEfectivo = Number(values.monto_efectivo) || 0;
                const montoTarjeta = Number(values.monto_tarjeta) || 0;
                const montoMp = Number(values.monto_mp) || 0;

                if (montoEfectivo > 0) items.push({ metodo_de_pago_id: 1, monto: montoEfectivo });
                if (montoTarjeta > 0) items.push({ metodo_de_pago_id: 2, monto: montoTarjeta });
                if (montoMp > 0) items.push({ metodo_de_pago_id: 3, monto: montoMp });

                if (items.length === 0) {
                    notify.error('❌ En pago mixto debes ingresar al menos un monto');
                    return;
                }
            } else {
                // Efectivo (1), Tarjeta (2) o Mercado Pago (3)
                let monto = 0;

                if (metodoPago === 1) {
                    monto = Number(values.monto_efectivo) || 0;
                } else if (metodoPago === 2) {
                    monto = Number(values.monto_tarjeta) || 0;
                } else if (metodoPago === 3) {
                    monto = Number(values.monto_mp) || 0;
                }

                if (monto <= 0) {
                    notify.error('❌ El monto debe ser mayor a 0');
                    return;
                }

                items.push({ metodo_de_pago_id: metodoPago, monto });
            }

            // 3. Validación final: debe haber al menos un item
            if (items.length === 0) {
                notify.error('❌ No se pudo crear el pago: no hay items válidos');
                return;
            }

            // 4. Calcular monto total y validar
            const monto_total = items.reduce((acc, i) => acc + i.monto, 0);
            if (monto_total <= 0) {
                notify.error('❌ El monto total debe ser mayor a 0');
                return;
            }

            const isPlan = values.origen_pago === "plan";
            const isServicio = values.origen_pago === "servicio";
            const isProducto = values.origen_pago === "producto";

            // 5. Construir payload limpio
            const payload: any = {
                alumno_id: values.alumno_id,
                tipo: values.tipo,
                fecha_de_pago: values.fecha_de_pago,
                fecha_de_venc: values.fecha_de_venc,
                hora: values.hora,
                responsable: values.responsable,
                gym_id: gymId,
                items,
                monto_total,
                isPlan,
                plan_id: null,
                service_id: null,
                producto_id: null,
            };

            if (isPlan) {
                payload.plan_id = values.plan_id ?? null;
            } else if (isServicio) {
                payload.service_id = values.servicio_id ?? null;
            } else if (isProducto) {
                payload.producto_id = values.producto_id ?? null;

                // Verificar stock del producto
                const selectedProduct = productOptions.find(p => p.value === values.producto_id);
                if (!selectedProduct || selectedProduct.stock <= 0) {
                    notify.error('❌ El producto seleccionado no tiene stock disponible');
                    return;
                }
            }

            console.log('[handleAddPayment] Payload final:', JSON.stringify(payload, null, 2));

            await addPago.mutateAsync(payload);
            setOpenAdd(false);

            if (isProducto) {
                queryClient.invalidateQueries({ queryKey: ['products', gymId] });
                notify.success("✅ Pago añadido correctamente. Se descontó 1 unidad del stock del producto.");
            } else {
                notify.success("✅ Pago añadido correctamente");
            }
        } catch (error: any) {
            console.error("Error al añadir pago:", error);
            if (error?.response?.data?.error?.includes('sin stock')) {
                notify.error('❌ El producto seleccionado no tiene stock disponible');
            } else {
                notify.error("❌ Error al añadir el pago");
            }
        }
    };



    const handleOpenEdit = (payment: any) => {
        const efectivo = payment.items?.find((i: any) => i.metodo_de_pago_id === 1)?.monto ?? '';
        const tarjeta = payment.items?.find((i: any) => i.metodo_de_pago_id === 2)?.monto ?? '';
        const mp = payment.items?.find((i: any) => i.metodo_de_pago_id === 3)?.monto ?? '';

        let metodo_pago = 'Mixto';
        if (efectivo && !mp && !tarjeta) metodo_pago = 'Efectivo';
        else if (mp && !efectivo && !tarjeta) metodo_pago = 'Mercado Pago';
        else if (tarjeta && !efectivo && !mp) metodo_pago = 'Tarjeta';

        const origen_pago = payment.plan_id ? 'plan' : payment.servicio_id ? 'servicio' : '';

        const sanitized = {
            ...payment,
            monto_efectivo: efectivo,
            monto_mp: mp,
            monto_tarjeta: tarjeta,
            metodo_pago,
            origen_pago,
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

            const efectivo = Number(values.monto_efectivo) || 0;
            const mp = Number(values.monto_mp) || 0;
            const tarjeta = Number(values.monto_tarjeta) || 0;

            const items = [
                { metodo_de_pago_id: 1, monto: efectivo },
                { metodo_de_pago_id: 2, monto: tarjeta },
                { metodo_de_pago_id: 3, monto: mp },
            ].filter(i => i.monto > 0);

            const monto_total = efectivo + mp + tarjeta;

            const payload = {
                alumno_id: values.alumno_id ?? editingPago.alumno_id,
                tipo: values.tipo ?? editingPago.tipo,
                fecha_de_pago: values.fecha_de_pago ?? editingPago.fecha_de_pago,
                fecha_de_venc: values.fecha_de_venc ?? editingPago.fecha_de_venc,
                responsable: values.responsable ?? editingPago.responsable,
                hora: values.hora ?? editingPago.hora,
                gym_id: user?.gym_id,
                plan_id: editingPago.plan_id ?? null,
                service_id: editingPago.servicio_id ?? editingPago.service_id ?? null,
                items,
                monto_total: monto_total > 0 ? monto_total : editingPago.monto_total,
            };

            console.log("🟢 Enviando payload final al backend:", payload);

            await editPago.mutateAsync({ id, values: payload });

            handleCloseEdit();
            notify.success("Pago editado correctamente");
        } catch (error) {
            console.error("Error al editar pago:", error);
            notify.error("❌ Error al editar el pago");
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
        <Box sx={{ maxWidth: 'xl', mx: 'auto', py: 2 }}>
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
                                width: { xs: '100%', md: '300px' },
                                height: '56px',
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
                pageSize={tableSize}
                onPaginationModelChange={({ page: newPage }) => setPage(newPage + 1)}
                loading={isFetching}
            />

            <PaymentStats data={stats} isLoading={statsLoading} />

            {openAdd && (
                <FormModal
                    open={openAdd}
                    title="Añadir un pago"
                    fields={fields}
                    initialValues={{
                        hora: horaActualArgentinaFunction(),
                    }}
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
                    fields={fields
                        .filter(f =>
                            ['tipo', 'metodo_pago', 'monto_efectivo', 'monto_mp', 'monto_tarjeta'].includes(f.name)
                        )
                        .sort((a, b) => {
                            const order = ['tipo', 'metodo_pago', 'monto_efectivo', 'monto_mp', 'monto_tarjeta'];
                            return order.indexOf(a.name) - order.indexOf(b.name);
                        })}
                    gridColumns={12}
                    gridGap={16}
                    initialValues={editingPago}
                    onClose={handleCloseEdit}
                    onSubmit={handleEditPayment}
                    confirmText="Guardar cambios"
                    mode="edit"
                    cancelText="Cancelar"
                    layout={{
                        tipo: { colStart: 1, colSpan: 6 },
                        metodo_pago: { colStart: 7, colSpan: 6 },
                        monto_efectivo: { colStart: 1, colSpan: 4 },
                        monto_mp: { colStart: 5, colSpan: 4 },
                        monto_tarjeta: { colStart: 9, colSpan: 4 },
                    }}
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
