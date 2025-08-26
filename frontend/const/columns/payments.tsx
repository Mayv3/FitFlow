import { Box, IconButton } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import React from 'react';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { formatearFecha } from '@/utils/date/dateUtils';
import { Payment } from '@/models/Payment/Payment';

const ARS = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

const center = { align: 'center' as const, headerAlign: 'center' as const };

export const columnsPayments = (
  handleEdit: (payment: Payment) => void,
  handleDelete: (id: number) => void
): GridColDef[] => [
  {
    field: 'alumno_id',
    headerName: 'Alumno',
    flex: 0.12,
    ...center,
    renderCell: (p) => p.row?.alumno_nombre ?? '—',
  },
  {
    field: 'monto_total',
    headerName: 'Monto',
    flex: 0.14,
    ...center,
    renderCell: (params) => ARS.format(Number(params.row?.monto_total ?? 0)),
  },
  {
    field: 'metodo_legible',
    headerName: 'Método de pago',
    flex: 0.16,
    ...center,
    renderCell: (params) => {
      const legible = params.row?.metodo_legible ?? '—';
      return legible;
    },
  },
  {
    field: 'tipo',
    headerName: 'Tipo',
    flex: 0.12,
    ...center,
    renderCell: (p) => p.row?.tipo ?? '—',
  },
  {
    field: 'plan_id',
    headerName: 'Plan',
    flex: 0.16,
    ...center,
    renderCell: (p) => p.row?.plan_nombre ?? '—',
  },
  {
    field: 'fecha_de_pago',
    headerName: 'Fecha de pago',
    flex: 0.14,
    ...center,
    renderCell: (p) => formatearFecha(p.row?.fecha_de_pago ?? null),
  },
  {
    field: 'hora',
    headerName: 'Hora',
    flex: 0.12,
    ...center,
    renderCell: (p) => {
      const h: string | null = p.row?.hora ?? null;
      return h ? h.slice(0, 5) : '—';
    },
  },
  {
    field: 'fecha_de_venc',
    headerName: 'Vencimiento',
    flex: 0.14,
    ...center,
    renderCell: (p) => formatearFecha(p.row?.fecha_de_venc ?? null),
  },
  {
    field: 'responsable',
    headerName: 'Responsable',
    flex: 0.16,
    ...center,
    renderCell: (p) => p.row?.responsable ?? '—',
  },
  {
    field: 'acciones',
    headerName: 'Acciones',
    flex: 0.14,
    sortable: false,
    ...center,
    renderCell: (p) => (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          height: '100%',
          width: '100%',
        }}
      >
        <IconButton
          size="small"
          color="primary"
          onClick={() => handleEdit(p.row)}
        >
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          color="error"
          onClick={() => handleDelete(p.row?.id)}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
    ),
  },
];
