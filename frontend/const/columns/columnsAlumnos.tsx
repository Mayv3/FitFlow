
import { Box, IconButton } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import React from 'react';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Member } from '@/models/Member';
import { formatearFecha } from '@/utils/dateUtils';

export const columnsMember = (
  handleEdit: (member: Member) => void,
  handleDelete: (id: number) => void
): GridColDef[] => [
    { field: 'id', headerName: 'ID', flex: 0.1 },
    { field: 'nombre', headerName: 'Nombre', flex: 0.1 },
    { field: 'dni', headerName: 'DNI', flex: 0.1 },
    { field: 'email', headerName: 'Email', flex: 0.1 },
    { field: 'telefono', headerName: 'Teléfono', flex: 0.1 },
    { field: 'plan_id', headerName: 'Plan', flex: 0.1 },
    { field: 'clases_pagadas', headerName: 'Clases pagadas', type: 'number', flex: 0.1 },
    { field: 'clases_realizadas', headerName: 'Clases realizadas', type: 'number', flex: 0.1 },
    {
      field: 'fecha_vencimiento', headerName: 'Fecha de vencimiento', type: 'number', flex: 0.1, renderCell: (params) => {
        return formatearFecha(params.row.fecha_vencimiento);
      }
    },
    {
      field: 'fecha_nacimiento', headerName: 'Fecha de nacimiento', flex: 0.1, renderCell: (params) => {
        return formatearFecha(params.row.fecha_nacimiento);
      }
    },
    {
      field: 'fecha_inicio', headerName: 'Fecha de inicio', flex: 0.1, renderCell: (params) => {
        return formatearFecha(params.row.fecha_inicio)
      }
    },
    {
      field: 'acciones',
      headerName: 'Acciones',
      flex: 0.15,
      renderCell: (params) => (
        <Box>
          <IconButton color="primary" onClick={() => handleEdit(params.row)}>
            <EditIcon />
          </IconButton>
          <IconButton color="error" onClick={() => handleDelete(params.row.id)}>
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];