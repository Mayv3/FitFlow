"use client"

import { useEffect, useMemo, useState } from "react"
import axios from "axios"
import Cookies from "js-cookie"
import {
  Box,
  Drawer,
  IconButton,
  Typography,
  Tabs,
  Tab,
  Stack,
  Avatar,
  TextField,
  Button,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
} from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"
import SaveIcon from "@mui/icons-material/Save"
import AutorenewIcon from "@mui/icons-material/Autorenew"
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline"
import EmailIcon from "@mui/icons-material/Email"
import PeopleIcon from "@mui/icons-material/People"
import CardMembershipIcon from "@mui/icons-material/CardMembership"
import BusinessIcon from "@mui/icons-material/Business"
import { notify } from "@/lib/toast"
import { Gym, useUpdateGym, useSoftDeleteGym } from "@/hooks/gyms/useGyms"
import { useGymPlans } from "@/hooks/gymPlans/useGymPlans"
import {
  useActiveSuscriptionByGymId,
  useCreateSuscription,
  useUpdateSuscription,
} from "@/hooks/gymSubscriptions/useSuscriptions"
import { EmailLogs } from "@/components/owner/EmailLogs"

interface Props {
  gym: Gym | null
  open: boolean
  onClose: () => void
}

type UserRow = {
  id: number
  name: string
  email: string
  dni: number
  role_id: number
  auth_user_id: string
}

const ROLE_LABEL: Record<number, string> = { 2: "Dueño", 3: "Recepcionista" }

function toLocalISOString(dateStr: string) {
  return new Date(`${dateStr}T12:00:00`).toISOString()
}

export function GymDetailDrawer({ gym, open, onClose }: Props) {
  const [tab, setTab] = useState(0)

  useEffect(() => {
    if (open) setTab(0)
  }, [open, gym?.id])

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: "100%", sm: 520 }, maxWidth: "100%" } }}
    >
      {gym && (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar src={gym.logo_url || undefined} sx={{ bgcolor: "#0dc985" }}>
                {gym.name[0]?.toUpperCase()}
              </Avatar>
              <Box flex={1}>
                <Typography variant="h6" fontWeight={700} noWrap>
                  {gym.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ID: {gym.id}
                </Typography>
              </Box>
              <IconButton onClick={onClose}>
                <CloseIcon />
              </IconButton>
            </Stack>
          </Box>

          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            <Tab icon={<BusinessIcon />} label="Detalles" iconPosition="start" />
            <Tab icon={<CardMembershipIcon />} label="Plan" iconPosition="start" />
            <Tab icon={<PeopleIcon />} label="Usuarios" iconPosition="start" />
            <Tab icon={<EmailIcon />} label="Emails" iconPosition="start" />
          </Tabs>

          <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
            {tab === 0 && <DetailsTab gym={gym} onDeleted={onClose} />}
            {tab === 1 && <SubscriptionTab gym={gym} />}
            {tab === 2 && <UsersTab gym={gym} />}
            {tab === 3 && <EmailLogs gymId={gym.id} hideHeader />}
          </Box>
        </Box>
      )}
    </Drawer>
  )
}

