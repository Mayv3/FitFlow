"use client"

import { useEffect, useMemo, useState } from "react"
import axios from "axios"
import Cookies from "js-cookie"
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  TextField,
  InputAdornment,
  Card,
  CardActionArea,
  CardContent,
  Avatar,
  Chip,
  CircularProgress,
  Grid,
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
import WarningIcon from "@mui/icons-material/Warning"
import EmailIcon from "@mui/icons-material/Email"
import CardMembershipIcon from "@mui/icons-material/CardMembership"
import AnnouncementIcon from "@mui/icons-material/Announcement"
import RestoreIcon from "@mui/icons-material/Restore"
import CloseIcon from "@mui/icons-material/Close"
import AutorenewIcon from "@mui/icons-material/Autorenew"

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
import { EmailLogs } from "@/components/owner/EmailLogs"
import { TodayEmailsBox } from "@/components/owner/TodayEmailsBox"

type GymCardData = {
  gym: Gym
  subscription: Suscription | null
  alumnosCount: number
}

const getPlanBadgeSx = (planName?: string | null) => {
  if (!planName) return {}
  const n = planName.toLowerCase()
  if (n.includes("max")) return { bgcolor: "#ec4899", color: "white" }
  if (n.includes("enterprise")) return { bgcolor: "#7c3aed", color: "white" }
  if (n.includes("premium")) return { bgcolor: "#f59e0b", color: "white" }
  return {}
}

