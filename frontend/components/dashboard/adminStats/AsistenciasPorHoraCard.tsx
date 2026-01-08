'use client';

import {
  Card,
  CardContent,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
} from 'recharts';
import { useTheme, alpha } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import { useUser } from '@/context/UserContext';
import { useAsistenciasHoyPorHora } from '@/hooks/assists/useAsistenciasHoy';
import { useState } from 'react';

const COLOR_MAIN = '#ff7a18';

const horaToMinutos = (hora: string) => {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
};


export function AsistenciasHoyPorHoraCard() {
  const { user } = useUser();
  const gymId = user?.gym_id ?? '';
  const { data, isLoading } = useAsistenciasHoyPorHora(gymId);
  const t = useTheme();
  const isMobile = useMediaQuery(t.breakpoints.down('sm'));
  const [open, setOpen] = useState(false);
  const [horaSeleccionada, setHoraSeleccionada] = useState<string | null>(null);
  const [alumnosHora, setAlumnosHora] = useState<any[]>([]);
  const [totalHora, setTotalHora] = useState<number>(0);

  const handleClose = () => setOpen(false);

  const itemSx = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    bgcolor: alpha(t.palette.primary.main, 0.06),
    borderRadius: 2,
    px: 2,
    py: 1.5,
    mb: 1,
  };

  const badgeSx = {
    width: 28,
    height: 28,
    borderRadius: '50%',
    bgcolor: COLOR_MAIN,
    color: '#fff',
    fontSize: 13,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    mr: 2,
    flexShrink: 0,
  };


  const cardSx = {
    borderRadius: 2,
    border: `1px solid ${alpha(t.palette.text.primary, 0.06)}`,
    bgcolor: t.palette.background.paper,
    height: '100%',
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
    transition: 'box-shadow .2s ease',
    '&:hover': {
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    },
  } as const;

  const asistencias =
    data?.items?.map((d: any) => ({
      hora: `${d.hora}:00`,
      cantidad: d.total,
    })) ?? [];

  const totales = data?.total ?? 0;

  return (
    <Card sx={cardSx}>
      <CardContent sx={{ pt: 2 }}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={1}
        >
          <Typography variant="subtitle2" color="text.secondary">
            Asistencias totales de hoy: {totales}
          </Typography>
        </Box>

        {isLoading ? (
          <Box
            sx={{
              height: 260,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'opacity .15s ease',
              '&:hover': {
                opacity: 0.95,
              },
            }}
          >
            <CircularProgress sx={{ color: COLOR_MAIN }} size={32} />
          </Box>
        ) : (
          <Box sx={{
            width: '100%',
            height: 260,
            cursor: 'pointer',

            '& svg': {
              cursor: 'pointer',
            },
          }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={asistencias}
                margin={{ top: 10, right: 16, left: -10, bottom: 0 }}
                onClick={(e: any) => {
                  if (!e || !e.activeLabel) return;

                  const hora = parseInt(e.activeLabel);
                  const detalle = data?.items?.find(
                    (i: any) => i.hora === hora
                  );

                  if (!detalle) return;

                  setHoraSeleccionada(`${hora}:00`);
                  setTotalHora(detalle.total);
                  setAlumnosHora(
                    [...detalle.alumnos].sort(
                      (a: any, b: any) =>
                        horaToMinutos(b.hora) - horaToMinutos(a.hora)
                    )
                  )
                  setOpen(true);
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={alpha(t.palette.text.primary, 0.08)}
                />

                <XAxis
                  dataKey="hora"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: t.palette.text.secondary, fontSize: 12 }}
                />

                <YAxis
                  hide={isMobile}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  tick={{ fill: t.palette.text.secondary, fontSize: 12 }}
                />

                <defs>
                  <linearGradient
                    id="asistenciasGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={COLOR_MAIN} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={COLOR_MAIN} stopOpacity={0.05} />
                  </linearGradient>
                </defs>

                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: 'none',
                    boxShadow: t.shadows[3],
                  }}
                  labelStyle={{ fontWeight: 600 }}
                />

                <Area
                  type="monotone"
                  dataKey="cantidad"
                  stroke="none"
                  fill="url(#asistenciasGradient)"
                />

                <Line
                  type="monotone"
                  dataKey="cantidad"
                  stroke={COLOR_MAIN}
                  strokeWidth={2.5}
                  dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>

      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1.5,
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 1,
          }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary">
              Asistencias por horario - {totalHora} asistencias
            </Typography>
            <Typography variant="h6" fontWeight={600}>
              {horaSeleccionada} hs
            </Typography>
          </Box>

          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent
          sx={{
            pt: 1,
            maxHeight: {
              xs: '50vh',
              sm: 'unset',
            },
            overflowY: {
              xs: 'auto',
              sm: 'visible',
            },
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': {
              display: 'none',
            },
          }}
        >
          {alumnosHora.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No hubo asistencias en este horario.
            </Typography>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(1, 1fr)',
                },
                gap: .5,
              }}
            >
              {alumnosHora.map((a, idx) => (
                <Box key={a.alumno_id} sx={itemSx}>
                  <Box display="flex" alignItems="center" width='100%'>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          minWidth: '50%',
                        }}
                      >
                        <Typography fontWeight={500} noWrap>
                          {a.nombre}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          ml: 2,
                          pl: 2,
                          minWidth: '50%',
                          borderLeft: `1px solid ${alpha(t.palette.text.primary, 0.12)}`,
                          flexShrink: 0,
                        }}
                      >
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          sx={{ color: '#14b8a6', whiteSpace: 'nowrap' }}
                        >
                          {a.hora} hs
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>

      </Dialog>
    </Card >

  );
}
