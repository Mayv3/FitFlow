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
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Tooltip,
} from "@mui/material"
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

const GREEN = "#16A34A"

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

const WA_META: Record<WaState, { label: string; full: string; sx: object }> = {
  activado: {
    label: "Activado",
    full: "WhatsApp habilitado y activado",
    sx: { bgcolor: "#25D366", color: "#fff", "& .MuiChip-icon": { color: "#fff" } },
  },
  habilitado: {
    label: "Habilitado",
    full: "WhatsApp habilitado, sin número",
    sx: { borderColor: "#25D366", color: "#128C7E", "& .MuiChip-icon": { color: "#25D366" } },
  },
  off: {
    label: "No hab.",
    full: "WhatsApp no habilitado",
    sx: { color: "text.disabled", "& .MuiChip-icon": { color: "text.disabled" } },
  },
}

function WaChip({ gym }: { gym: Gym }) {
  const state = waStatus(gym)
  const meta = WA_META[state]
  return (
    <Tooltip title={meta.full}>
      <Chip
        icon={<WhatsAppIcon />}
        label={meta.label}
        size="small"
        variant={state === "activado" ? "filled" : "outlined"}
        sx={{ fontWeight: 600, ...meta.sx }}
      />
    </Tooltip>
  )
}

type GymCardData = {
  gym: Gym
  subscription: Suscription | null
  alumnosCount: number
}

/* ---------- Tira de métricas compacta ---------- */
function StatStrip({
  items,
}: {
  items: { label: string; value: number | string; color: string; icon: React.ReactNode }[]
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2,
        overflow: "hidden",
        display: "grid",
        gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" },
      }}
    >
      {items.map((it, i) => (
        <Stack
          key={it.label}
          direction="row"
          spacing={1.25}
          alignItems="center"
          sx={{
            p: { xs: 1.5, sm: 1.75 },
            minWidth: 0,
            borderColor: "divider",
            // divisores: vertical entre columnas, horizontal en fila 1 (solo xs)
            borderRight: { xs: i % 2 === 0 ? 1 : 0, sm: i < 3 ? 1 : 0 },
            borderBottom: { xs: i < 2 ? 1 : 0, sm: 0 },
          }}
        >
          <Avatar variant="rounded" sx={{ bgcolor: `${it.color}1A`, color: it.color, width: 34, height: 34, flexShrink: 0 }}>
            {it.icon}
          </Avatar>
          <Box minWidth={0}>
            <Typography variant="h6" fontWeight={800} lineHeight={1.1}>
              {it.value}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
              {it.label}
            </Typography>
          </Box>
        </Stack>
      ))}
    </Paper>
  )
}

