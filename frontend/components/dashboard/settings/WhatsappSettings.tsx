"use client"

import { useMemo, useRef, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import Cookies from "js-cookie"
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Stack,
    Chip,
    Alert,
    CircularProgress,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
} from "@mui/material"
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import LogoutIcon from '@mui/icons-material/Logout'
import { api } from "@/lib/api"
import { WhatsappHistory } from "./WhatsappHistory"
import { useClientSnapshot } from "@/hooks/useClientSnapshot"
import { getApiErrorMessage, getErrorMessage } from "@/utils/errors/apiError"
import { FlushDialogActions } from "@/components/ui/modals/FlushDialogActions"

const leerGymIdDeCookie = () => Cookies.get("gym_id") || ""
const sinGymId = () => ""

type Status = 'disconnected' | 'connecting' | 'qr' | 'connected' | 'logged_out' | 'number_in_use' | 'replaced' | 'forbidden'

interface WhatsappConfig {
    template?: string
    admin_jid?: string | null
    reminder_days_before?: number
}

interface WAState {
    status: Status
    qr: string | null
    qrDataUrl: string | null
    lastError: string | null
    me?: { id: string; name?: string } | null
}

const DEFAULT_TEMPLATE =
    "Hola {nombre}, tu plan {plan} {estado} el {fecha}. ¡Renoválo para seguir entrenando! 💪"

const ESTADO_INICIAL: WAState = {
    status: 'disconnected', qr: null, qrDataUrl: null, lastError: null,
}

const GREEN = '#25D366'
const DARK_GREEN = '#128C7E'

const VARIABLES: { key: string; label: string; help: string }[] = [
    { key: '{nombre}', label: 'Nombre', help: 'Nombre del alumno' },
    { key: '{plan}', label: 'Plan', help: 'Plan contratado' },
    { key: '{fecha}', label: 'Fecha', help: 'Fecha vencimiento (D/M/YYYY)' },
    { key: '{estado}', label: 'Estado', help: 'vence / vence hoy / venció' },
]

function formatPhone(jid: string | null): string {
    if (!jid) return ''
    const raw = jid.split('@')[0].split(':')[0]
    if (raw.startsWith('549') && raw.length === 13) {
        return `+54 9 ${raw.slice(3, 6)} ${raw.slice(6, 9)}-${raw.slice(9)}`
    }
    return '+' + raw
}

