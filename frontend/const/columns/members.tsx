
import { Box, IconButton } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import React from 'react';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Member } from '@/models/Member/Member';
import { estadoVencimiento, formatearFecha } from '@/utils/date/dateUtils';
import { StateCheap } from '@/components/ui/cheap/StateCheap';

export const columnsMember = (
  handleEdit: (member: Member) => void,
  handleDelete: (id: number) => void
): GridColDef[] => [
    { field: 'nombre', headerName: 'Nombre', flex: 0.18 },
    { field: 'dni', headerName: 'DNI', flex: 0.10 },
    { field: 'email', headerName: 'Email', flex: 0.20 },
    { field: 'telefono', headerName: 'Teléfono', flex: 0.12 },
    {
      field: 'plan_nombre',
      headerName: 'Plan',
      flex: 0.14, renderCell: (params) => {
        return params.value ?? '-';
      },
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'clases_pagadas',
      headerName: 'Clases pagadas',
      type: 'number', flex: 0.10,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'clases_realizadas',
      headerName: 'Clases realizadas',
      type: 'number', flex: 0.12,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'fecha_nacimiento',
      headerName: 'Fecha de nacimiento',
      flex: 0.14, renderCell: (params) => {
        return formatearFecha(params.row.fecha_nacimiento);
      }
    },
    {
      field: 'fecha_inicio',
      headerName: 'Fecha de inicio',
      flex: 0.12, renderCell: (params) => {
        return formatearFecha(params.row.fecha_inicio)
      }
    },
    {
      field: 'fecha_de_vencimiento',
      headerName: 'Fecha de vencimiento',
      type: 'number',
      flex: 0.14, renderCell: (params) => {
        return formatearFecha(params.row.fecha_de_vencimiento);
      }
    },
    {
      field: 'estado_alumno',
      headerName: 'Estado',
      align: 'center',
      headerAlign: 'center',
      flex: 0.16,
      sortable: false,
      renderCell: (params) => {
        const fv = params.row.fecha_de_vencimiento ?? params.row.fecha_vencimiento;
        const { label, code, daysDiff } = estadoVencimiento(fv);
        return (<StateCheap code={code} label={label} daysDiff={daysDiff} />);
      },
    },
    {
      field: 'acciones',
      headerName: 'Acciones',
      flex: 0.12,
      renderCell: (params) => (
        <Box>
          <IconButton color="primary" onClick={() => handleEdit(params.row)}>
            <EditIcon />
          </IconButton>
          <IconButton color="error" onClick={() => handleDelete(params.row.dni)}>
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];