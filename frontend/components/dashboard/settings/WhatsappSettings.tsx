"use client"

import { useEffect, useMemo, useRef, useState } from "react"
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
    Avatar,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
} from "@mui/material"
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import SendIcon from '@mui/icons-material/Send'
import GroupsIcon from '@mui/icons-material/Groups'
import LogoutIcon from '@mui/icons-material/Logout'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import { api } from "@/lib/api"
import { WhatsappHistory } from "./WhatsappHistory"

type Status = 'disconnected' | 'connecting' | 'qr' | 'connected' | 'logged_out' | 'number_in_use' | 'replaced'

interface WAState {
    status: Status
    qr: string | null
    qrDataUrl: string | null
    lastError: string | null
    me?: { id: string; name?: string } | null
}

const DEFAULT_TEMPLATE =
    "Hola {nombre}, tu plan {plan} {estado} el {fecha}. ¡Renoválo para seguir entrenando! 💪"

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

const STATUS_MAP: Record<Status, { label: string; color: 'default' | 'success' | 'warning' | 'error' | 'info' }> = {
    disconnected: { label: 'Desconectado', color: 'default' },
    connecting: { label: 'Conectando…', color: 'info' },
    qr: { label: 'Escaneá el QR', color: 'warning' },
    connected: { label: 'Conectado', color: 'success' },
    logged_out: { label: 'Sesión cerrada', color: 'error' },
    number_in_use: { label: 'Número en uso', color: 'error' },
    replaced: { label: 'Reemplazada', color: 'warning' },
}

