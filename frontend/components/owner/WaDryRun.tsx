"use client"

import { useEffect, useRef, useState } from "react"
import { api } from "@/lib/api"
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
  AlertTitle,
  Chip,
  Divider,
  Paper,
  Stack,
  Collapse,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  LinearProgress,
} from "@mui/material"
import type { ChipProps } from "@mui/material"
import { FlushDialogActions } from "@/components/ui/modals/FlushDialogActions"
import WhatsAppIcon from "@mui/icons-material/WhatsApp"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import ExpandLessIcon from "@mui/icons-material/ExpandLess"
import PlayArrowIcon from "@mui/icons-material/PlayArrow"
import DataObjectIcon from "@mui/icons-material/DataObject"
import SendIcon from "@mui/icons-material/Send"
import WarningAmberIcon from "@mui/icons-material/WarningAmber"
import StopCircleIcon from "@mui/icons-material/StopCircle"
import { getApiErrorMessage, getErrorMessage } from "@/utils/errors/apiError"

const GREEN = "#25D366"

interface DryRunAlumno {
  alumno_id: string
  jid: string
  text: string
}

interface DryRunGym {
  gym_id: string
  gym_name: string | null
  session: string | null
  status: string
  count: number
  would_send: DryRunAlumno[]
  skipped: number
}

interface DryRunResult {
  ok: boolean
  total_would_send: number
  gyms: DryRunGym[]
}

interface SendGym {
  gym_id: string
  gym_name: string | null
  status: string
  sent: number
  errors: number
  skipped: number
  cancelled: boolean
  remaining: number
  failures: { alumno_id: string; error: string }[]
}

interface SendResult {
  ok: boolean
  total_sent: number
  total_errors: number
  cancelled: boolean
  total_remaining: number
  gyms: SendGym[]
}

// Progreso de un envío en curso, que el backend expone en /owner/runs.
interface RunProgress {
  gym_id: string
  gym_name: string | null
  simulate: boolean
  total: number
  sent: number
  errors: number
  skipped: number
  restantes: number
  cancelada: boolean
  segundos: number
}

function formatJid(jid: string | null) {
  if (!jid) return "—"
  const raw = jid.split("@")[0].split(":")[0]
  if (raw.startsWith("549") && raw.length === 13)
    return `+54 9 ${raw.slice(3, 6)} ${raw.slice(6, 9)}-${raw.slice(9)}`
  return "+" + raw
}

