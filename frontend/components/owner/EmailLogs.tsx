"use client"

import { useQuery } from "@tanstack/react-query"
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Avatar,
  Divider,
  Button,
} from "@mui/material"
import type { ChipProps } from "@mui/material"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import EmailIcon from "@mui/icons-material/Email"
import RefreshIcon from "@mui/icons-material/Refresh"
import Cookies from "js-cookie"

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

const estadoColor = (estado: string): ChipProps["color"] =>
  estado === "enviado" ? "success" : estado === "error" ? "error" : "warning"

function formatDate(iso: string | null) {
  if (!iso) return "-"
  const d = new Date(iso)
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

interface EmailLogsProps {
  gymId?: string
  hideHeader?: boolean
}

async function fetchEmailLogs(): Promise<GymGroup[]> {
  const token = Cookies.get("token")
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/emails/logs`,
    { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
  )
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || "Error al cargar logs")
  return json.data || []
}

export function EmailLogs({ gymId, hideHeader = false }: EmailLogsProps = {}) {
  // El endpoint devuelve todos los gimnasios; el filtro por gymId se aplica en
  // `select` para no refetchear cuando solo cambia el gimnasio mirado.
  const {
    data = [],
    isPending: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["owner", "emails", "logs"],
    queryFn: fetchEmailLogs,
    select: (all) => (gymId ? all.filter((g) => g.gym_id === gymId) : all),
  })

  const fetchLogs = () => { refetch() }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box py={3}>
        <Typography color="error">{error.message}</Typography>
        <Button onClick={fetchLogs} sx={{ mt: 2 }} startIcon={<RefreshIcon />}>
          Reintentar
        </Button>
      </Box>
    )
  }

  return (
    <Box>
      {!hideHeader && (
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" fontWeight={700}>
            Emails enviados a gimnasios
          </Typography>
          <Button onClick={fetchLogs} startIcon={<RefreshIcon />} size="small">
            Actualizar
          </Button>
        </Stack>
      )}

      {data.length === 0 ? (
        <Card variant="outlined">
          <CardContent>
            <Typography color="text.secondary" textAlign="center">
              Aún no se enviaron emails a gimnasios.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        data.map((g) => (
          <Accordion key={g.gym_id} disableGutters sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ width: "100%" }}>
                <Avatar src={g.gym_logo || undefined} sx={{ bgcolor: "#16A34A" }}>
                  {g.gym_nombre[0]?.toUpperCase()}
                </Avatar>
                <Box flex={1}>
                  <Typography fontWeight={600}>{g.gym_nombre}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Último envío: {formatDate(g.ultimo_envio)}
                  </Typography>
                </Box>
                <Chip
                  icon={<EmailIcon />}
                  label={`${g.total} email${g.total !== 1 ? "s" : ""}`}
                  size="small"
                  color="primary"
                />
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Stack divider={<Divider />} spacing={1}>
                {g.emails.map((m) => (
                  <Box key={m.id} sx={{ py: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                      <Chip
                        label={m.estado}
                        color={estadoColor(m.estado)}
                        size="small"
                      />
                      <Typography variant="body2" fontWeight={600}>
                        {m.asunto || "(sin asunto)"}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={2} mt={0.5} flexWrap="wrap">
                      <Typography variant="caption" color="text.secondary">
                        Para: {m.email_destino || "—"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(m.created_at)}
                      </Typography>
                      {m.plan_nombre && (
                        <Typography variant="caption" color="text.secondary">
                          Plan: {m.plan_nombre}
                          {m.plan_precio != null ? ` ($${m.plan_precio})` : ""}
                        </Typography>
                      )}
                      {m.end_at && (
                        <Typography variant="caption" color="text.secondary">
                          Vence: {formatDate(m.end_at)}
                        </Typography>
                      )}
                    </Stack>
                    {m.error_msg && (
                      <Typography variant="caption" color="error" display="block" mt={0.5}>
                        Error: {m.error_msg}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Stack>
            </AccordionDetails>
          </Accordion>
        ))
      )}
    </Box>
  )
}
