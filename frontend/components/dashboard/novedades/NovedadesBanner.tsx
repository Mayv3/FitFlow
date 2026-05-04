'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Dialog,
  alpha,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import EventIcon from '@mui/icons-material/Event';
import BugReportIcon from '@mui/icons-material/BugReport';
import BuildIcon from '@mui/icons-material/Build';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import Link from 'next/link';
import Cookies from 'js-cookie';

const API_BASE = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api`;

interface Novedad {
  id: number;
  titulo: string;
  descripcion?: string;
  tipo: string;
  fecha_publicacion: string;
  imagen_url?: string;
}

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const DISMISSED_KEY = 'novedadesDismissedAt';

function isRecent(fechaPublicacion: string): boolean {
  return (Date.now() - new Date(fechaPublicacion).getTime()) <= THREE_DAYS_MS;
}

function wasDismissed(): boolean {
  if (typeof window === 'undefined') return true;
  const val = sessionStorage.getItem(DISMISSED_KEY);
  return val ? (Date.now() - Number(val)) < THREE_DAYS_MS : false;
}

function setDismissed() {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(DISMISSED_KEY, String(Date.now()));
  }
}

function markNovedadesAsRead(ids: number[]) {
  if (typeof window === 'undefined') return;
  try {
    const raw = sessionStorage.getItem('readNovedades');
    const read = new Set<number>(raw ? JSON.parse(raw) : []);
    ids.forEach(id => read.add(id));
    sessionStorage.setItem('readNovedades', JSON.stringify([...read]));
  } catch {}
}

function getNovedadesRoute(): string {
  const rol = Cookies.get('rol');
  if (rol === '1') return '/dashboard/owner/register';
  if (rol === '2') return '/dashboard/administrator/novedades';
  if (rol === '3') return '/dashboard/receptionist/novedades';
  return '/dashboard/administrator/novedades';
}

const tipoMeta: Record<string, { label: string; icon: React.ReactNode }> = {
  novedad: { label: 'Novedad', icon: <NewReleasesIcon /> },
  feature: { label: 'Funcionalidad', icon: <AutoAwesomeIcon /> },
  promocion: { label: 'Promoción', icon: <LocalOfferIcon /> },
  evento: { label: 'Evento', icon: <EventIcon /> },
  error: { label: 'Error', icon: <BugReportIcon /> },
  fix: { label: 'Corrección', icon: <BuildIcon /> },
};

export default function NovedadesModal() {
  const [open, setOpen] = useState(false);
  const [novedades, setNovedades] = useState<Novedad[]>([]);
  const [primaryColor, setPrimaryColor] = useState('#0dc985');
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('gym_settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.colors?.primary) setPrimaryColor(parsed.colors.primary);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (wasDismissed()) return;
    let cancelled = false;

    async function fetchNovedades() {
      try {
        const token = Cookies.get('token');
        if (!token) return;

        const res = await fetch(`${API_BASE}/novedades?page=1&pageSize=10`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;

        const data = await res.json();
        const items: Novedad[] = data?.items ?? [];
        if (cancelled) return;

        const recientes = items.filter((n) => isRecent(n.fecha_publicacion));
        if (recientes.length > 0) {
          setNovedades(recientes);
          setOpen(true);
        }
      } catch {}
    }

    fetchNovedades();
    return () => { cancelled = true; };
  }, []);

  const handleClose = () => {
    setDismissed();
    markNovedadesAsRead(novedades.map(n => n.id));
    setOpen(false);
  };

  const novedadesRoute = getNovedadesRoute();

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: '#000000',
          boxShadow: `0 0 0 1px ${alpha('#ffffff', 0.06)}`,
          overflow: 'hidden',
          position: 'relative',
        },
      }}
    >

      <Box sx={{ px: 2, pt: 1.5, pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        <Box>
          <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>
            Novedades
          </Typography>
          <Typography sx={{ color: alpha('#fff', 0.35), fontSize: 10, fontWeight: 500 }}>
            {novedades.length} {novedades.length === 1 ? 'actualización' : 'actualizaciones'}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} sx={{ color: alpha('#fff', 0.3), '&:hover': { color: '#fff', bgcolor: alpha('#fff', 0.06) }, p: 0.5 }}>
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      <Box sx={{
        px: 1.5,
        pb: 1,
        maxHeight: 380,
        overflow: 'auto',
        position: 'relative',
        scrollbarWidth: 'thin',
        scrollbarColor: `${alpha('#000', 0.4)} transparent`,
        '&::-webkit-scrollbar': { width: 3 },
        '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
        '&::-webkit-scrollbar-thumb': { bgcolor: alpha('#000', 0.5), borderRadius: 4 },
      }}>
        {novedades.map((n, i) => {
          const meta = tipoMeta[n.tipo] ?? tipoMeta.novedad;
          return (
            <Box
              key={n.id}
              ref={(el) => { cardRefs.current[i] = el; }}
              sx={{
                p: 1.5,
                mb: 0.8,
                borderRadius: 2,
                bgcolor: alpha('#ffffff', 0.03),
                border: `1px solid ${alpha('#ffffff', 0.06)}`,
                transition: 'all 0.25s ease',
                animation: 'cardIn 0.4s ease forwards',
                animationDelay: `${i * 0.08}s`,
                opacity: 0,
                transform: 'translateY(12px)',
                '@keyframes cardIn': {
                  to: { opacity: 1, transform: 'translateY(0)' },
                },
                '&:hover': {
                  bgcolor: alpha(primaryColor, 0.06),
                  borderColor: alpha(primaryColor, 0.2),
                },
              }}
            >
              <Box display="flex" alignItems="flex-start" gap={1}>
                <Box sx={{
                  width: 24,
                  height: 24,
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: alpha(primaryColor, 0.12),
                  color: primaryColor,
                  fontSize: 12,
                  flexShrink: 0,
                  mt: 0.2,
                }}>
                  {meta.icon}
                </Box>
                <Box flex={1} minWidth={0}>
                  <Box display="flex" alignItems="center" gap={0.8} mb={0.2}>
                    <Typography sx={{ color: primaryColor, fontSize: 11, fontWeight: 700 }}>
                      {meta.label}
                    </Typography>
                    <Typography sx={{ color: alpha('#fff', 0.25), fontSize: 10, fontWeight: 500 }}>
                      {new Date(n.fecha_publicacion).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                    </Typography>
                  </Box>
                  <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: 13, lineHeight: 1.3, mb: 0.3 }}>
                    {n.titulo}
                  </Typography>
                  {n.descripcion && (
                    <Typography sx={{
                      color: alpha('#fff', 0.45),
                      fontSize: 12,
                      lineHeight: 1.5,
                      fontStyle: 'italic',
                      borderLeft: `2px solid ${alpha(primaryColor, 0.15)}`,
                      pl: 1.5,
                    }}>
                      {n.descripcion.length > 120 ? `${n.descripcion.slice(0, 120)}…` : n.descripcion}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>

      <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'flex-end', borderTop: `1px solid ${alpha('#ffffff', 0.06)}` }}>
        <Button
          component={Link}
          href={novedadesRoute}
          variant="contained"
          onClick={handleClose}
          sx={{
            bgcolor: primaryColor,
            color: '#fff',
            fontWeight: 600,
            fontSize: 12,
            textTransform: 'none',
            px: 2.5,
            py: 0.6,
            borderRadius: 1.5,
            boxShadow: `0 4px 16px ${alpha(primaryColor, 0.3)}`,
            '&:hover': { bgcolor: primaryColor, filter: 'brightness(1.1)', boxShadow: `0 6px 24px ${alpha(primaryColor, 0.4)}` },
          }}
        >
          Ver todas
        </Button>
      </Box>
    </Dialog>
  );
}
