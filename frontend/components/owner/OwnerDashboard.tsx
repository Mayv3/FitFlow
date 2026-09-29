"use client"

import { useEffect, useMemo, useState } from "react"
import { api } from "@/lib/api"
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  TextField,
  InputAdornment,
  Avatar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Tooltip,
} from "@mui/material"
import { alpha, useTheme, type Theme } from "@mui/material/styles"
import AddIcon from "@mui/icons-material/Add"
import SearchIcon from "@mui/icons-material/Search"
import BusinessIcon from "@mui/icons-material/Business"
import GroupIcon from "@mui/icons-material/Group"
import WarningAmberIcon from "@mui/icons-material/WarningAmber"
import EmailIcon from "@mui/icons-material/Email"
import WhatsAppIcon from "@mui/icons-material/WhatsApp"
import InsightsIcon from "@mui/icons-material/Insights"
import CardMembershipIcon from "@mui/icons-material/CardMembership"
import AnnouncementIcon from "@mui/icons-material/Announcement"
import RestoreIcon from "@mui/icons-material/Restore"
import CloseIcon from "@mui/icons-material/Close"
import AutorenewIcon from "@mui/icons-material/Autorenew"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline"

import { Gym, useGyms, useDeletedGyms, useRestoreGym } from "@/hooks/gyms/useGyms"
import {
  useSuscriptions,
  Suscription,
  useUpdateSuscription,
} from "@/hooks/gymSubscriptions/useSuscriptions"
import { notify } from "@/lib/toast"
import { GymDetailDrawer } from "@/components/owner/GymDetailDrawer"
import { CreateGymModal } from "@/components/owner/CreateGymModal"
import { ManageGymPlans } from "@/components/owner/ManageGymPlans"
import { ManageNovedades } from "@/components/owner/ManageNovedades"
import { CommsHistory } from "@/components/owner/CommsHistory"
import { GymStatsSection } from "@/components/owner/GymStatsSection"
import { WaDryRun } from "@/components/owner/WaDryRun"
import { useNow } from "@/hooks/useNow"
import { getErrorMessage } from "@/utils/errors/apiError"

/* Colores de la marca Fitness Flow (los mismos de la landing y el login). */
const BRAND = "#063A2B"
const MINT = "#10C987"
const RADIUS = "16px"

type Tone = "ok" | "warn" | "late" | "neutral"

/** Fondo y texto de cada tono de estado, en claro y en oscuro. */
function toneColors(t: Theme, tone: Tone) {
  const dark = t.palette.mode === "dark"
  switch (tone) {
    case "ok":
      return { bg: alpha(MINT, dark ? 0.16 : 0.14), fg: dark ? "#5FE0AE" : "#0B6E4F" }
    case "warn":
      return { bg: alpha("#F59E0B", dark ? 0.18 : 0.16), fg: dark ? "#F2C94C" : "#8A5A00" }
    case "late":
      return { bg: alpha("#EF4444", dark ? 0.18 : 0.12), fg: dark ? "#FF8A7A" : "#A1281B" }
    default:
      return { bg: t.palette.action.hover, fg: t.palette.text.secondary }
  }
}

/** Acento de marca legible sobre el fondo actual. */
const accent = (t: Theme) => (t.palette.mode === "dark" ? MINT : BRAND)

function Pill({ tone, icon, children }: { tone: Tone; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Box
      component="span"
      sx={(t) => {
        const c = toneColors(t, tone)
        return {
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          px: 1.1,
          py: 0.35,
          borderRadius: 999,
          bgcolor: c.bg,
          color: c.fg,
          fontSize: "0.75rem",
          fontWeight: 700,
          lineHeight: 1.4,
          whiteSpace: "nowrap",
          "& svg": { fontSize: "0.95rem" },
        }
      }}
    >
      {icon}
      {children}
    </Box>
  )
}

/* Estado WhatsApp de un gym:
   - "activado": módulo on + número cargado (admin_jid)
   - "habilitado": módulo on pero sin número
   - "off": módulo deshabilitado */
type WaState = "activado" | "habilitado" | "off"
function waStatus(gym: Gym): WaState {
  const s = gym.settings || {}
  if (!s.whatsapp_module_enabled) return "off"
  return s.whatsapp?.admin_jid ? "activado" : "habilitado"
}

