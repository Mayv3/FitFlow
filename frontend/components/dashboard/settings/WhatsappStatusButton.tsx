"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import Cookies from "js-cookie"
import Link from "next/link"
import { Badge, Box, Button, IconButton, Popover, Tooltip, Typography } from "@mui/material"
import WhatsAppIcon from "@mui/icons-material/WhatsApp"
import { api } from "@/lib/api"
import { useClientSnapshot } from "@/hooks/useClientSnapshot"
import { ADMINISTRADOR } from "@/const/roles/roles"

const leerGymIdDeCookie = () => Cookies.get("gym_id") || ""
const leerRolDeCookie = () => Cookies.get("rol") || ""
const vacio = () => ""

type Status = 'disconnected' | 'connecting' | 'qr' | 'connected' | 'logged_out' | 'number_in_use' | 'replaced' | 'forbidden'

type Estado = {
    label: string
    tono: 'success' | 'warning' | 'error'
    descripcion: string
    /** Texto del botón que lleva a Configuración; sin él no hay nada que hacer. */
    accion?: string
}

// 'disconnected' y 'logged_out' son los que no tienen credenciales (el backend
// ya intentó restaurar la sesión desde la DB en /status): hay que volver a vincular.
const DESVINCULADO: Estado = {
    label: 'WhatsApp desvinculado',
    tono: 'error',
    descripcion: 'La sesión de WhatsApp del gimnasio quedó desvinculada y los recordatorios automáticos no se están enviando. Hay que volver a escanear el QR.',
    accion: 'Reconectar',
}

// Estos conservan las credenciales y suelen resolverse solos.
const CON_PROBLEMAS: Estado = {
    label: 'WhatsApp con problemas',
    tono: 'warning',
    descripcion: 'La sesión tuvo un problema y puede que los recordatorios no estén saliendo. Suele resolverse solo; si sigue así, revisalo en Configuración.',
    accion: 'Revisar',
}

const ESTADOS: Record<Status, Estado> = {
    connected: {
        label: 'WhatsApp conectado',
        tono: 'success',
        descripcion: 'Los recordatorios automáticos se están enviando.',
    },
    connecting: {
        label: 'Conectando WhatsApp…',
        tono: 'warning',
        descripcion: 'Se está restableciendo la sesión. Suele tardar unos segundos.',
    },
    qr: {
        label: 'Falta escanear el QR',
        tono: 'warning',
        descripcion: 'Hay un código QR esperando. Escanealo desde el WhatsApp del gimnasio para terminar de vincular.',
        accion: 'Ver QR',
    },
    disconnected: DESVINCULADO,
    logged_out: DESVINCULADO,
    number_in_use: CON_PROBLEMAS,
    replaced: CON_PROBLEMAS,
    forbidden: CON_PROBLEMAS,
}

/** Botón de la barra de arriba que muestra en qué estado está la sesión de WhatsApp del gym. */
export function WhatsappStatusButton() {
    const gymId = useClientSnapshot(leerGymIdDeCookie, vacio)
    const rol = useClientSnapshot(leerRolDeCookie, vacio)
    const esAdmin = Number(rol) === ADMINISTRADOR
    const [anchor, setAnchor] = useState<HTMLElement | null>(null)

    const { data: config } = useQuery({
        queryKey: ['whatsappConfig', gymId] as const,
        enabled: Boolean(gymId) && esAdmin,
        queryFn: async () => {
            const { data } = await api.get(`/api/whatsapp/gyms/${gymId}/config`)
            return data as { whatsapp_enabled?: boolean }
        },
    })

    const { data: state } = useQuery({
        queryKey: ['whatsappStatus', gymId] as const,
        enabled: Boolean(gymId) && esAdmin && Boolean(config?.whatsapp_enabled),
        queryFn: async () => {
            const { data } = await api.get(`/api/whatsapp/gyms/${gymId}/status`)
            return data as { status: Status }
        },
        refetchInterval: (query) => {
            const status = query.state.data?.status
            return status === 'qr' || status === 'connecting' ? 2000 : false
        },
    })

    if (!esAdmin || !config?.whatsapp_enabled || !state) return null

    const estado = ESTADOS[state.status] ?? CON_PROBLEMAS

    return (
        <>
            <Tooltip title={estado.label}>
                <IconButton
                    onClick={(e) => setAnchor(e.currentTarget)}
                    size="small"
                    aria-label={estado.label}
                    sx={(theme) => ({
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        '&:hover': {
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.14)',
                        },
                    })}
                >
                    <Badge variant="dot" color={estado.tono} overlap="circular">
                        <WhatsAppIcon fontSize="small" />
                    </Badge>
                </IconButton>
            </Tooltip>

            <Popover
                open={anchor !== null}
                anchorEl={anchor}
                onClose={() => setAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{ paper: { sx: { mt: 1, p: 2, maxWidth: 300, borderRadius: 2 } } }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: `${estado.tono}.main`, flexShrink: 0 }} />
                    <Typography variant="subtitle2" fontWeight={700}>
                        {estado.label}
                    </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                    {estado.descripcion}
                </Typography>
                {estado.accion && (
                    <Button
                        component={Link}
                        href="/dashboard/administrator/settings?tab=whatsapp"
                        onClick={() => setAnchor(null)}
                        size="small"
                        variant="outlined"
                        color={estado.tono}
                        startIcon={<WhatsAppIcon />}
                        sx={{ mt: 1.5 }}
                    >
                        {estado.accion}
                    </Button>
                )}
            </Popover>
        </>
    )
}
