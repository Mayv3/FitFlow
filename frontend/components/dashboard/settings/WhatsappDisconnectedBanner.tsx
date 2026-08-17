"use client"

import { useQuery } from "@tanstack/react-query"
import Cookies from "js-cookie"
import Link from "next/link"
import { Box, Button, Typography } from "@mui/material"
import WarningAmberIcon from "@mui/icons-material/WarningAmber"
import WhatsAppIcon from "@mui/icons-material/WhatsApp"
import { api } from "@/lib/api"
import { useClientSnapshot } from "@/hooks/useClientSnapshot"

const leerGymIdDeCookie = () => Cookies.get("gym_id") || ""
const sinGymId = () => ""

type Status = 'disconnected' | 'connecting' | 'qr' | 'connected' | 'logged_out' | 'number_in_use' | 'replaced' | 'forbidden'

// Solo avisa cuando faltan credenciales: 'logged_out' (401, se borraron) o
// 'disconnected' (el backend ya intentó auto-restaurar desde la DB en /status
// y no encontró nada — si hubiera creds, la respuesta vendría en 'connecting').
// Los demás estados (number_in_use, replaced, forbidden) conservan las
// credenciales y suelen resolverse solos: no son "hay que volver a vincular".
const SIN_CREDENCIALES: Status[] = ['disconnected', 'logged_out']

export function WhatsappDisconnectedBanner() {
    const gymId = useClientSnapshot(leerGymIdDeCookie, sinGymId)

    const { data: config } = useQuery({
        queryKey: ['whatsappConfig', gymId] as const,
        enabled: Boolean(gymId),
        queryFn: async () => {
            const { data } = await api.get(`/api/whatsapp/gyms/${gymId}/config`)
            return data as { whatsapp_enabled?: boolean }
        },
    })

    const { data: state } = useQuery({
        queryKey: ['whatsappStatus', gymId] as const,
        enabled: Boolean(gymId) && Boolean(config?.whatsapp_enabled),
        queryFn: async () => {
            const { data } = await api.get(`/api/whatsapp/gyms/${gymId}/status`)
            return data as { status: Status }
        },
        refetchInterval: (query) => {
            const status = query.state.data?.status
            return status === 'qr' || status === 'connecting' ? 2000 : false
        },
    })

    if (!config?.whatsapp_enabled) return null
    if (!state || !SIN_CREDENCIALES.includes(state.status)) return null

    return (
        <Box sx={{
            mb: 2,
            py: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 1,
        }}>
            <WarningAmberIcon color="warning" />
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 480 }}>
                Ocurrió un imprevisto con la sesión de WhatsApp del gimnasio y quedó desvinculada. Los recordatorios automáticos no se están enviando — hay que volver a escanear el QR.
            </Typography>
            <Button
                component={Link}
                href="/dashboard/administrator/settings?tab=whatsapp"
                size="small"
                variant="outlined"
                color="warning"
                startIcon={<WhatsAppIcon />}
            >
                Reconectar
            </Button>
        </Box>
    )
}