export function OwnerDashboard() {
  const { data: gyms = [], isLoading: loadingGyms } = useGyms()
  const { data: subs = [], isLoading: loadingSubs } = useSuscriptions()
  const { data: deletedGyms = [] } = useDeletedGyms()
  const restoreGym = useRestoreGym()
  const updateSub = useUpdateSuscription()
  const [renewingId, setRenewingId] = useState<number | null>(null)

  const handleRenewSub = async (sub: Suscription) => {
    const base =
      sub.end_at && new Date(sub.end_at).getTime() > Date.now()
        ? new Date(sub.end_at)
        : new Date()
    const next = new Date(base)
    // +1 mes, pero fijar al día 1 del mes siguiente
    next.setMonth(next.getMonth() + 1, 1)
    next.setHours(12, 0, 0, 0)
    setRenewingId(sub.id)
    try {
      await updateSub.mutateAsync({ id: sub.id, end_at: next.toISOString() })
      notify.success(`Renovado hasta ${next.toLocaleDateString("es-AR")}`)
    } catch (e: any) {
      notify.error(e.message || "Error renovando")
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
    const now = Date.now()
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
  }, [subs, gyms])

  const loading = loadingGyms || loadingSubs

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
      {/* HEADER — barra fina */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ sm: "center" }}
        justifyContent="space-between"
        spacing={1.5}
        mb={2.5}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar variant="rounded" sx={{ bgcolor: GREEN, width: 38, height: 38 }}>
            <BusinessIcon fontSize="small" />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={800} lineHeight={1.1}>
              Panel Owner
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {stats.totalGyms} gimnasios · {stats.activas} activos
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ width: { xs: "100%", sm: "auto" } }}>
          <Button
            variant="contained"
            size="small"
            disableElevation
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
            sx={{ bgcolor: GREEN, "&:hover": { bgcolor: "#128a3d" }, flex: { xs: 1, sm: "none" }, whiteSpace: "nowrap" }}
          >
            Crear
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            startIcon={<CardMembershipIcon />}
            onClick={() => setPlansOpen(true)}
            sx={{ flex: { xs: 1, sm: "none" } }}
          >
            Planes
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            startIcon={<AnnouncementIcon />}
            onClick={() => setNovedadesOpen(true)}
            sx={{ flex: { xs: 1, sm: "none" } }}
          >
            Novedades
          </Button>
        </Stack>
      </Stack>

      {/* STATS — tira compacta */}
      <Box mb={2.5}>
        <StatStrip
          items={[
            { label: "Gimnasios", value: stats.totalGyms, color: GREEN, icon: <BusinessIcon fontSize="small" /> },
            { label: "Suscripciones activas", value: stats.activas, color: "#3b82f6", icon: <CheckCircleIcon fontSize="small" /> },
            { label: "Por vencer (7 días)", value: stats.porVencer, color: "#f59e0b", icon: <WarningAmberIcon fontSize="small" /> },
            { label: "Vencidas", value: stats.vencidas, color: "#ef4444", icon: <WarningAmberIcon fontSize="small" /> },
          ]}
        />
      </Box>

      {/* TOOLBAR */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems={{ sm: "center" }}
        justifyContent="space-between"
        mb={1.5}
      >
        <TextField
          size="small"
          placeholder="Buscar gimnasio..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: { sm: 300 } }}
        />
        <Button variant="text" color="inherit" size="small" startIcon={<RestoreIcon fontSize="small" />} onClick={() => setDeletedOpen(true)}>
          Eliminados {deletedGyms.length > 0 && `(${deletedGyms.length})`}
        </Button>
      </Stack>

      {/* GYM LIST — filas densas */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : cards.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
          <Typography color="text.secondary">
            {gyms.length === 0 ? "Aún no hay gimnasios. Creá el primero." : "Ningún gimnasio coincide con la búsqueda."}
          </Typography>
        </Paper>
      ) : (
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
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
        </Paper>
      )}

      {/* ESTADÍSTICAS POR GIMNASIO */}
      <SectionPaper icon={<InsightsIcon sx={{ color: GREEN }} />} title="Estadísticas por gimnasio" sx={{ mt: 3 }}>
        <GymStatsSection />
      </SectionPaper>

      {/* COMUNICACIONES */}
      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2, mt: 3, alignItems: "stretch" }}>
        <SectionPaper
          icon={<WhatsAppIcon sx={{ color: "#25D366" }} />}
          title="WhatsApp enviados"
          action={
            <Button size="small" variant="outlined" onClick={() => setDryRunOpen(true)} sx={{ borderColor: "#25D366", color: "#128C7E", whiteSpace: "nowrap" }}>
              Simular
            </Button>
          }
          sx={{ flex: 1, minWidth: 0 }}
        >
          <CommsHistory channel="whatsapp" />
        </SectionPaper>

        <SectionPaper icon={<EmailIcon sx={{ color: "#7c3aed" }} />} title="Emails enviados" sx={{ flex: 1, minWidth: 0 }}>
          <CommsHistory channel="email" />
        </SectionPaper>
      </Box>

      {/* DRAWERS / MODALS */}
      <Dialog open={dryRunOpen} onClose={() => setDryRunOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: 1 }}>
          Simulación de envíos WhatsApp
          <IconButton onClick={() => setDryRunOpen(false)} size="small">
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

      <Dialog open={deletedOpen} onClose={() => setDeletedOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pr: 1 }}>
          Gimnasios eliminados
          <IconButton onClick={() => setDeletedOpen(false)} size="small">
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
                  <Tooltip title="Restaurar">
                    <IconButton color="primary" onClick={() => restoreGym.mutate(g.id)} disabled={restoreGym.isPending}>
                      <RestoreIcon />
                    </IconButton>
                  </Tooltip>
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
  const isExpired = !!subscription?.end_at && new Date(subscription.end_at).getTime() < Date.now()
  const isExpiringSoon =
    !isExpired && !!subscription?.end_at && new Date(subscription.end_at).getTime() <= Date.now() + 7 * 24 * 60 * 60 * 1000
  const venceStr = subscription?.end_at ? new Date(subscription.end_at).toLocaleDateString("es-AR") : null
  const venceColor = isExpired ? "error.main" : isExpiringSoon ? "warning.main" : "text.secondary"

  const statusChip = isExpired ? (
    <Chip label="Vencido" size="small" color="error" />
  ) : isExpiringSoon ? (
    <Chip label="Por vencer" size="small" color="warning" />
  ) : subscription ? (
    <Chip label="Activo" size="small" color="success" variant="outlined" />
  ) : (
    <Chip label="Inactivo" size="small" variant="outlined" />
  )

  return (
    <Box
      onClick={onOpen}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: { xs: 1.25, sm: 1.5 },
        px: { xs: 1.5, sm: 2 },
        py: { xs: 1.5, sm: 1.25 },
        cursor: "pointer",
        borderBottom: divider ? 1 : 0,
        borderColor: "divider",
        "&:active": { bgcolor: "action.selected" },
        "@media (hover: hover)": { "&:hover": { bgcolor: "action.hover" } },
      }}
    >
      <Avatar src={gym.logo_url || undefined} sx={{ bgcolor: GREEN, width: 40, height: 40, fontSize: "0.95rem", flexShrink: 0 }}>
        {gym.name[0]?.toUpperCase()}
      </Avatar>

      {/* Nombre + meta */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography fontWeight={700} noWrap>
          {gym.name}
        </Typography>

        {/* Plan (subtítulo solo desktop) */}
        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: { xs: "none", md: "block" } }}>
          {subscription?.gym_plans?.name || "Sin plan"}
        </Typography>

        {/* Chips inline (mobile / tablet) */}
        <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap sx={{ display: { md: "none" }, mt: 0.75 }}>
          <WaChip gym={gym} />
          {statusChip}
        </Stack>

        {/* Meta inline (mobile / tablet) */}
        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: { md: "none" }, mt: 0.5 }}>
          {subscription?.gym_plans?.name || "Sin plan"} · {alumnosCount} alumnos
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
      <Box sx={{ display: { xs: "none", md: "flex" }, width: 124, justifyContent: "center" }}>
        <WaChip gym={gym} />
      </Box>

      <Box sx={{ display: { xs: "none", md: "flex" }, width: 96, justifyContent: "center" }}>
        {statusChip}
      </Box>

      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ display: { xs: "none", md: "flex" }, width: 68, justifyContent: "flex-end" }}>
        <GroupIcon fontSize="small" color="action" />
        <Typography variant="body2" fontWeight={600}>
          {alumnosCount}
        </Typography>
      </Stack>

      <Box sx={{ display: { xs: "none", md: "block" }, width: 120, textAlign: "right" }}>
        {venceStr ? (
          <Typography variant="body2" color={venceColor} noWrap>
            {venceStr}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.disabled">
            —
          </Typography>
        )}
      </Box>

      {/* Renovar (siempre) */}
      <Box sx={{ flexShrink: 0, display: "flex", justifyContent: "center" }}>
        {subscription && (
          <Tooltip title="Renovar +1 mes">
            <span>
              <IconButton
                size="small"
                color="success"
                disabled={renewing}
                onClick={(e) => {
                  e.stopPropagation()
                  onRenew()
                }}
              >
                {renewing ? <CircularProgress size={16} /> : <AutorenewIcon fontSize="small" />}
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Box>
    </Box>
  )
}

/* ---------- Paper de sección con header compacto ---------- */
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
    <Paper variant="outlined" sx={{ borderRadius: 2, ...sx }}>
      <Stack
        direction="row"
        spacing={1.25}
        alignItems="center"
        sx={{ px: 2, py: 1.25, borderBottom: 1, borderColor: "divider" }}
      >
        {icon}
        <Typography variant="subtitle1" fontWeight={700} flex={1} noWrap>
          {title}
        </Typography>
        {action}
      </Stack>
      <Box sx={{ p: { xs: 1.5, md: 2 } }}>{children}</Box>
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
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: 1 }}>
        {title}
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>{children}</DialogContent>
    </Dialog>
  )
}