export function WhatsappSettings() {
    const [gymId, setGymId] = useState<string>("")
    const [adminJid, setAdminJid] = useState<string | null>(null)
    const [template, setTemplate] = useState("")
    const [reminderDays, setReminderDays] = useState<number>(4)
    const [state, setState] = useState<WAState>({
        status: 'disconnected', qr: null, qrDataUrl: null, lastError: null,
    })
    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState<string | null>(null)
    const [feedback, setFeedback] = useState<{ kind: 'success' | 'error' | 'info'; msg: string } | null>(null)
    const [simResult, setSimResult] = useState<any | null>(null)
    const [confirmTrigger, setConfirmTrigger] = useState(false)
    const [confirmDisconnect, setConfirmDisconnect] = useState(false)
    const pollRef = useRef<NodeJS.Timeout | null>(null)
    const templateRef = useRef<HTMLTextAreaElement | null>(null)

    useEffect(() => { setGymId(Cookies.get("gym_id") || "") }, [])

    useEffect(() => {
        if (!gymId) return
        loadConfig(); loadStatus()
        return () => { if (pollRef.current) clearInterval(pollRef.current) }
    }, [gymId])

    useEffect(() => {
        if (state.status === 'qr' || state.status === 'connecting') {
            if (!pollRef.current) pollRef.current = setInterval(loadStatus, 2000)
        } else if (pollRef.current) {
            clearInterval(pollRef.current); pollRef.current = null
        }
    }, [state.status])

    async function loadConfig() {
        try {
            const { data } = await api.get(`/api/whatsapp/gyms/${gymId}/config`)
            const cfg = data.config || {}
            setTemplate(cfg.template ?? DEFAULT_TEMPLATE)
            setAdminJid(cfg.admin_jid || null)
            setReminderDays(cfg.reminder_days_before ?? 4)
        } catch (e: any) {
            setFeedback({ kind: 'error', msg: e?.response?.data?.error || e.message })
        } finally { setLoading(false) }
    }

    async function loadStatus() {
        try {
            const { data } = await api.get(`/api/whatsapp/gyms/${gymId}/status`)
            setState(data)
            // El backend persiste admin_jid al conectar; acá solo refrescamos el label local.
            if (data.status === 'connected' && data?.me?.id && data.me.id !== adminJid) {
                setAdminJid(data.me.id)
            }
        } catch { /* silent */ }
    }

    async function saveTemplate() {
        setBusy('save')
        try {
            await api.patch(`/api/whatsapp/gyms/${gymId}/config`, { template })
            setFeedback({ kind: 'success', msg: 'Plantilla guardada' })
        } catch (e: any) {
            setFeedback({ kind: 'error', msg: e?.response?.data?.error || e.message })
        } finally { setBusy(null) }
    }

    async function connect() {
        setBusy('connect')
        try {
            await api.patch(`/api/whatsapp/gyms/${gymId}/config`, { enabled: true })
            await api.post(`/api/whatsapp/gyms/${gymId}/connect`)
            loadStatus()
        } catch (e: any) {
            setFeedback({ kind: 'error', msg: e?.response?.data?.error || e.message })
        } finally { setBusy(null) }
    }

    async function disconnect() {
        setConfirmDisconnect(false)
        setBusy('disconnect')
        try {
            await api.post(`/api/whatsapp/gyms/${gymId}/disconnect`)
            setAdminJid(null)
            setState({ status: 'disconnected', qr: null, qrDataUrl: null, lastError: null })
        } catch (e: any) {
            setFeedback({ kind: 'error', msg: e?.response?.data?.error || e.message })
        } finally { setBusy(null) }
    }

    async function sendTestOwner() {
        if (!adminJid) return
        setBusy('test')
        try {
            await api.post(`/api/whatsapp/gyms/${gymId}/test`, {
                jid: adminJid,
                text: '✅ Prueba desde FitFlow — WhatsApp conectado correctamente.',
            })
            setFeedback({ kind: 'success', msg: 'Mensaje de prueba enviado' })
        } catch (e: any) {
            setFeedback({ kind: 'error', msg: e?.response?.data?.error || e.message })
        } finally { setBusy(null) }
    }

    async function simulateAlumnos() {
        setBusy('simulate'); setSimResult(null)
        try {
            const { data } = await api.post(`/api/whatsapp/gyms/${gymId}/simulate`)
            setSimResult(data)
        } catch (e: any) {
            setFeedback({ kind: 'error', msg: e?.response?.data?.error || e.message })
        } finally { setBusy(null) }
    }

    async function triggerNow() {
        setConfirmTrigger(false)
        setBusy('trigger'); setSimResult(null)
        try {
            const { data } = await api.post(`/api/whatsapp/gyms/${gymId}/trigger`)
            const sent = data?.sent ?? 0, errors = data?.errors ?? 0, skipped = data?.skipped ?? 0
            setFeedback({
                kind: errors > 0 ? 'error' : (sent > 0 ? 'success' : 'info'),
                msg: `Enviados: ${sent} · Errores: ${errors} · Ya enviados antes: ${skipped}`,
            })
        } catch (e: any) {
            setFeedback({ kind: 'error', msg: e?.response?.data?.error || e.message })
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
    const statusInfo = STATUS_MAP[state.status]
    // Solo lo que se mandaría AHORA (alumnos nuevos); el backend ya excluye los ya enviados.
    const simPreview = useMemo(
        () => (simResult?.results || []).filter((r: any) => r.status === 'simulated'),
        [simResult]
    )

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
                                    state.status === 'number_in_use' ? (
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
                                    Los mensajes se envían automáticamente <strong>todos los días a las 9:00 AM</strong> a alumnos que <strong>vencen hoy</strong> o en los próximos <strong>{reminderDays} día{reminderDays === 1 ? '' : 's'}</strong>. Cada alumno recibe el mensaje una sola vez por fecha de vencimiento.
                                </Typography>
                            </Box>

                            <Divider />

                            <Box>
                                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
                                    <Button
                                        variant="outlined"
                                        color="success"
                                        startIcon={<SendIcon />}
                                        onClick={sendTestOwner}
                                        disabled={busy === 'test'}
                                        fullWidth
                                    >
                                        Probar a mi WhatsApp
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        color="success"
                                        startIcon={<GroupsIcon />}
                                        onClick={simulateAlumnos}
                                        disabled={busy === 'simulate'}
                                        fullWidth
                                    >
                                        Simular envío
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="warning"
                                        startIcon={<RocketLaunchIcon />}
                                        onClick={() => setConfirmTrigger(true)}
                                        disabled={busy === 'trigger'}
                                        fullWidth
                                    >
                                        Enviar ahora
                                    </Button>
                                </Stack>
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

                            {simResult && simPreview.length > 0 && (
                                <Box sx={{
                                    mt: 1,
                                    p: 2,
                                    borderRadius: 1,
                                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'grey.50',
                                    border: (theme) => `1px solid ${theme.palette.divider}`,
                                }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Se enviarían ahora — {simPreview.length} alumno(s){simPreview.length > 2 ? ' (mostrando 2)' : ''}:
                                    </Typography>
                                    <Stack spacing={1} sx={{ mt: 1 }}>
                                        {simPreview.slice(0, 2).map((r: any, i: number) => (
                                            <Box key={i} sx={{
                                                p: 1.2,
                                                borderRadius: 1,
                                                bgcolor: 'background.paper',
                                                border: (theme) => `1px solid ${theme.palette.divider}`,
                                            }}>
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    → {r.jid?.split('@')[0]}
                                                </Typography>
                                                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.primary' }}>
                                                    {r.text}
                                                </Typography>
                                            </Box>
                                        ))}
                                        {simPreview.length > 2 && (
                                            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', pt: 0.5, display: 'block' }}>
                                                + {simPreview.length - 2} más
                                            </Typography>
                                        )}
                                    </Stack>
                                    {simResult.skipped > 0 && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                            {simResult.skipped} ya recibieron el recordatorio (no se repiten).
                                        </Typography>
                                    )}
                                </Box>
                            )}
                            {simResult && simPreview.length === 0 && (
                                <Alert severity="info">
                                    {simResult.skipped > 0
                                        ? 'Todos los alumnos del rango ya recibieron el recordatorio. No hay nada nuevo para enviar.'
                                        : 'Ningún alumno vence en el rango configurado.'}
                                </Alert>
                            )}
                        </Box>
                    </Box>
                )}
            </Box>

            <Dialog
                open={confirmTrigger}
                onClose={() => setConfirmTrigger(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningAmberIcon color="warning" />
                    Confirmar envío
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Se enviarán mensajes <strong>reales</strong> de WhatsApp a los alumnos que cumplen los criterios (vencen hoy o en los próximos {reminderDays} día{reminderDays === 1 ? '' : 's'}).
                    </DialogContentText>
                    <DialogContentText sx={{ mt: 1.5 }}>
                        Esta acción no se puede deshacer. ¿Continuar?
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setConfirmTrigger(false)} color="inherit">
                        Cancelar
                    </Button>
                    <Button
                        onClick={triggerNow}
                        variant="contained"
                        color="warning"
                        startIcon={<RocketLaunchIcon />}
                    >
                        Enviar ahora
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={confirmDisconnect}
                onClose={() => setConfirmDisconnect(false)}
                maxWidth="xs"
                fullWidth
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
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setConfirmDisconnect(false)} color="inherit">
                        Cancelar
                    </Button>
                    <Button
                        onClick={disconnect}
                        variant="contained"
                        color="error"
                        startIcon={<LogoutIcon />}
                    >
                        Desvincular
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
        {isConnected && gymId && <WhatsappHistory gymId={gymId} />}
        </>
    )
}
