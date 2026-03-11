
import { useState } from 'react';
import { Box, IconButton, Tooltip, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Member } from '@/models/Member/Member';
import { Plan } from '@/models/Plan/Plan';
import { estadoVencimiento, formatearFecha } from '@/utils/date/dateUtils';
import { StateCheap } from '@/components/ui/cheap/StateCheap';

function buildWhatsAppUrl(member: Member, gymName: string, plan: Plan | undefined, code: 'expired' | 'expiring'): string {
  const phone = (member.telefono ?? '').replace(/\D/g, '');
  const planNombre = plan?.nombre ?? member.plan_nombre ?? 'tu plan';
  const precio = plan?.precio != null ? `$${plan.precio}` : 'consultar precio';
  const fv = (member as any).fecha_de_vencimiento ?? member.fecha_vencimiento;
  const fechaVenc = fv ? formatearFecha(fv) : 'próximamente';

  const intro = code === 'expired'
    ? `Tu membresía venció el ${fechaVenc} y te extrañamos por acá!`
    : `Tu membresía está a punto de vencer el ${fechaVenc}, no te quedes sin tu lugar!`;

  const mensaje =
    `¡Hola ${member.nombre}! ¿Cómo estás?\n\n` +
    `Te escribimos desde *${gymName}* con un recordatorio rápido \n\n` +
    `${intro}\n\n` +
    `*Tu plan*:\n` +
    `${planNombre}\n` +
    `Precio: ${precio}\n\n` +
    `¡Renovar es muy fácil, avisanos y te ayudamos!\n` +
    `Te esperamos con las puertas abiertas`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(mensaje)}`;
}

interface RowActionsProps {
  member: Member;
  gymName: string;
  plan: Plan | undefined;
  onEdit: (member: Member) => void;
  onDelete: (dni: number) => void;
  onWaSent?: (key: string) => void;
  isSent?: boolean;
}

function RowActions({ member, gymName, plan, onEdit, onDelete, onWaSent, isSent }: RowActionsProps) {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  const fv = (member as any).fecha_de_vencimiento ?? member.fecha_vencimiento;
  const { code } = estadoVencimiento(fv);
  const canNotify = code === 'expired' || code === 'expiring';
  const whatsappUrl = canNotify ? buildWhatsAppUrl(member, gymName, plan, code) : null;

  const handleWaClick = () => {
    if (canNotify && onWaSent) {
      const key = `${member.dni}_${fv ?? 'sin-fecha'}`;
      onWaSent(key);
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', gap: 0.5 }}>
      <IconButton size="small" onClick={(e) => setAnchor(e.currentTarget)}>
        <MoreVertIcon fontSize="small" />
      </IconButton>

      <Tooltip title={
        !canNotify ? 'El alumno está al día' :
        isSent ? 'Recordatorio ya enviado' :
        'Enviar recordatorio por WhatsApp'
      }>
        <span style={{ position: 'relative', display: 'inline-flex' }}>
          <IconButton
            size="small"
            sx={{ color: canNotify ? '#25D366' : 'action.disabled' }}
            component={canNotify ? 'a' : 'button'}
            href={whatsappUrl ?? undefined}
            target={canNotify ? '_blank' : undefined}
            rel={canNotify ? 'noopener noreferrer' : undefined}
            disabled={!canNotify}
            onClick={handleWaClick}
          >
            <WhatsAppIcon fontSize="small" />
          </IconButton>
          {isSent && (
            <CheckCircleIcon
              sx={{
                position: 'absolute',
                top: 1,
                right: 1,
                fontSize: 11,
                color: '#25D366',
                bgcolor: 'background.paper',
                borderRadius: '50%',
                pointerEvents: 'none',
              }}
            />
          )}
        </span>
      </Tooltip>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={() => { onEdit(member); setAnchor(null); }}>
          <ListItemIcon><EditIcon fontSize="small" color="primary" /></ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { onDelete(Number(member.dni)); setAnchor(null); }}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>Eliminar</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
}

export const columnsMember = (
  handleEdit: (member: Member) => void,
  handleDelete: (id: number) => void,
  gymName: string = '',
  byId: Record<string, Plan> = {},
  onWaSent?: (key: string) => void,
  waSent?: Set<string>,
): GridColDef[] => [
    { field: 'nombre', headerName: 'Nombre', flex: 0.18, align: 'center', headerAlign: 'center' },
    { field: 'dni', headerName: 'DNI', flex: 0.10, align: 'center', headerAlign: 'center' },
    { field: 'email', headerName: 'Email', flex: 0.20, align: 'center', headerAlign: 'center' },
    { field: 'telefono', headerName: 'Teléfono', flex: 0.12, align: 'center', headerAlign: 'center' },
    {
      field: 'plan_nombre',
      headerName: 'Plan',
      flex: 0.14,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => params.value ?? '-',
    },
    {
      field: 'clases_pagadas',
      headerName: 'Clases pagadas',
      type: 'number',
      flex: 0.10,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'clases_realizadas',
      headerName: 'Clases realizadas',
      type: 'number',
      flex: 0.12,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const realizadas = params.row.clases_realizadas ?? 0;
        const pagadas = params.row.clases_pagadas ?? 0;

        if (realizadas >= pagadas && pagadas > 0) {
          return (
            <Box component="span" sx={{ display: 'inline-flex' }}>
              <StateCheap code="limit" label="Límite" daysDiff={null} />
            </Box>
          );
        }

        return realizadas;
      },
    },
    {
      field: 'fecha_nacimiento',
      headerName: 'Fecha de nacimiento',
      flex: 0.14,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => formatearFecha(params.row.fecha_nacimiento),
    },
    {
      field: 'fecha_inicio',
      headerName: 'Fecha de inicio',
      flex: 0.12,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => formatearFecha(params.row.fecha_inicio),
    },
    {
      field: 'fecha_de_vencimiento',
      headerName: 'Fecha de vencimiento',
      flex: 0.14,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => formatearFecha(params.row.fecha_de_vencimiento),
    },
    {
      field: 'estado_alumno',
      headerName: 'Estado',
      flex: 0.16,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const fv = params.row.fecha_de_vencimiento ?? params.row.fecha_vencimiento;
        const { label, code, daysDiff } = estadoVencimiento(fv);
        return <StateCheap code={code} label={label} daysDiff={daysDiff} />;
      },
    },
    {
      field: 'acciones',
      headerName: 'Acciones',
      flex: 0.12,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const fv = (params.row as any).fecha_de_vencimiento ?? params.row.fecha_vencimiento;
        const key = `${params.row.dni}_${fv ?? 'sin-fecha'}`;
        return (
          <RowActions
            member={params.row}
            gymName={gymName}
            plan={byId[String(params.row.plan_id)]}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onWaSent={onWaSent}
            isSent={waSent?.has(key)}
          />
        );
      },
    },
  ];
