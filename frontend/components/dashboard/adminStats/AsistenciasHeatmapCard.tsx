'use client';

import { useState } from 'react';
import { Box, Card, CardContent, CircularProgress, MenuItem, TextField, Tooltip, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useGymThemeSettings } from '@/hooks/useGymThemeSettings';
import { useAsistenciasHeatmap, type HeatmapCelda } from '@/hooks/dashboard/useAsistenciasHeatmap';
import { InfoTooltip } from '@/components/ui/tooltip/InfoTooltip';
import { YearSelector, useYearState } from './YearSelector';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const hh = (h: number) => `${String(h).padStart(2, '0')}:00`;
/** "de 19:00 a 20:00": la celda junta las entradas de esa hora completa. */
const franja = (h: number) => `de ${hh(h)} a ${hh(h + 1)}`;

const COL_DIA = 40;

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/** Horas de la primera a la última con actividad (sin huecos), valores por celda, máximo y pico. */
export function armarGrilla(filas: HeatmapCelda[]) {
  const porCelda = new Map(filas.map((f) => [`${f.dia}-${f.hora}`, f.total]));
  const conDatos = filas.filter((f) => f.total > 0);
  const horasConDatos = conDatos.map((f) => f.hora);
  const desde = Math.min(...horasConDatos);
  const hasta = Math.max(...horasConDatos);
  const horas = horasConDatos.length ? Array.from({ length: hasta - desde + 1 }, (_, i) => desde + i) : [];
  const pico = conDatos.reduce<HeatmapCelda | null>((p, f) => (!p || f.total > p.total ? f : p), null);

  return {
    horas,
    valor: (dia: number, hora: number) => porCelda.get(`${dia}-${hora}`) ?? 0,
    max: pico?.total ?? 0,
    total: conDatos.reduce((s, f) => s + f.total, 0),
    pico: pico ? { dia: pico.dia, hora: pico.hora, total: pico.total } : null,
  };
}

export function AsistenciasHeatmapCard() {
  const t = useTheme();
  const { borderRadius, primaryColor } = useGymThemeSettings();
  const [year, setYear] = useYearState();
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const { data, isLoading, isError } = useAsistenciasHeatmap(year, month);

  const grilla = armarGrilla(data ?? []);
  const surface = t.palette.mode === 'dark' ? '#0a0a0a' : t.palette.background.paper;

  // Escala secuencial de un solo tono (el del gym): más asistencias, más opaco.
  const colorCelda = (v: number) =>
    v === 0 ? alpha(t.palette.text.primary, 0.04) : alpha(primaryColor, 0.15 + 0.85 * (v / grilla.max));

  const renderContenido = () => {
    if (isLoading) {
      return (
        <Box sx={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={28} />
        </Box>
      );
    }
    if (isError) {
      return <Typography color="error" variant="body2">No se pudieron cargar las asistencias.</Typography>;
    }
    if (!grilla.pico) {
      return (
        <Typography variant="body2" color="text.secondary">
          No hay asistencias registradas en este período.
        </Typography>
      );
    }

    const { pico } = grilla;
    return (
      <>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Horario pico:{' '}
          <Box component="span" fontWeight={600} color="text.primary">
            {DIAS[pico.dia - 1].toLowerCase()} {franja(pico.hora)} · {pico.total} asistencias
          </Box>
          {' '}· {grilla.total} en total
        </Typography>

        {/* Sin scroll horizontal: las columnas se achican para entrar en el ancho de la tarjeta. */}
        <Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: `${COL_DIA}px repeat(${grilla.horas.length}, minmax(0, 1fr))`,
              gap: '3px',
            }}
          >
            <Box />
            <Typography
              variant="caption"
              color="text.secondary"
              textAlign="center"
              sx={{ gridColumn: `2 / span ${grilla.horas.length}`, fontWeight: 600 }}
            >
              Hora de entrada
            </Typography>

            <Box />
            {grilla.horas.map((h) => (
              <Typography
                key={h}
                variant="caption"
                color="text.secondary"
                textAlign="center"
                sx={{ fontSize: 10, overflow: 'hidden', whiteSpace: 'nowrap' }}
              >
                {hh(h)}
              </Typography>
            ))}

            {DIAS.map((nombre, i) => {
              const dia = i + 1;
              return [
                <Typography
                  key={`l-${dia}`}
                  variant="caption"
                  color="text.secondary"
                  title={nombre}
                  sx={{ alignSelf: 'center' }}
                >
                  {nombre.slice(0, 3)}
                </Typography>,
                ...grilla.horas.map((h) => {
                  const v = grilla.valor(dia, h);
                  const texto = `${nombre} ${franja(h)}: ${v} asistencias`;
                  return (
                    <Tooltip key={`${dia}-${h}`} title={texto} arrow disableInteractive>
                      <Box
                        role="img"
                        aria-label={texto}
                        sx={{
                          height: 28,
                          borderRadius: 1,
                          bgcolor: colorCelda(v),
                          outline: pico.dia === dia && pico.hora === h ? `2px solid ${t.palette.text.primary}` : 'none',
                          outlineOffset: -2,
                          transition: 'transform 120ms ease',
                          '&:hover': { transform: 'scale(1.08)' },
                        }}
                      />
                    </Tooltip>
                  );
                }),
              ];
            })}
          </Box>
        </Box>

        <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1} mt={1.5}>
          <Typography variant="caption" color="text.secondary">Menos</Typography>
          <Box
            sx={{
              width: 160,
              height: 8,
              borderRadius: 4,
              background: `linear-gradient(to right, ${alpha(primaryColor, 0.15)}, ${primaryColor})`,
              border: `1px solid ${alpha(t.palette.text.primary, 0.06)}`,
            }}
          />
          <Typography variant="caption" color="text.secondary">Más</Typography>
        </Box>
      </>
    );
  };

  return (
    <Card
      sx={{
        height: '100%',
        borderRadius,
        border: `1px solid ${alpha(t.palette.text.primary, 0.06)}`,
        bgcolor: surface,
        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} mb={2}>
          <Box display="flex" alignItems="center">
            <Typography variant="subtitle2" color="text.secondary">Asistencias por día y hora</Typography>
            <InfoTooltip title="Cuántas asistencias hubo en cada franja horaria según el día de la semana, sumando todo el período elegido. Sirve para ver los horarios pico y los más tranquilos." />
          </Box>
          <Box display="flex" gap={1}>
            <TextField
              select
              size="small"
              label="Mes"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value={0}>Todo el año</MenuItem>
              {MESES.map((m, i) => (
                <MenuItem key={m} value={i + 1}>{m}</MenuItem>
              ))}
            </TextField>
            <YearSelector value={year} onChange={setYear} />
          </Box>
        </Box>
        {renderContenido()}
      </CardContent>
    </Card>
  );
}
