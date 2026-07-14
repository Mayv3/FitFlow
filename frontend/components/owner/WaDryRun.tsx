"use client"

import { useState } from "react"
import { api } from "@/lib/api"
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Paper,
  Stack,
  Collapse,
  IconButton,
} from "@mui/material"
import WhatsAppIcon from "@mui/icons-material/WhatsApp"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import ExpandLessIcon from "@mui/icons-material/ExpandLess"
import PlayArrowIcon from "@mui/icons-material/PlayArrow"
import DataObjectIcon from "@mui/icons-material/DataObject"

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

function formatJid(jid: string | null) {
  if (!jid) return "—"
  const raw = jid.split("@")[0].split(":")[0]
  if (raw.startsWith("549") && raw.length === 13)
    return `+54 9 ${raw.slice(3, 6)} ${raw.slice(6, 9)}-${raw.slice(9)}`
  return "+" + raw
}

function GymRow({ gym }: { gym: DryRunGym }) {
  const [open, setOpen] = useState(false)

  const statusColor =
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
        <Chip label={gym.status} color={statusColor as any} size="small" />
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

  async function run() {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const { data } = await api.get("/api/whatsapp/dry-run-all")
      setResult(data)
    } catch (e: any) {
      setError(e?.response?.data?.error || e.message)
    } finally {
      setLoading(false)
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
            Muestra a quién se le enviaría el recordatorio hoy. No envía nada.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
          onClick={run}
          disabled={loading}
          sx={{ bgcolor: GREEN, "&:hover": { bgcolor: "#128C7E" }, whiteSpace: "nowrap" }}
        >
          {loading ? "Consultando…" : "Ejecutar simulación"}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
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
    </Box>
  )
}