const WA_META: Record<WaState, { label: string; full: string; tone: Tone }> = {
  activado: { label: "Conectado", full: "WhatsApp habilitado y con número conectado", tone: "ok" },
  habilitado: { label: "Sin número", full: "WhatsApp habilitado, sin número conectado", tone: "warn" },
  off: { label: "Apagado", full: "WhatsApp no habilitado", tone: "neutral" },
}

function WaChip({ gym }: { gym: Gym }) {
  const meta = WA_META[waStatus(gym)]
  return (
    <Tooltip title={meta.full}>
      <span>
        <Pill tone={meta.tone} icon={<WhatsAppIcon />}>{meta.label}</Pill>
      </span>
    </Tooltip>
  )
}

type GymCardData = {
  gym: Gym
  subscription: Suscription | null
  alumnosCount: number
}

/* ---------- Métricas del encabezado ---------- */
function KpiCards({
  items,
}: {
  items: { label: string; value: number | string; tone: Tone; icon: React.ReactNode }[]
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
        gap: { xs: 1.25, md: 2 },
      }}
    >
      {items.map((it) => (
        <Paper
          key={it.label}
          variant="outlined"
          sx={{ borderRadius: RADIUS, p: { xs: 1.75, md: 2.25 }, display: "flex", flexDirection: "column", gap: 1.5, minWidth: 0 }}
        >
          <Box
            sx={(t) => {
              const c = it.tone === "neutral" ? { bg: alpha(MINT, 0.14), fg: accent(t) } : toneColors(t, it.tone)
              return {
                width: 36,
                height: 36,
                borderRadius: "10px",
                display: "grid",
                placeItems: "center",
                bgcolor: c.bg,
                color: c.fg,
                "& svg": { fontSize: "1.2rem" },
              }
            }}
          >
            {it.icon}
          </Box>
          <Box minWidth={0}>
            <Typography sx={{ fontSize: { xs: "1.6rem", md: "1.9rem" }, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
              {it.value}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.3 }}>
              {it.label}
            </Typography>
          </Box>
        </Paper>
      ))}
    </Box>
  )
}

/**
 * Proxima fecha de corte: +1 mes desde el vencimiento vigente (o desde hoy si ya
 * vencio), fijada al dia 1 al mediodia. Vive fuera del componente para que el
 * `Date.now()` no quede en scope de render (debe ser el tiempo real, no un
 * snapshot: se usa para escribir en la DB).
 */
function proximaFechaDeRenovacion(endAt?: string | null): Date {
  const base =
    endAt && new Date(endAt).getTime() > Date.now() ? new Date(endAt) : new Date()
  const next = new Date(base)
  next.setMonth(next.getMonth() + 1, 1)
  next.setHours(12, 0, 0, 0)
  return next
}

const pillButton = { textTransform: "none", borderRadius: 999, fontWeight: 700, px: 2, whiteSpace: "nowrap" } as const

/* Columnas de la lista de gimnasios (desktop). */
const COLS = { wa: 132, estado: 112, alumnos: 80, vence: 110, accion: 40 }