function DetailsTab({ gym, onDeleted }: { gym: Gym; onDeleted: () => void }) {
  const [name, setName] = useState(gym.name)
  const [logoUrl, setLogoUrl] = useState(gym.logo_url || "")
  const updateGym = useUpdateGym()
  const softDelete = useSoftDeleteGym()

  useEffect(() => {
    setName(gym.name)
    setLogoUrl(gym.logo_url || "")
  }, [gym.id])

  const handleSave = async () => {
    if (!name.trim()) return notify.error("Nombre requerido")
    try {
      await updateGym.mutateAsync({
        id: gym.id,
        name: name.trim(),
        logo_url: logoUrl.trim() || null,
      })
      notify.success("Gimnasio actualizado")
    } catch (e: any) {
      notify.error(e.message || "Error al actualizar")
    }
  }

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar gimnasio "${gym.name}"?`)) return
    try {
      await softDelete.mutateAsync(gym.id)
      notify.success("Gimnasio eliminado")
      onDeleted()
    } catch (e: any) {
      notify.error(e.message || "Error al eliminar")
    }
  }

  return (
    <Stack spacing={2}>
      <TextField label="Nombre" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
      <TextField
        label="Logo URL"
        value={logoUrl}
        onChange={(e) => setLogoUrl(e.target.value)}
        fullWidth
        helperText="Dejá vacío para no usar logo personalizado"
      />
      {logoUrl && (
        <Box>
          <Typography variant="caption" color="text.secondary">
            Vista previa:
          </Typography>
          <Box mt={1}>
            <Avatar src={logoUrl} sx={{ width: 64, height: 64 }} />
          </Box>
        </Box>
      )}

      <Stack direction="row" spacing={1} mt={2}>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={updateGym.isPending}
          fullWidth
        >
          {updateGym.isPending ? <CircularProgress size={20} /> : "Guardar cambios"}
        </Button>
        <Tooltip title="Eliminar gimnasio">
          <span>
            <Button
              variant="outlined"
              color="error"
              onClick={handleDelete}
              disabled={softDelete.isPending}
            >
              {softDelete.isPending ? <CircularProgress size={20} /> : <DeleteOutlineIcon />}
            </Button>
          </span>
        </Tooltip>
      </Stack>
    </Stack>
  )
}

function SubscriptionTab({ gym }: { gym: Gym }) {
  const { data: plans = [], isLoading: loadingPlans } = useGymPlans()
  const { data: currentSub, isLoading: loadingSub } = useActiveSuscriptionByGymId(gym.id)
  const createSub = useCreateSuscription()
  const updateSub = useUpdateSuscription()

  const [planId, setPlanId] = useState<number | null>(null)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  useEffect(() => {
    if (currentSub) {
      setPlanId(currentSub.plan_id)
      setStartDate(currentSub.start_at ? currentSub.start_at.split("T")[0] : "")
      setEndDate(currentSub.end_at ? currentSub.end_at.split("T")[0] : "")
    } else {
      setPlanId(null)
      setStartDate(new Date().toISOString().split("T")[0])
      setEndDate("")
    }
  }, [currentSub?.id, gym.id])

  const selectedPlan = useMemo(
    () => plans.find((p: any) => p.id === planId),
    [planId, plans]
  )

  const isPending = createSub.isPending || updateSub.isPending

  const handleRenew = async () => {
    if (!currentSub) return notify.error("No hay suscripción activa para renovar")
    const base =
      currentSub.end_at && new Date(currentSub.end_at).getTime() > Date.now()
        ? new Date(currentSub.end_at)
        : new Date()
    const next = new Date(base)
    next.setMonth(next.getMonth() + 1)
    const nextStr = next.toISOString().split("T")[0]
    try {
      await updateSub.mutateAsync({
        id: currentSub.id,
        end_at: toLocalISOString(nextStr),
      })
      setEndDate(nextStr)
      notify.success(`Renovado hasta ${next.toLocaleDateString("es-AR")}`)
    } catch (e: any) {
      notify.error(e.message || "Error renovando suscripción")
    }
  }

  const handleSave = async () => {
    if (!planId) return notify.error("Seleccioná un plan")
    try {
      if (currentSub) {
        await updateSub.mutateAsync({
          id: currentSub.id,
          plan_id: planId,
          start_at: startDate ? toLocalISOString(startDate) : undefined,
          end_at: endDate ? toLocalISOString(endDate) : null,
        })
      } else {
        await createSub.mutateAsync({
          gym_id: gym.id,
          plan_id: planId,
          is_active: true,
          start_at: startDate ? toLocalISOString(startDate) : new Date().toISOString(),
          end_at: endDate ? toLocalISOString(endDate) : null,
        })
      }
    } catch (e: any) {
      notify.error(e.message || "Error guardando suscripción")
    }
  }

  if (loadingPlans || loadingSub) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="caption" color="text.secondary">
          Estado actual
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
          {currentSub ? (
            <>
              <Chip
                label={currentSub.gym_plans?.name || "Plan"}
                color="primary"
                size="small"
              />
              <Chip label="Activo" color="success" size="small" />
            </>
          ) : (
            <Chip label="Sin suscripción" color="default" size="small" variant="outlined" />
          )}
        </Stack>
      </Box>

      <Divider />

      <FormControl fullWidth size="small">
        <InputLabel>Plan</InputLabel>
        <Select
          value={planId ?? ""}
          label="Plan"
          onChange={(e) => setPlanId(Number(e.target.value) || null)}
        >
          {plans.map((p: any) => (
            <MenuItem key={p.id} value={p.id}>
              {p.name} ({p.max_alumnos} alumnos)
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Stack direction="row" spacing={2}>
        <TextField
          label="Inicio"
          type="date"
          size="small"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
        <TextField
          label="Fin"
          type="date"
          size="small"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
      </Stack>

      {selectedPlan && (
        <Box
          sx={{
            p: 1.5,
            borderRadius: 1.5,
            border: 1,
            borderColor: "divider",
            bgcolor: "action.hover",
          }}
        >
          <Typography variant="caption" color="primary.main" fontWeight={600}>
            FEATURES — {selectedPlan.name}
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1 }}>
            {selectedPlan.stats && <Chip label="Stats" size="small" variant="outlined" />}
            {selectedPlan.classes && <Chip label="Clases" size="small" variant="outlined" />}
            {selectedPlan.services && <Chip label="Servicios" size="small" variant="outlined" />}
            {selectedPlan.appointments && <Chip label="Turnos" size="small" variant="outlined" />}
            {selectedPlan.portal && <Chip label="Portal" size="small" variant="outlined" />}
            {selectedPlan.settings && <Chip label="Config" size="small" variant="outlined" />}
            {selectedPlan.products && <Chip label="Productos" size="small" variant="outlined" />}
          </Box>
        </Box>
      )}

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isPending || !planId}
          startIcon={<SaveIcon />}
          fullWidth
        >
          {isPending ? <CircularProgress size={20} /> : currentSub ? "Actualizar plan" : "Asignar plan"}
        </Button>
        {currentSub && (
          <Tooltip title="Sumar 1 mes a la fecha de fin">
            <span style={{ flex: 1, display: "flex" }}>
              <Button
                variant="outlined"
                color="success"
                onClick={handleRenew}
                disabled={isPending}
                startIcon={<AutorenewIcon />}
                fullWidth
              >
                Renovar +1 mes
              </Button>
            </span>
          </Tooltip>
        )}
      </Stack>
    </Stack>
  )
}

function UsersTab({ gym }: { gym: Gym }) {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchUsers = async () => {
    setLoading(true)
    setError("")
    try {
      const token = Cookies.get("token")
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users?gym_id=${gym.id}`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      )
      setUsers(Array.isArray(res.data) ? res.data : res.data?.items ?? [])
    } catch (e: any) {
      setError(e.response?.data?.error || "Error al cargar usuarios")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gym.id])

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return <Typography color="error">{error}</Typography>
  }

  return (
    <Stack spacing={1}>
      {users.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" py={3}>
          Sin usuarios asignados.
        </Typography>
      ) : (
        users.map((u) => (
          <Box
            key={u.id}
            sx={{
              p: 1.5,
              borderRadius: 1.5,
              border: 1,
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Avatar sx={{ bgcolor: "#0dc985" }}>{u.name?.[0]?.toUpperCase() || "?"}</Avatar>
            <Box flex={1}>
              <Typography fontWeight={600}>{u.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {u.email}
              </Typography>
            </Box>
            <Chip
              label={ROLE_LABEL[u.role_id] || `Rol ${u.role_id}`}
              size="small"
              color={u.role_id === 2 ? "primary" : "default"}
            />
          </Box>
        ))
      )}
    </Stack>
  )
}