function StatCard({
  label,
  value,
  icon,
  color = "primary.main",
}: {
  label: string
  value: number | string
  icon: React.ReactNode
  color?: string
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar sx={{ bgcolor: color, width: 44, height: 44 }}>{icon}</Avatar>
        <Box>
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="h5" fontWeight={700}>
            {value}
          </Typography>
        </Box>
      </Stack>
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
    next.setMonth(next.getMonth() + 1)
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
  const [emailsOpen, setEmailsOpen] = useState(false)
  const [deletedOpen, setDeletedOpen] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/alumnos/active-count`
        )
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
    <Box>
      {/* HEADER */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          background: "linear-gradient(135deg,#0dc985 0%,#0aa56e 100%)",
          color: "white",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          alignItems={{ md: "center" }}
          justifyContent="space-between"
          spacing={2}
        >
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Panel Owner
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Gestioná gimnasios, suscripciones, planes y comunicaciones desde acá.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button
              variant="contained"
              color="inherit"
              startIcon={<AddIcon />}
              onClick={() => setCreateOpen(true)}
              sx={{ color: "#0aa56e", bgcolor: "white", fontWeight: 600 }}
            >
              Crear gimnasio
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<CardMembershipIcon />}
              onClick={() => setPlansOpen(true)}
              sx={{ borderColor: "white", color: "white" }}
            >
              Planes
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<AnnouncementIcon />}
              onClick={() => setNovedadesOpen(true)}
              sx={{ borderColor: "white", color: "white" }}
            >
              Novedades
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<EmailIcon />}
              onClick={() => setEmailsOpen(true)}
              sx={{ borderColor: "white", color: "white" }}
            >
              Emails
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* STATS */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <StatCard
            label="Gimnasios"
            value={stats.totalGyms}
            icon={<BusinessIcon />}
            color="#0dc985"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            label="Suscripciones activas"
            value={stats.activas}
            icon={<CardMembershipIcon />}
            color="#3b82f6"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            label="Por vencer (7 días)"
            value={stats.porVencer}
            icon={<WarningIcon />}
            color="#f59e0b"
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            label="Vencidas"
            value={stats.vencidas}
            icon={<WarningIcon />}
            color="#ef4444"
          />
        </Grid>
      </Grid>

      {/* SEARCH + DELETED */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ sm: "center" }}
        justifyContent="space-between"
        mb={2}
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
          sx={{ minWidth: { sm: 320 } }}
        />
        <Button
          variant="outlined"
          color="error"
          size="small"
          onClick={() => setDeletedOpen(true)}
        >
          Eliminados {deletedGyms.length > 0 && `(${deletedGyms.length})`}
        </Button>
      </Stack>

      {/* GYM GRID */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : cards.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
          <Typography color="text.secondary">
            {gyms.length === 0
              ? "Aún no hay gimnasios. Creá el primero."
              : "Ningún gimnasio coincide con la búsqueda."}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {cards.map(({ gym, subscription, alumnosCount }) => {
            const isExpired =
              subscription?.end_at && new Date(subscription.end_at).getTime() < Date.now()
            const isExpiringSoon =
              !isExpired &&
              subscription?.end_at &&
              new Date(subscription.end_at).getTime() <=
                Date.now() + 7 * 24 * 60 * 60 * 1000

            return (
              <Grid item xs={12} sm={6} md={4} key={gym.id}>
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    height: "100%",
                    transition: "transform .15s, box-shadow .15s",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: 3,
                    },
                  }}
                >
                  <CardActionArea
                    onClick={() => setSelectedGym(gym)}
                    sx={{ p: 0 }}
                    component="div"
                  >
                    <CardContent>
                      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                        <Avatar src={gym.logo_url || undefined} sx={{ bgcolor: "#0dc985" }}>
                          {gym.name[0]?.toUpperCase()}
                        </Avatar>
                        <Box flex={1} minWidth={0}>
                          <Typography fontWeight={700} noWrap>
                            {gym.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {subscription?.gym_plans?.name || "Sin plan"}
                          </Typography>
                        </Box>
                      </Stack>

                      <Stack direction="row" spacing={1} flexWrap="wrap" mb={1.5}>
                        {subscription?.gym_plans ? (
                          <Chip
                            label={subscription.gym_plans.name}
                            size="small"
                            sx={getPlanBadgeSx(subscription.gym_plans.name)}
                          />
                        ) : (
                          <Chip label="Sin plan" size="small" variant="outlined" />
                        )}
                        {subscription ? (
                          <Chip label="Activo" size="small" color="success" />
                        ) : (
                          <Chip label="Inactivo" size="small" color="default" variant="outlined" />
                        )}
                        {isExpired && <Chip label="Vencido" size="small" color="error" />}
                        {isExpiringSoon && (
                          <Chip label="Por vencer" size="small" color="warning" />
                        )}
                      </Stack>

                      <Stack direction="row" spacing={2}>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <GroupIcon fontSize="small" color="action" />
                          <Typography variant="body2">{alumnosCount} alumnos</Typography>
                        </Stack>
                        {subscription?.end_at && (
                          <Typography
                            variant="body2"
                            color={
                              isExpired
                                ? "error.main"
                                : isExpiringSoon
                                ? "warning.main"
                                : "text.secondary"
                            }
                          >
                            Vence: {new Date(subscription.end_at).toLocaleDateString("es-AR")}
                          </Typography>
                        )}
                      </Stack>
                    </CardContent>
                  </CardActionArea>
                  {subscription && (
                    <Box sx={{ px: 2, pb: 2 }}>
                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        color="success"
                        startIcon={<AutorenewIcon />}
                        disabled={renewingId === subscription.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRenewSub(subscription)
                        }}
                      >
                        {renewingId === subscription.id ? (
                          <CircularProgress size={18} />
                        ) : (
                          "Renovar +1 mes"
                        )}
                      </Button>
                    </Box>
                  )}
                </Card>
              </Grid>
            )
          })}
        </Grid>
      )}

      {/* EMAILS DE HOY */}
      <TodayEmailsBox />

      {/* DRAWERS / MODALS */}
      <GymDetailDrawer
        gym={selectedGym}
        open={!!selectedGym}
        onClose={() => setSelectedGym(null)}
      />

      <CreateGymModal open={createOpen} onClose={() => setCreateOpen(false)} />

      <SectionDialog open={plansOpen} onClose={() => setPlansOpen(false)} title="Planes">
        <ManageGymPlans />
      </SectionDialog>

      <SectionDialog
        open={novedadesOpen}
        onClose={() => setNovedadesOpen(false)}
        title="Novedades"
      >
        <ManageNovedades />
      </SectionDialog>

      <SectionDialog
        open={emailsOpen}
        onClose={() => setEmailsOpen(false)}
        title="Emails enviados"
      >
        <EmailLogs />
      </SectionDialog>

      <Dialog
        open={deletedOpen}
        onClose={() => setDeletedOpen(false)}
        maxWidth="sm"
        fullWidth
      >
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
                    <IconButton
                      color="primary"
                      onClick={() => restoreGym.mutate(g.id)}
                      disabled={restoreGym.isPending}
                    >
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