export function OwnerDashboard() {
  const { data: gyms = [], isLoading: loadingGyms } = useGyms()
  const { data: subs = [], isLoading: loadingSubs } = useSuscriptions()
  const { data: deletedGyms = [] } = useDeletedGyms()
  const restoreGym = useRestoreGym()
  const updateSub = useUpdateSuscription()
  const [renewingId, setRenewingId] = useState<number | null>(null)
  const now = useNow()

  const handleRenewSub = async (sub: Suscription) => {
    const next = proximaFechaDeRenovacion(sub.end_at)
    setRenewingId(sub.id)
    try {
      await updateSub.mutateAsync({ id: sub.id, end_at: next.toISOString() })
      notify.success(`Renovado hasta ${next.toLocaleDateString("es-AR")}`)
    } catch (e: unknown) {
      notify.error(getErrorMessage(e) || "Error renovando")
    } finally {
      setRenewingId(null)
    }
  }

  const [alumnosCounts, setAlumnosCounts] = useState<Record<string, number>>({})
  const [query, setQuery] = useState("")
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [plansOpen, setPlansOpen] = useState(false)
  const [novedadesOpen, setNovedadesOpen] = useState(false)
  const [deletedOpen, setDeletedOpen] = useState(false)
  const [dryRunOpen, setDryRunOpen] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await api.get(`/api/alumnos/active-count`)
        setAlumnosCounts(res.data ?? {})
      } catch {
        /* opcional */
      }
    })()
  }, [])

  const subByGym = useMemo(() => {
    const map: Record<string, Suscription> = {}
    for (const s of subs) {
      if (s.is_active) map[s.gym_id] = s
    }
    return map
  }, [subs])

  const cards: GymCardData[] = useMemo(
    () =>
      gyms
        .filter((g) => g.name.toLowerCase().includes(query.trim().toLowerCase()))
        .map((g) => ({
          gym: g,
          subscription: subByGym[g.id] || null,
          alumnosCount: alumnosCounts[g.id] ?? 0,
        })),
    [gyms, query, subByGym, alumnosCounts]
  )

  const stats = useMemo(() => {
    const sevenDays = now + 7 * 24 * 60 * 60 * 1000
    const activeGymIds = new Set(gyms.map((g) => g.id))
    let activas = 0
    let porVencer = 0
    let vencidas = 0
    for (const s of subs) {
      if (!s.is_active) continue
      if (!activeGymIds.has(s.gym_id)) continue
      activas++
      if (s.end_at) {
        const t = new Date(s.end_at).getTime()
        if (t < now) vencidas++
        else if (t <= sevenDays) porVencer++
      }
    }
    return { totalGyms: gyms.length, activas, porVencer, vencidas }
  }, [subs, gyms, now])

  const loading = loadingGyms || loadingSubs

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
      {/* ENCABEZADO */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ sm: "flex-end" }}
        justifyContent="space-between"
        spacing={2}
        mb={3}
      >
        <Box>
          <Typography component="h1" sx={{ fontSize: { xs: "1.75rem", md: "2.1rem" }, fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.1 }}>
            Panel general
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {stats.totalGyms} gimnasios · {stats.activas} con suscripción activa
          </Typography>
        </Box>

        <Stack direction="row" flexWrap="wrap" useFlexGap gap={1} sx={{ width: { xs: "100%", sm: "auto" } }}>
          <Button
            variant="contained"
            disableElevation
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
            sx={(t) => ({
              ...pillButton,
              flex: { xs: "1 1 100%", sm: "none" },
              bgcolor: accent(t),
              color: t.palette.mode === "dark" ? "#04130D" : "#FFFFFF",
              "&:hover": { bgcolor: t.palette.mode === "dark" ? "#2AD89A" : "#0B5540" },
            })}
          >
            Nuevo gimnasio
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<CardMembershipIcon />}
            onClick={() => setPlansOpen(true)}
            sx={{ ...pillButton, flex: { xs: 1, sm: "none" }, borderColor: "divider" }}
          >
            Planes
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<AnnouncementIcon />}
            onClick={() => setNovedadesOpen(true)}
            sx={{ ...pillButton, flex: { xs: 1, sm: "none" }, borderColor: "divider" }}
          >
            Novedades
          </Button>
        </Stack>
      </Stack>

      {/* MÉTRICAS */}
      <Box mb={3}>
        <KpiCards
          items={[
            { label: "Gimnasios", value: stats.totalGyms, tone: "neutral", icon: <BusinessIcon /> },
            { label: "Suscripciones activas", value: stats.activas, tone: "neutral", icon: <CheckCircleIcon /> },
            { label: "Por vencer (7 días)", value: stats.porVencer, tone: stats.porVencer > 0 ? "warn" : "neutral", icon: <WarningAmberIcon /> },
            { label: "Vencidas", value: stats.vencidas, tone: stats.vencidas > 0 ? "late" : "neutral", icon: <ErrorOutlineIcon /> },
          ]}
        />
      </Box>

      {/* GIMNASIOS */}
      <Paper variant="outlined" sx={{ borderRadius: RADIUS, overflow: "hidden" }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems={{ sm: "center" }}
          sx={{ px: { xs: 1.75, sm: 2.5 }, py: 2 }}
        >
          <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>
            Gimnasios
          </Typography>
          <TextField
            size="small"
            placeholder="Buscar gimnasio"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            inputProps={{ "aria-label": "Buscar gimnasio" }}
            sx={{
              minWidth: { sm: 280 },
              "& .MuiOutlinedInput-root": { borderRadius: 999, bgcolor: "action.hover" },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "transparent" },
            }}
          />
          <Button
            variant="text"
            color="inherit"
            size="small"
            startIcon={<RestoreIcon fontSize="small" />}
            onClick={() => setDeletedOpen(true)}
            sx={{ ...pillButton, px: 1.5, color: "text.secondary", alignSelf: { xs: "flex-start", sm: "center" } }}
          >
            Eliminados{deletedGyms.length > 0 && ` (${deletedGyms.length})`}
          </Button>
        </Stack>

        {loading ? (
          <Box display="flex" justifyContent="center" py={6} sx={{ borderTop: 1, borderColor: "divider" }}>
            <CircularProgress sx={{ color: MINT }} />
          </Box>
        ) : cards.length === 0 ? (
          <Box sx={{ p: 5, textAlign: "center", borderTop: 1, borderColor: "divider" }}>
            <Typography color="text.secondary">
              {gyms.length === 0 ? "Todavía no hay gimnasios. Creá el primero con «Nuevo gimnasio»." : "Ningún gimnasio coincide con la búsqueda."}
            </Typography>
          </Box>
        ) : (
          <>
            {/* Encabezado de columnas (desktop) */}
            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                alignItems: "center",
                gap: 1.5,
                px: 2.5,
                py: 1,
                borderTop: 1,
                borderBottom: 1,
                borderColor: "divider",
                bgcolor: "action.hover",
                color: "text.secondary",
                fontSize: "0.78rem",
                fontWeight: 700,
              }}
            >
              <Box sx={{ flex: 1, pl: "56px" }}>Gimnasio</Box>
              <Box sx={{ width: COLS.wa, textAlign: "center" }}>WhatsApp</Box>
              <Box sx={{ width: COLS.estado, textAlign: "center" }}>Suscripción</Box>
              <Box sx={{ width: COLS.alumnos, textAlign: "right" }}>Alumnos</Box>
              <Box sx={{ width: COLS.vence, textAlign: "right" }}>Vence</Box>
              <Box sx={{ width: COLS.accion }} />
            </Box>
            <Box sx={(t) => ({ borderTop: { xs: `1px solid ${t.palette.divider}`, md: "none" } })}>
              {cards.map(({ gym, subscription, alumnosCount }, i) => (
                <GymRow
                  key={gym.id}
                  gym={gym}
                  subscription={subscription}
                  alumnosCount={alumnosCount}
                  divider={i < cards.length - 1}
                  renewing={renewingId === subscription?.id}
                  onOpen={() => setSelectedGym(gym)}
                  onRenew={() => subscription && handleRenewSub(subscription)}
                />
              ))}
            </Box>
          </>
        )}
      </Paper>

      {/* ESTADÍSTICAS POR GIMNASIO */}
      <SectionPaper icon={<InsightsIcon />} title="Estadísticas por gimnasio" sx={{ mt: 3 }}>
        <GymStatsSection />
      </SectionPaper>

      {/* COMUNICACIONES */}
      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3, mt: 3, alignItems: "stretch" }}>
        <SectionPaper
          icon={<WhatsAppIcon />}
          title="WhatsApp enviados"
          action={
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              onClick={() => setDryRunOpen(true)}
              sx={{ ...pillButton, borderColor: "divider" }}
            >
              Simular envíos
            </Button>
          }
          sx={{ flex: 1, minWidth: 0 }}
        >
          <CommsHistory channel="whatsapp" />
        </SectionPaper>

        <SectionPaper icon={<EmailIcon />} title="Emails enviados" sx={{ flex: 1, minWidth: 0 }}>
          <CommsHistory channel="email" />
        </SectionPaper>
      </Box>

      {/* DRAWERS / MODALS */}
      <Dialog open={dryRunOpen} onClose={() => setDryRunOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: RADIUS } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: 1, fontWeight: 700 }}>
          Simulación de envíos por WhatsApp
          <IconButton onClick={() => setDryRunOpen(false)} size="small" aria-label="Cerrar">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <WaDryRun />
        </DialogContent>
      </Dialog>

      <GymDetailDrawer gym={selectedGym} open={!!selectedGym} onClose={() => setSelectedGym(null)} />

      <CreateGymModal open={createOpen} onClose={() => setCreateOpen(false)} />

      <SectionDialog open={plansOpen} onClose={() => setPlansOpen(false)} title="Planes">
        <ManageGymPlans />
      </SectionDialog>

      <SectionDialog open={novedadesOpen} onClose={() => setNovedadesOpen(false)} title="Novedades">
        <ManageNovedades />
      </SectionDialog>

      <Dialog open={deletedOpen} onClose={() => setDeletedOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: RADIUS } }}>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pr: 1, fontWeight: 700 }}>
          Gimnasios eliminados
          <IconButton onClick={() => setDeletedOpen(false)} size="small" aria-label="Cerrar">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {deletedGyms.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={4}>
              No hay gimnasios eliminados.
            </Typography>
          ) : (
            <Box>
              {deletedGyms.map((g, i) => (
                <Box
                  key={g.id}
                  sx={{
                    px: 3,
                    py: 1.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: i < deletedGyms.length - 1 ? 1 : 0,
                    borderColor: "divider",
                  }}
                >
                  <Box>
                    <Typography fontWeight={600}>{g.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Eliminado el {new Date(g.deleted_at).toLocaleDateString("es-AR")}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    color="inherit"
                    startIcon={<RestoreIcon fontSize="small" />}
                    onClick={() => restoreGym.mutate(g.id)}
                    disabled={restoreGym.isPending}
                    sx={{ ...pillButton, borderColor: "divider" }}
                  >
                    Restaurar
                  </Button>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  )
}

/* ---------- Fila de gimnasio ---------- */
function GymRow({
  gym,
  subscription,
  alumnosCount,
  divider,
  renewing,
  onOpen,
  onRenew,
}: {
  gym: Gym
  subscription: Suscription | null
  alumnosCount: number
  divider: boolean
  renewing: boolean
  onOpen: () => void
  onRenew: () => void
}) {
  const now = useNow()
  const theme = useTheme()
  const isExpired = !!subscription?.end_at && new Date(subscription.end_at).getTime() < now
  const isExpiringSoon =
    !isExpired && !!subscription?.end_at && new Date(subscription.end_at).getTime() <= now + 7 * 24 * 60 * 60 * 1000
  const venceStr = subscription?.end_at ? new Date(subscription.end_at).toLocaleDateString("es-AR") : null
  const venceColor = isExpired
    ? toneColors(theme, "late").fg
    : isExpiringSoon
      ? toneColors(theme, "warn").fg
      : "text.secondary"

  const statusChip = isExpired ? (
    <Pill tone="late">Vencida</Pill>
  ) : isExpiringSoon ? (
    <Pill tone="warn">Por vencer</Pill>
  ) : subscription ? (
    <Pill tone="ok">Activa</Pill>
  ) : (
    <Pill tone="neutral">Sin suscripción</Pill>
  )

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onOpen()
        }
      }}
      aria-label={`Ver detalle de ${gym.name}`}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: { xs: 1.75, sm: 2.5 },
        py: 1.5,
        cursor: "pointer",
        borderBottom: divider ? 1 : 0,
        borderColor: "divider",
        transition: "background-color .15s ease",
        "&:active": { bgcolor: "action.selected" },
        "@media (hover: hover)": { "&:hover": { bgcolor: "action.hover" } },
        "&:focus-visible": { outline: `2px solid ${accent(theme)}`, outlineOffset: -2 },
      }}
    >
      <Avatar
        src={gym.logo_url || undefined}
        sx={{
          bgcolor: alpha(MINT, 0.16),
          color: accent(theme),
          width: 42,
          height: 42,
          fontSize: "1rem",
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {gym.name[0]?.toUpperCase()}
      </Avatar>

      {/* Nombre + plan */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography fontWeight={700} noWrap>
          {gym.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap sx={{ display: { xs: "none", md: "block" } }}>
          {subscription?.gym_plans?.name ? `Plan ${subscription.gym_plans.name}` : "Sin plan"}
        </Typography>

        {/* Chips y datos en una línea (mobile / tablet) */}
        <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap sx={{ display: { md: "none" }, mt: 0.75 }}>
          <WaChip gym={gym} />
          {statusChip}
        </Stack>
        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: { md: "none" }, mt: 0.5 }}>
          {subscription?.gym_plans?.name ? `Plan ${subscription.gym_plans.name}` : "Sin plan"} · {alumnosCount} alumnos
          {venceStr && (
            <>
              {" · "}
              <Box component="span" sx={{ color: venceColor }}>
                Vence {venceStr}
              </Box>
            </>
          )}
        </Typography>
      </Box>

      {/* --- Columnas desktop (md+) --- */}
      <Box sx={{ display: { xs: "none", md: "flex" }, width: COLS.wa, justifyContent: "center" }}>
        <WaChip gym={gym} />
      </Box>

      <Box sx={{ display: { xs: "none", md: "flex" }, width: COLS.estado, justifyContent: "center" }}>
        {statusChip}
      </Box>

      <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end" sx={{ display: { xs: "none", md: "flex" }, width: COLS.alumnos }}>
        <GroupIcon sx={{ fontSize: "1rem", color: "text.secondary" }} />
        <Typography variant="body2" fontWeight={700} sx={{ fontVariantNumeric: "tabular-nums" }}>
          {alumnosCount}
        </Typography>
      </Stack>

      <Box sx={{ display: { xs: "none", md: "block" }, width: COLS.vence, textAlign: "right" }}>
        {venceStr ? (
          <Typography variant="body2" noWrap sx={{ color: venceColor, fontWeight: isExpired || isExpiringSoon ? 700 : 500, fontVariantNumeric: "tabular-nums" }}>
            {venceStr}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.disabled">
            —
          </Typography>
        )}
      </Box>

      {/* Renovar */}
      <Box sx={{ width: COLS.accion, flexShrink: 0, display: "flex", justifyContent: "center" }}>
        {subscription && (
          <Tooltip title="Renovar +1 mes">
            <span>
              <IconButton
                size="small"
                disabled={renewing}
                aria-label={`Renovar la suscripción de ${gym.name} por un mes`}
                onClick={(e) => {
                  e.stopPropagation()
                  onRenew()
                }}
                sx={{ color: accent(theme), bgcolor: alpha(MINT, 0.12), "&:hover": { bgcolor: alpha(MINT, 0.24) } }}
              >
                {renewing ? <CircularProgress size={16} sx={{ color: "inherit" }} /> : <AutorenewIcon fontSize="small" />}
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Box>
    </Box>
  )
}

/* ---------- Tarjeta de sección con encabezado ---------- */
function SectionPaper({
  icon,
  title,
  action,
  children,
  sx,
}: {
  icon: React.ReactNode
  title: string
  action?: React.ReactNode
  children: React.ReactNode
  sx?: object
}) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: RADIUS, overflow: "hidden", ...sx }}>
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        sx={{ px: { xs: 1.75, sm: 2.5 }, py: 1.75, borderBottom: 1, borderColor: "divider" }}
      >
        <Box
          sx={(t) => ({
            width: 34,
            height: 34,
            borderRadius: "10px",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            bgcolor: alpha(MINT, 0.14),
            color: accent(t),
            "& svg": { fontSize: "1.15rem" },
          })}
        >
          {icon}
        </Box>
        <Typography variant="h6" fontWeight={700} flex={1} noWrap sx={{ fontSize: "1.1rem" }}>
          {title}
        </Typography>
        {action}
      </Stack>
      <Box sx={{ p: { xs: 1.75, md: 2.5 } }}>{children}</Box>
    </Paper>
  )
}

function SectionDialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: RADIUS } }}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: 1, fontWeight: 700 }}>
        {title}
        <IconButton onClick={onClose} size="small" aria-label="Cerrar">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>{children}</DialogContent>
    </Dialog>
  )
}
