"use client"

import { useEffect, useState } from "react"
import Cookies from "js-cookie"
import {
  Box,
  Paper,
  Typography,
  Stack,
  Avatar,
  Chip,
  CircularProgress,
  Divider,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material"
import EmailIcon from "@mui/icons-material/Email"
import RefreshIcon from "@mui/icons-material/Refresh"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"

interface EmailLogItem {
  id: string
  email_destino: string | null
  asunto: string | null
  tipo: string
  estado: "enviado" | "error" | "sin_email"
  error_msg: string | null
  plan_nombre: string | null
  plan_precio: number | null
  end_at: string | null
  created_at: string
}

interface GymGroup {
  gym_id: string
  gym_nombre: string
  gym_logo: string | null
  total: number
  ultimo_envio: string
  emails: EmailLogItem[]
}

const estadoColor = (estado: string) =>
  estado === "enviado" ? "success" : estado === "error" ? "error" : "warning"

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function isToday(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

export function TodayEmailsBox() {
  const [groups, setGroups] = useState<GymGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = Cookies.get("token")
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/emails/logs?sync=true`,
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Error al cargar emails")

      const filtered: GymGroup[] = []
      for (const g of (json.data || []) as GymGroup[]) {
        const todayEmails = g.emails.filter((m) => isToday(m.created_at))
        if (todayEmails.length > 0) {
          filtered.push({
            ...g,
            emails: todayEmails,
            total: todayEmails.length,
            ultimo_envio: todayEmails[0]?.created_at || g.ultimo_envio,
          })
        }
      }
      filtered.sort(
        (a, b) =>
          new Date(b.ultimo_envio).getTime() - new Date(a.ultimo_envio).getTime()
      )
      setGroups(filtered)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const totalHoy = groups.reduce((acc, g) => acc + g.total, 0)

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mt: 3 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <EmailIcon color="primary" />
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Emails enviados hoy
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {totalHoy} email{totalHoy !== 1 ? "s" : ""} en{" "}
              {groups.length} gimnasio{groups.length !== 1 ? "s" : ""}
            </Typography>
          </Box>
        </Stack>
        <Button
          size="small"
          startIcon={<RefreshIcon />}
          onClick={fetchLogs}
          disabled={loading}
        >
          Actualizar
        </Button>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      {loading ? (
        <Box display="flex" justifyContent="center" py={3}>
          <CircularProgress size={28} />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : groups.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" py={3}>
          No se enviaron emails hoy.
        </Typography>
      ) : (
        <Stack spacing={1}>
          {groups.map((g) => (
            <Accordion key={g.gym_id} disableGutters>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={2}
                  sx={{ width: "100%" }}
                >
                  <Avatar
                    src={g.gym_logo || undefined}
                    sx={{ bgcolor: "#16A34A", width: 36, height: 36 }}
                  >
                    {g.gym_nombre[0]?.toUpperCase()}
                  </Avatar>
                  <Box flex={1} minWidth={0}>
                    <Typography fontWeight={600} noWrap>
                      {g.gym_nombre}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Último: {formatTime(g.ultimo_envio)}
                    </Typography>
                  </Box>
                  <Chip
                    icon={<EmailIcon />}
                    label={g.total}
                    size="small"
                    sx={{
                      bgcolor: "#7c3aed",
                      color: "#fff",
                      "& .MuiChip-icon": { color: "#fff" },
                    }}
                  />
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Stack divider={<Divider />} spacing={1}>
                  {g.emails.map((m) => (
                    <Box key={m.id} sx={{ py: 0.5 }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        flexWrap="wrap"
                      >
                        <Chip
                          label={m.estado}
                          color={estadoColor(m.estado) as any}
                          size="small"
                        />
                        <Typography variant="body2" fontWeight={600}>
                          {m.asunto || "(sin asunto)"}
                        </Typography>
                      </Stack>
                      <Stack
                        direction="row"
                        spacing={2}
                        mt={0.5}
                        flexWrap="wrap"
                      >
                        <Typography variant="caption" color="text.secondary">
                          {m.email_destino || "—"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatTime(m.created_at)}
                        </Typography>
                        {m.plan_nombre && (
                          <Typography variant="caption" color="text.secondary">
                            Plan: {m.plan_nombre}
                          </Typography>
                        )}
                      </Stack>
                      {m.error_msg && (
                        <Typography
                          variant="caption"
                          color="error"
                          display="block"
                          mt={0.5}
                        >
                          Error: {m.error_msg}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Stack>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      )}
    </Paper>
  )
}