function GymRow({ gym }: { gym: DryRunGym }) {
  const [open, setOpen] = useState(false)

  const statusColor: ChipProps["color"] =
    gym.status === "ok"
      ? "success"
      : gym.status === "not_connected" || gym.status === "disabled" || gym.status === "module_disabled"
      ? "default"
      : "error"

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
        <WhatsAppIcon sx={{ color: gym.count > 0 ? GREEN : "text.disabled", fontSize: 22 }} />
        <Typography variant="subtitle2" fontWeight={600} sx={{ flex: 1 }}>
          {gym.gym_name ?? gym.gym_id}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
          {formatJid(gym.session)}
        </Typography>
        <Chip label={gym.status} color={statusColor} size="small" />
        <Chip
          label={`${gym.count} a enviar`}
          size="small"
          sx={{
            bgcolor: gym.count > 0 ? "rgba(37,211,102,0.12)" : undefined,
            color: gym.count > 0 ? GREEN : undefined,
            fontWeight: 600,
          }}
        />
        {gym.skipped > 0 && (
          <Chip label={`${gym.skipped} ya enviados`} size="small" color="default" />
        )}
        {gym.count > 0 && (
          <IconButton size="small" onClick={() => setOpen((v) => !v)}>
            {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        )}
      </Box>

      <Collapse in={open}>
        <Stack spacing={1} sx={{ mt: 1.5 }}>
          {gym.would_send.map((m, i) => (
            <Box
              key={i}
              sx={{
                p: 1.5,
                borderRadius: 1,
                bgcolor: (t) =>
                  t.palette.mode === "dark" ? "rgba(255,255,255,0.04)" : "grey.50",
                border: (t) => `1px solid ${t.palette.divider}`,
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                → {formatJid(m.jid)}
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mt: 0.5 }}>
                {m.text}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Collapse>
    </Paper>
  )
}

export function WaDryRun() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DryRunResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showJson, setShowJson] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<SendResult | null>(null)
  const [runs, setRuns] = useState<RunProgress[]>([])
  const [cancelling, setCancelling] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Mientras el envío está en curso, el request de /owner/trigger-all queda
  // abierto (una corrida de 150 alumnos tarda ~20 min). El progreso se consulta
  // aparte, así se ve avanzar y se puede frenar sin esperar a que termine.
  useEffect(() => {
    if (!sending) {
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = null
      return
    }
    let vivo = true
    const tick = async () => {
      try {
        const { data } = await api.get("/api/whatsapp/owner/runs")
        if (vivo) setRuns(data.runs ?? [])
      } catch {
        // El progreso es informativo: si falla una consulta no se corta el envío.
      }
    }
    tick()
    pollRef.current = setInterval(tick, 3000)
    return () => {
      vivo = false
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [sending])

  // Frena lo que falta. Los mensajes ya enviados no se pueden deshacer.
  async function cancelar() {
    setCancelling(true)
    try {
      await api.post("/api/whatsapp/owner/cancel-all")
    } catch (e: unknown) {
      setError(getApiErrorMessage(e) ?? getErrorMessage(e) ?? null)
    } finally {
      setCancelling(false)
    }
  }

  async function run() {
    setLoading(true)
    setError(null)
    setResult(null)
    setSendResult(null)
    try {
      const { data } = await api.get("/api/whatsapp/dry-run-all")
      setResult(data)
    } catch (e: unknown) {
      setError(getApiErrorMessage(e) ?? getErrorMessage(e) ?? null)
    } finally {
      setLoading(false)
    }
  }

  // Envío REAL. Solo se llega acá desde el diálogo de confirmación.
  // El modal cierra apenas se confirma: el envío tarda ~20min (jitter entre
  // mensajes) y el progreso/cancelación se ven en el panel de abajo, no tiene
  // sentido dejar al usuario mirando el modal todo ese rato.
  async function send() {
    setConfirmOpen(false)
    setSending(true)
    setError(null)
    setSendResult(null)
    setRuns([])
    try {
      const { data } = await api.post("/api/whatsapp/owner/trigger-all")
      setSendResult(data)
      // La simulación ya no refleja la realidad: lo enviado pasa a estar deduplicado.
      setResult(null)
    } catch (e: unknown) {
      setError(getApiErrorMessage(e) ?? getErrorMessage(e) ?? null)
    } finally {
      setSending(false)
    }
  }

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Simulación de envíos WhatsApp
          </Typography>
          <Typography variant="body2" color="text.secondary">
            La simulación muestra a quién se le enviaría el recordatorio hoy, sin enviar nada.
            &quot;Enviar reales&quot; dispara el envío de verdad.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
            onClick={run}
            disabled={loading || sending}
            sx={{ bgcolor: GREEN, "&:hover": { bgcolor: "#128C7E" }, whiteSpace: "nowrap" }}
          >
            {loading ? "Consultando…" : "Ejecutar simulación"}
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
            onClick={() => setConfirmOpen(true)}
            disabled={loading || sending}
            sx={{ whiteSpace: "nowrap" }}
          >
            {sending ? "Enviando…" : "Enviar reales"}
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {sending && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5, flexWrap: "wrap" }}>
            <CircularProgress size={18} sx={{ color: GREEN }} />
            <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1 }}>
              Enviando WhatsApps…
            </Typography>
            <Button
              variant="contained"
              color="error"
              size="small"
              startIcon={
                cancelling ? <CircularProgress size={16} color="inherit" /> : <StopCircleIcon />
              }
              onClick={cancelar}
              disabled={cancelling || (runs.length > 0 && runs.every((r) => r.cancelada))}
              sx={{ whiteSpace: "nowrap" }}
            >
              {cancelling
                ? "Cancelando…"
                : runs.length > 0 && runs.every((r) => r.cancelada)
                ? "Cancelado"
                : "Cancelar envío"}
            </Button>
          </Box>

          <Typography variant="caption" color="text.secondary">
            Hay entre 5 y 13 segundos entre mensaje y mensaje. Cancelar frena los que faltan; los
            que ya salieron no se pueden deshacer.
          </Typography>

          <Stack spacing={1.5} sx={{ mt: 2 }}>
            {runs.length === 0 && <LinearProgress sx={{ borderRadius: 1 }} />}
            {runs.map((r) => {
              const hechos = r.sent + r.errors + r.skipped
              const pct = r.total > 0 ? Math.round((hechos / r.total) * 100) : 0
              return (
                <Box key={r.gym_id}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>
                      {r.gym_name ?? r.gym_id}
                    </Typography>
                    {r.cancelada && <Chip label="cancelando…" size="small" color="warning" />}
                    <Typography variant="caption" color="text.secondary">
                      {r.sent} enviados · {r.restantes} restantes
                      {r.errors > 0 && ` · ${r.errors} errores`}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={pct}
                    sx={{
                      borderRadius: 1,
                      height: 6,
                      "& .MuiLinearProgress-bar": { bgcolor: r.cancelada ? "warning.main" : GREEN },
                    }}
                  />
                </Box>
              )
            })}
          </Stack>
        </Paper>
      )}

      {sendResult && (
        <Alert
          severity={sendResult.cancelled || sendResult.total_errors > 0 ? "warning" : "success"}
          onClose={() => setSendResult(null)}
          sx={{ mb: 2 }}
        >
          <AlertTitle>
            {sendResult.cancelled && "Envío cancelado — "}
            {sendResult.total_sent} mensaje{sendResult.total_sent !== 1 ? "s" : ""} enviado
            {sendResult.total_sent !== 1 ? "s" : ""}
            {sendResult.total_errors > 0 && ` · ${sendResult.total_errors} con error`}
            {sendResult.cancelled && ` · ${sendResult.total_remaining} sin enviar`}
          </AlertTitle>
          <Stack spacing={0.5} sx={{ mt: 1 }}>
            {sendResult.gyms.map((g) => (
              <Typography key={g.gym_id} variant="body2">
                <strong>{g.gym_name ?? g.gym_id}</strong> — {g.status} · {g.sent} enviados
                {g.errors > 0 && ` · ${g.errors} errores`}
                {g.skipped > 0 && ` · ${g.skipped} ya enviados antes`}
                {g.cancelled && ` · ${g.remaining} quedaron sin enviar`}
                {g.failures.length > 0 && (
                  <Typography component="span" variant="caption" color="error" sx={{ display: "block", pl: 2 }}>
                    {g.failures.map((f) => f.error).join(" · ")}
                  </Typography>
                )}
              </Typography>
            ))}
          </Stack>
        </Alert>
      )}

      {result && (
        <>
          <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
            <Chip
              icon={<WhatsAppIcon />}
              label={`${result.total_would_send} mensajes totales`}
              color={result.total_would_send > 0 ? "success" : "default"}
              sx={{ fontWeight: 600 }}
            />
            <Chip
              label={`${result.gyms.length} gimnasio${result.gyms.length !== 1 ? "s" : ""} evaluados`}
              variant="outlined"
            />
            <Button
              size="small"
              variant="outlined"
              startIcon={<DataObjectIcon />}
              onClick={() => setShowJson((v) => !v)}
              sx={{ ml: "auto" }}
            >
              {showJson ? "Ocultar JSON" : "Ver JSON"}
            </Button>
          </Box>

          <Collapse in={showJson}>
            <Box
              component="pre"
              sx={{
                p: 1.5,
                mb: 2,
                borderRadius: 1,
                fontSize: 12,
                lineHeight: 1.5,
                overflow: "auto",
                maxHeight: 400,
                bgcolor: (t) => (t.palette.mode === "dark" ? "rgba(255,255,255,0.04)" : "grey.900"),
                color: (t) => (t.palette.mode === "dark" ? "grey.300" : "grey.100"),
                border: (t) => `1px solid ${t.palette.divider}`,
                fontFamily: "monospace",
              }}
            >
              {JSON.stringify(result, null, 2)}
            </Box>
          </Collapse>

          <Divider sx={{ mb: 2 }} />

          <Stack spacing={1.5}>
            {result.gyms.map((g) => (
              <GymRow key={g.gym_id} gym={g} />
            ))}
          </Stack>
        </>
      )}

      <Dialog
        open={confirmOpen}
        onClose={() => !sending && setConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { overflow: "hidden" } }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <WarningAmberIcon color="error" />
          Enviar WhatsApps reales
        </DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            Se envían los recordatorios de vencimiento a los alumnos de{" "}
            <strong>todos los gimnasios</strong> con WhatsApp conectado. Los mensajes llegan a los
            teléfonos de verdad y no se pueden deshacer.
            {result && (
              <Box sx={{ mt: 2 }}>
                <Chip
                  icon={<WhatsAppIcon />}
                  label={`${result.total_would_send} mensajes según la última simulación`}
                  color={result.total_would_send > 0 ? "warning" : "default"}
                  sx={{ fontWeight: 600 }}
                />
              </Box>
            )}
            {!result && (
              <Typography variant="body2" sx={{ mt: 2 }} color="text.secondary">
                No corriste la simulación todavía, así que no se sabe cuántos mensajes son. Conviene
                simular primero.
              </Typography>
            )}
          </DialogContentText>
        </DialogContent>
        <FlushDialogActions
          actions={[
            { label: "Cancelar", onClick: () => setConfirmOpen(false), disabled: sending, tone: "neutral" },
            { label: "Sí, enviar", onClick: send, tone: "danger", disabled: sending, loading: sending },
          ]}
        />
      </Dialog>
    </Box>
  )
}
