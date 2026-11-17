'use client';

import { useState } from 'react';
import {
  Box, ButtonBase, Card, CardContent, CircularProgress, Dialog, DialogContent, DialogTitle,
  IconButton, Tooltip, Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CloseIcon from '@mui/icons-material/Close';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Cookies from 'js-cookie';
import { useGymThemeSettings } from '@/hooks/useGymThemeSettings';
import { useAlumnosEnRiesgo } from '@/hooks/dashboard/useAlumnosEnRiesgo';
import { InfoTooltip } from '@/components/ui/tooltip/InfoTooltip';
import { normalizeArPhone } from '@/const/columns/members';
import { formatearFecha } from '@/utils/date/dateUtils';
import type { AlumnoEnRiesgo } from '@/models/Stats/EnRiesgo';

const DIAS = 14;

type Tramo = {
  key: string;
  label: string;
  color: string;
  incluye: (a: AlumnoEnRiesgo) => boolean;
};

const dias = (a: AlumnoEnRiesgo) => a.dias_sin_venir ?? 0;

// De menos a más urgente. "Nunca vino" va aparte: sus días cuentan desde el inicio del plan.
const TRAMOS: Tramo[] = [
  { key: '14-30', label: `${DIAS}–30 días`, color: 'warning.light', incluye: (a) => !!a.ultima_asistencia && dias(a) < 30 },
  { key: '30-60', label: '30–60 días', color: 'warning.main', incluye: (a) => !!a.ultima_asistencia && dias(a) >= 30 && dias(a) < 60 },
  { key: '60+', label: '+60 días', color: 'error.main', incluye: (a) => !!a.ultima_asistencia && dias(a) >= 60 },
  { key: 'nunca', label: 'Nunca vino', color: 'error.dark', incluye: (a) => !a.ultima_asistencia },
];

function mensajeWhatsApp(a: AlumnoEnRiesgo, gymName: string) {
  const desde = gymName ? ` desde *${gymName}*` : '';
  return (
    `¡Hola ${a.nombre}! ¿Cómo estás?\n\n` +
    `Te escribimos${desde} porque hace unos días que no te vemos por acá y te extrañamos.\n\n` +
    `¿Está todo bien? Si necesitás algo, avisanos. ¡Te esperamos!`
  );
}

function AlumnoRow({ a, gymName }: { a: AlumnoEnRiesgo; gymName: string }) {
  const t = useTheme();
  const phone = normalizeArPhone(a.telefono);
  const waUrl = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(mensajeWhatsApp(a, gymName))}` : null;

  return (
    <Box
      component="li"
      sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1,
        bgcolor: alpha(t.palette.primary.main, 0.06),
        borderRadius: 2, px: 2, py: 1.25,
      }}
    >
      <Box minWidth={0}>
        <Typography fontWeight={500} noWrap>{a.nombre}</Typography>
        <Typography variant="caption" color="text.secondary" component="div" noWrap>
          {a.plan_nombre ?? 'Sin plan'} · vence {formatearFecha(a.fecha_de_vencimiento)}
        </Typography>
      </Box>
      <Box display="flex" alignItems="center" gap={0.5} flexShrink={0}>
        <Typography variant="caption" fontWeight={600} color="text.secondary">
          {a.ultima_asistencia ? `${a.dias_sin_venir} días sin venir` : 'Nunca vino'}
        </Typography>
        {waUrl ? (
          <Tooltip title="Escribir por WhatsApp">
            <IconButton
              component="a"
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              aria-label={`WhatsApp a ${a.nombre}`}
              sx={{ color: '#25D366' }}
            >
              <WhatsAppIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Sin teléfono registrado">
            <span>
              <IconButton size="small" disabled aria-label="Sin teléfono">
                <WhatsAppIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
}

export function AlumnosEnRiesgoCard() {
  const { data, isLoading, isError } = useAlumnosEnRiesgo(DIAS);
  const t = useTheme();
  const { borderRadius } = useGymThemeSettings();
  const gymName = Cookies.get('gym_name') ?? '';
  const [abierto, setAbierto] = useState<Tramo | null>(null);

  const items = data?.items ?? [];
  const porTramo = TRAMOS.map((tr) => ({ tramo: tr, alumnos: items.filter(tr.incluye) }));
  const max = Math.max(1, ...porTramo.map((p) => p.alumnos.length));
  const pct = data?.activos ? Math.round((items.length / data.activos) * 100) : 0;
  const alumnosAbiertos = abierto ? porTramo.find((p) => p.tramo.key === abierto.key)?.alumnos ?? [] : [];

  const renderContenido = () => {
    if (isLoading) {
      return (
        <Box sx={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={28} />
        </Box>
      );
    }
    if (isError || !data) {
      return <Typography color="error" variant="body2">No se pudieron cargar los alumnos en riesgo.</Typography>;
    }
    if (!data.registra_asistencias) {
      return (
        <Typography variant="body2" color="text.secondary">
          No se registraron asistencias en los últimos 30 días, así que no se puede saber quién dejó de venir.
        </Typography>
      );
    }
    if (items.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary">
          Ningún alumno en riesgo: todos los activos vinieron en los últimos {DIAS} días.
        </Typography>
      );
    }
    return (
      <>
        <Box display="flex" alignItems="baseline" gap={1} mb={2}>
          <Typography variant="h4" fontWeight={700} lineHeight={1}>{items.length}</Typography>
          <Typography variant="body2" color="text.secondary">de {data.activos} activos ({pct}%)</Typography>
        </Box>

        <Box display="grid" gap={0.5}>
          {porTramo.map(({ tramo, alumnos }) => (
            <ButtonBase
              key={tramo.key}
              onClick={() => setAbierto(tramo)}
              disabled={alumnos.length === 0}
              aria-label={`${tramo.label}: ${alumnos.length}`}
              sx={{
                display: 'grid',
                gridTemplateColumns: '96px 1fr 32px 20px',
                alignItems: 'center',
                gap: 1.5,
                px: 1, py: 0.75,
                borderRadius: 1.5,
                textAlign: 'left',
                '&:hover': { bgcolor: alpha(t.palette.text.primary, 0.04) },
                '&.Mui-disabled': { opacity: 0.5 },
              }}
            >
              <Typography variant="body2" color="text.secondary" noWrap>{tramo.label}</Typography>
              <Box sx={{ height: 10, borderRadius: 5, bgcolor: alpha(t.palette.text.primary, 0.06), overflow: 'hidden' }}>
                <Box
                  sx={{
                    height: '100%',
                    width: `${(alumnos.length / max) * 100}%`,
                    bgcolor: tramo.color,
                    borderRadius: 5,
                    transition: 'width 300ms ease',
                  }}
                />
              </Box>
              <Typography variant="body2" fontWeight={600} textAlign="right">{alumnos.length}</Typography>
              <ChevronRightIcon fontSize="small" sx={{ color: 'text.disabled' }} />
            </ButtonBase>
          ))}
        </Box>

        <Typography variant="caption" color="text.secondary" display="block" mt={1.5}>
          Tocá un tramo para ver los alumnos y escribirles.
        </Typography>
      </>
    );
  };

  return (
    <>
      <Card
        sx={{
          height: '100%',
          borderRadius,
          border: `1px solid ${alpha(t.palette.text.primary, 0.06)}`,
          bgcolor: t.palette.mode === 'dark' ? '#0a0a0a' : t.palette.background.paper,
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
        }}
      >
        <CardContent>
          <Box display="flex" alignItems="center" mb={1.5}>
            <Typography variant="subtitle2" color="text.secondary">Alumnos en riesgo</Typography>
            <InfoTooltip
              title={`Alumnos con el plan vigente que no vienen hace ${DIAS} días o más, contando desde su última asistencia o desde que empezó su plan actual. Son los más propensos a no renovar.`}
            />
          </Box>
          {renderContenido()}
        </CardContent>
      </Card>

      <Dialog
        open={!!abierto}
        onClose={() => setAbierto(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 1.5 } }}
      >
        <DialogTitle sx={{ fontWeight: 600, pr: 6 }}>
          {abierto?.label} · {alumnosAbiertos.length} {alumnosAbiertos.length === 1 ? 'alumno' : 'alumnos'}
          <IconButton
            aria-label="Cerrar"
            onClick={() => setAbierto(null)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 1 }}>
            {alumnosAbiertos.map((a) => <AlumnoRow key={a.id} a={a} gymName={gymName} />)}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