export function WhatsappSettings() {
    // La cookie solo existe en el cliente; useClientSnapshot la lee sin el render
    // extra que provocaba el useEffect de abajo.
    const gymId = useClientSnapshot(leerGymIdDeCookie, sinGymId)
    const queryClient = useQueryClient()
    const [template, setTemplate] = useState("")
    const [reminderDays, setReminderDays] = useState<number>(4)
    const [busy, setBusy] = useState<string | null>(null)
    const [feedback, setFeedback] = useState<{ kind: 'success' | 'error' | 'info'; msg: string } | null>(null)
    const [confirmDisconnect, setConfirmDisconnect] = useState(false)
    const templateRef = useRef<HTMLTextAreaElement | null>(null)

    const configKey = ['whatsappConfig', gymId] as const
    const statusKey = ['whatsappStatus', gymId] as const

    const { data: config, isPending: loadingConfig, error: configError } = useQuery({
        queryKey: configKey,
        enabled: Boolean(gymId),
        queryFn: async () => {
            const { data } = await api.get(`/api/whatsapp/gyms/${gymId}/config`)
            return (data.config || {}) as WhatsappConfig
        },
    })

    // El polling mientras se escanea el QR lo maneja refetchInterval, en vez del
    // setInterval + ref manual que habia antes.
    const { data: state = ESTADO_INICIAL } = useQuery({
        queryKey: statusKey,
        enabled: Boolean(gymId),
        queryFn: async (): Promise<WAState> => {
            const { data } = await api.get(`/api/whatsapp/gyms/${gymId}/status`)
            return data
        },
        refetchInterval: (query) => {
            const status = query.state.data?.status
            return status === 'qr' || status === 'connecting' ? 2000 : false
        },
    })

    // El backend persiste admin_jid al conectar, asi que el numero sale del
    // estado en vivo si esta conectado y si no del config guardado.
    const adminJid =
        (state.status === 'connected' ? state.me?.id : null) ?? config?.admin_jid ?? null

    // Los inputs editables arrancan con lo que vino del server y despues los
    // maneja el usuario: se sincronizan al llegar el config, no en un efecto.
    const [configPrevio, setConfigPrevio] = useState<typeof config>(undefined)
    if (config && config !== configPrevio) {
        setConfigPrevio(config)
        setTemplate(config.template ?? DEFAULT_TEMPLATE)
        setReminderDays(config.reminder_days_before ?? 4)
    }

    if (configError && !feedback) {
        setFeedback({ kind: 'error', msg: getApiErrorMessage(configError) ?? getErrorMessage(configError) ?? '' })
    }

    const loading = Boolean(gymId) && loadingConfig
    const loadStatus = () => { queryClient.invalidateQueries({ queryKey: statusKey }) }

    async function saveTemplate() {
        setBusy('save')
        try {
            await api.patch(`/api/whatsapp/gyms/${gymId}/config`, { template })
            setFeedback({ kind: 'success', msg: 'Plantilla guardada' })
        } catch (e: unknown) {
            setFeedback({ kind: 'error', msg: getApiErrorMessage(e) ?? getErrorMessage(e) ?? '' })
        } finally { setBusy(null) }
    }

    async function connect() {
        setBusy('connect')
        try {
            await api.patch(`/api/whatsapp/gyms/${gymId}/config`, { enabled: true })
            await api.post(`/api/whatsapp/gyms/${gymId}/connect`)
            loadStatus()
        } catch (e: unknown) {
            setFeedback({ kind: 'error', msg: getApiErrorMessage(e) ?? getErrorMessage(e) ?? '' })
        } finally { setBusy(null) }
    }

    async function disconnect() {
        setConfirmDisconnect(false)
        setBusy('disconnect')
        try {
            await api.post(`/api/whatsapp/gyms/${gymId}/disconnect`)
            queryClient.setQueryData<WAState>(statusKey, ESTADO_INICIAL)
            queryClient.setQueryData<WhatsappConfig>(configKey, (prev) => ({ ...(prev ?? {}), admin_jid: null }))
        } catch (e: unknown) {
            setFeedback({ kind: 'error', msg: getApiErrorMessage(e) ?? getErrorMessage(e) ?? '' })
        } finally { setBusy(null) }
    }

    function insertVariable(v: string) {
        const ta = templateRef.current
        if (!ta) {
            setTemplate((t) => t + v)
            return
        }
        const start = ta.selectionStart ?? template.length
        const end = ta.selectionEnd ?? template.length
        const next = template.slice(0, start) + v + template.slice(end)
        setTemplate(next)
        requestAnimationFrame(() => {
            ta.focus()
            const pos = start + v.length
            ta.setSelectionRange(pos, pos)
        })
    }

    const isConnected = state.status === 'connected'
    const phoneLabel = useMemo(() => formatPhone(adminJid), [adminJid])

    if (loading) {
        return (
            <Paper sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Paper>
        )
    }

    return (
        <>
        <Paper sx={{ overflow: 'hidden', borderRadius: 2 }}>
            <Box sx={{ p: 3 }}>
                {feedback && (
                    <Alert severity={feedback.kind} onClose={() => setFeedback(null)} sx={{ mb: 2 }}>
                        {feedback.msg}
                    </Alert>
                )}

                {/* Sin conexión: solo flow conectar/QR */}
                {!isConnected && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 2 }}>
                        {(state.status === 'qr' || state.status === 'connecting') ? (
                            state.qrDataUrl ? (
                                <>
                                    <Box sx={{ p: 2, borderRadius: 2, border: `2px solid ${GREEN}`, bgcolor: 'white' }}>
                                        {/* eslint-disable-next-line @next/next/no-img-element -- next/image no aporta nada aca: next.config.mjs usa images.unoptimized; ademas es un data: URI generado en runtime. */}
                                        <img src={state.qrDataUrl} alt="QR" style={{ width: 220, height: 220, display: 'block' }} />
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" textAlign="center">
                                        Abrí WhatsApp → Dispositivos vinculados → Vincular dispositivo
                                    </Typography>
                                </>
                            ) : (
                                <>
                                    <CircularProgress sx={{ color: GREEN }} />
                                    <Typography variant="caption">Vinculando…</Typography>
                                </>
                            )
                        ) : (
                            <>
                                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ maxWidth: 360 }}>
                                    Vinculá tu WhatsApp para enviar recordatorios automáticos a tus alumnos.
                                </Typography>
                                <Button
                                    variant="contained"
                                    size="large"
                                    startIcon={<WhatsAppIcon />}
                                    onClick={connect}
                                    disabled={busy === 'connect'}
                                    sx={{ bgcolor: GREEN, '&:hover': { bgcolor: DARK_GREEN } }}
                                >
                                    {busy === 'connect' ? 'Conectando…' : 'Vincular WhatsApp'}
                                </Button>
                                {state.lastError && (
                                    (state.status === 'number_in_use' || state.status === 'forbidden') ? (
                                        <Alert severity="error" sx={{ maxWidth: 420 }}>
                                            {state.lastError}
                                        </Alert>
                                    ) : (
                                        <Typography variant="caption" color="warning.main">
                                            {state.lastError}
                                        </Typography>
                                    )
                                )}
                            </>
                        )}
                    </Box>
                )}

                {/* Conectado: dos columnas */}
                {isConnected && (
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                        {/* Columna izquierda: estado + descripción */}
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                                    Estado de la conexión
                                </Typography>
                                <Box sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    border: `2px solid ${GREEN}`,
                                    bgcolor: (theme) => theme.palette.mode === 'dark'
                                        ? 'rgba(37, 211, 102, 0.12)'
                                        : 'rgba(37, 211, 102, 0.08)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                }}>
                                    <WhatsAppIcon sx={{ color: GREEN, fontSize: 36 }} />
                                    <Box flex={1} minWidth={0}>
                                        <Typography variant="caption" color="text.secondary">
                                            Número vinculado
                                        </Typography>
                                        <Typography variant="h6" sx={{
                                            fontWeight: 600,
                                            color: (theme) => theme.palette.mode === 'dark' ? GREEN : DARK_GREEN,
                                            lineHeight: 1.2,
                                        }}>
                                            {phoneLabel || '—'}
                                        </Typography>
                                        {state.me?.name && (
                                            <Typography variant="caption" color="text.secondary" noWrap display="block">
                                                {state.me.name}
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                                <Button
                                    variant="text"
                                    size="small"
                                    color="error"
                                    startIcon={<LogoutIcon />}
                                    onClick={() => setConfirmDisconnect(true)}
                                    disabled={busy === 'disconnect'}
                                    sx={{ mt: 1 }}
                                >
                                    Desvincular
                                </Button>
                            </Box>

                            <Divider />

                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                                    Sobre los recordatorios
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Los mensajes se envían automáticamente <strong>todos los días a las 9:00 AM</strong>. Cada alumno recibe <strong>2 avisos</strong> para recordarle que debe abonar la cuota mensual: el primero <strong>{reminderDays} día{reminderDays === 1 ? '' : 's'} antes</strong> del vencimiento y el segundo <strong>el día del vencimiento</strong>. Cada aviso se envía una sola vez.
                                </Typography>
                            </Box>

                        </Box>

                        {/* Columna derecha: editor plantilla */}
                        <Box sx={{ flex: 1.3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                Editor de plantilla
                            </Typography>

                            <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                    Click para insertar:
                                </Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                    {VARIABLES.map((v) => (
                                        <Chip
                                            key={v.key}
                                            label={v.label}
                                            size="small"
                                            onClick={() => insertVariable(v.key)}
                                            title={v.help}
                                            sx={{
                                                cursor: 'pointer',
                                                fontWeight: 500,
                                                bgcolor: (theme) => theme.palette.mode === 'dark'
                                                    ? 'rgba(37, 211, 102, 0.15)'
                                                    : 'rgba(37, 211, 102, 0.12)',
                                                color: (theme) => theme.palette.mode === 'dark' ? GREEN : DARK_GREEN,
                                                border: `1px solid ${GREEN}`,
                                                '&:hover': {
                                                    bgcolor: (theme) => theme.palette.mode === 'dark'
                                                        ? 'rgba(37, 211, 102, 0.25)'
                                                        : 'rgba(37, 211, 102, 0.2)',
                                                },
                                            }}
                                        />
                                    ))}
                                </Stack>
                            </Box>

                            <TextField
                                multiline
                                minRows={7}
                                value={template}
                                onChange={(e) => setTemplate(e.target.value)}
                                size="small"
                                fullWidth
                                inputRef={templateRef}
                                helperText="Las variables se reemplazan automáticamente al enviar"
                            />

                            <Box sx={{ mt: 'auto', display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
                                <Button
                                    variant="contained"
                                    onClick={saveTemplate}
                                    disabled={busy === 'save'}
                                    sx={{
                                        bgcolor: GREEN,
                                        '&:hover': { bgcolor: DARK_GREEN },
                                        width: { xs: '100%', md: 'calc((100% - 16px) / 3)' },
                                        minHeight: { xs: 'unset', md: 56 },
                                    }}
                                >
                                    {busy === 'save' ? 'Guardando…' : 'Guardar plantilla'}
                                </Button>
                            </Box>

                        </Box>
                    </Box>
                )}
            </Box>

            <Dialog
                open={confirmDisconnect}
                onClose={() => setConfirmDisconnect(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { overflow: 'hidden' } }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningAmberIcon color="error" />
                    Desvincular WhatsApp
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Se desvinculará WhatsApp de este gimnasio y se dejarán de enviar los recordatorios automáticos.
                    </DialogContentText>
                    <DialogContentText sx={{ mt: 1.5 }}>
                        Para volver a usarlo deberás escanear el QR nuevamente. ¿Continuar?
                    </DialogContentText>
                </DialogContent>
                <FlushDialogActions
                    actions={[
                        { label: 'Cancelar', onClick: () => setConfirmDisconnect(false), tone: 'neutral' },
                        { label: 'Desvincular', onClick: disconnect, tone: 'danger' },
                    ]}
                />
            </Dialog>
        </Paper>
        {isConnected && gymId && <WhatsappHistory gymId={gymId} />}
        </>
    )
}
