"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Cookies from "js-cookie"
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Stack,
  Chip,
  Divider,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  IconButton,
  Tooltip,
} from "@mui/material"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import BusinessIcon from "@mui/icons-material/Business"
import EditIcon from "@mui/icons-material/Edit"
import WarningIcon from "@mui/icons-material/Warning"
import { useGymPlans } from "@/hooks/gymPlans/useGymPlans"
import {
  useSuscriptions,
  useCreateSuscription,
  useUpdateSuscription,
  Suscription,
} from "@/hooks/gymSubscriptions/useSuscriptions"

interface Gym {
  id: string
  name: string
}

interface GymPlan {
  id: number
  name: string
  max_alumnos: number
  stats: boolean
  classes: boolean
  services: boolean
  appointments: boolean
  portal: boolean
  settings: boolean
}

export function AssignPlanToGym() {
  const [gyms, setGyms] = useState<Gym[]>([])
  const [selectedGymId, setSelectedGymId] = useState("")
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [loadingGyms, setLoadingGyms] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const { data: plans = [], isLoading: loadingPlans } = useGymPlans()
  const { data: suscriptions = [], isLoading: loadingSuscriptions } = useSuscriptions()
  const createSuscription = useCreateSuscription()
  const updateSuscription = useUpdateSuscription()

  // Cargar gimnasios
  useEffect(() => {
    const fetchGyms = async () => {
      try {
        const token = Cookies.get("token")
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/gyms`, { headers })
        const gymsData = Array.isArray(res.data) ? res.data : []
        setGyms(gymsData)
      } catch (err: any) {
        setError(err.response?.data?.error || "Error al cargar gimnasios")
      } finally {
        setLoadingGyms(false)
      }
    }
    fetchGyms()
  }, [])

  // Obtener la suscripción activa del gimnasio seleccionado
  const currentSuscription = suscriptions.find(
    (s: Suscription) => s.gym_id === selectedGymId && s.is_active
  )

  // Cuando cambia el gimnasio, actualizar los campos con la suscripción actual
  useEffect(() => {
    if (currentSuscription) {
      setSelectedPlanId(currentSuscription.plan_id)
      setStartDate(currentSuscription.start_at ? currentSuscription.start_at.split("T")[0] : "")
      setEndDate(currentSuscription.end_at ? currentSuscription.end_at.split("T")[0] : "")
    } else {
      setSelectedPlanId(null)
      setStartDate(new Date().toISOString().split("T")[0])
      setEndDate("")
    }
  }, [selectedGymId, currentSuscription])

  const handleSelectGym = (gymId: string) => {
    setSelectedGymId(gymId)
    setSuccess("")
    setError("")
  }

  const handleAssignPlan = async () => {
    if (!selectedGymId || selectedPlanId === null) {
      setError("Debes seleccionar un gimnasio y un plan")
      return
    }

    setError("")
    setSuccess("")

    // Parse a date string (YYYY-MM-DD) as local noon to avoid UTC offset shifting the day
    const toLocalISOString = (dateStr: string) => {
      const d = new Date(`${dateStr}T12:00:00`)
      return d.toISOString()
    }

    try {
      if (currentSuscription) {
        await updateSuscription.mutateAsync({
          id: currentSuscription.id,
          plan_id: selectedPlanId,
          start_at: startDate ? toLocalISOString(startDate) : undefined,
          end_at: endDate ? toLocalISOString(endDate) : null,
        })
      } else {
        await createSuscription.mutateAsync({
          gym_id: selectedGymId,
          plan_id: selectedPlanId,
          is_active: true,
          start_at: startDate ? toLocalISOString(startDate) : new Date().toISOString(),
          end_at: endDate ? toLocalISOString(endDate) : null,
        })
      }
      setSuccess(currentSuscription ? "Plan actualizado exitosamente" : "Plan asignado exitosamente")
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al asignar el plan")
    }
  }

  const selectedPlan = plans.find((p: GymPlan) => p.id === selectedPlanId)
  const selectedGym = gyms.find((g: Gym) => g.id === selectedGymId)
  const isUpdating = createSuscription.isPending || updateSuscription.isPending

  // Helper para obtener la suscripción de un gym
  const getGymSuscription = (gymId: string) => {
    return suscriptions.find((s: Suscription) => s.gym_id === gymId && s.is_active)
  }

  // Helper para obtener el color del badge según el plan
  const getPlanBadgeColor = (planName: string | undefined) => {
    if (!planName) return "default"
    const name = planName.toLowerCase()
    if (name.includes("enterprise")) return "secondary" // morado
    if (name.includes("premium")) return "warning" // amarillo
    return "primary"
  }

  const getPlanBadgeSx = (planName: string | undefined) => {
    if (!planName) return {}
    const name = planName.toLowerCase()
    if (name.includes("max")) {
      return { bgcolor: "#ec4899", color: "white", borderColor: "#ec4899" }
    }
    if (name.includes("enterprise")) {
      return { bgcolor: "#7c3aed", color: "white", borderColor: "#7c3aed" }
    }
    if (name.includes("premium")) {
      return { bgcolor: "#f59e0b", color: "white", borderColor: "#f59e0b" }
    }

    return {}
  }

  if (loadingGyms || loadingPlans || loadingSuscriptions) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (gyms.length === 0) {
    return (
      <Box>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Gestión de Suscripciones
        </Typography>
        <Typography color="text.secondary">
          No hay gimnasios creados aún. Crea uno primero en la pestaña "Gimnasios".
        </Typography>
      </Box>
    )
  }

  if (plans.length === 0) {
    return (
      <Box>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Gestión de Suscripciones
        </Typography>
        <Typography color="text.secondary">
          No hay planes de suscripción creados. Crea uno primero en la pestaña "Planes".
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Gestión de Suscripciones
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Visualiza y gestiona las suscripciones de cada gimnasio.
      </Typography>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.2fr 1fr" }, gap: 3 }}>
        {/* Tabla de gimnasios y suscripciones */}
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden", bgcolor: "background.paper" }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider", background: (theme) => theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Gimnasios y Suscripciones
            </Typography>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, background: (theme) => theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)" }}>Gimnasio</TableCell>
                <TableCell sx={{ fontWeight: 600, background: (theme) => theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)" }}>Plan Actual</TableCell>
                <TableCell sx={{ fontWeight: 600, background: (theme) => theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)" }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 600, background: (theme) => theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)" }}>Vencimiento</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, background: (theme) => theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)" }}>Acción</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {gyms.map((gym) => {
                const suscription = getGymSuscription(gym.id)
                const isSelected = selectedGymId === gym.id
                const isExpiringSoon = suscription?.end_at &&
                  new Date(suscription.end_at) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

                return (
                  <TableRow
                    key={gym.id}
                    sx={{
                      bgcolor: isSelected ? "action.selected" : "inherit",
                      "&:hover": { bgcolor: "action.hover" },
                      cursor: "pointer",
                    }}
                    onClick={() => handleSelectGym(gym.id)}
                  >
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <BusinessIcon fontSize="small" color="action" />
                        <Typography variant="body2" fontWeight={isSelected ? 600 : 400}>
                          {gym.name}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {suscription?.gym_plans ? (
                        <Chip
                          label={suscription.gym_plans.name}
                          size="small"
                          sx={getPlanBadgeSx(suscription.gym_plans.name)}
                        />
                      ) : (
                        <Chip
                          label="Sin plan"
                          size="small"
                          color="default"
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {suscription ? (
                        <Chip
                          label="Activo"
                          size="small"
                          color="success"
                          sx={{ fontWeight: 500 }}
                        />
                      ) : (
                        <Chip
                          label="Inactivo"
                          size="small"
                          color="error"
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {suscription?.end_at ? (
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          {isExpiringSoon && (
                            <Tooltip title="Próximo a vencer">
                              <WarningIcon fontSize="small" color="warning" />
                            </Tooltip>
                          )}
                          <Typography variant="body2" color={isExpiringSoon ? "warning.main" : "text.secondary"}>
                            {new Date(suscription.end_at).toLocaleDateString()}
                          </Typography>
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          —
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={suscription ? "Editar suscripción" : "Asignar plan"}>
                        <IconButton
                          size="small"
                          color={isSelected ? "primary" : "default"}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSelectGym(gym.id)
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Paper>

        {/* Formulario de asignación */}
        <Paper variant="outlined" sx={{ borderRadius: 1.5, p: 3, height: "fit-content", bgcolor: "background.paper" }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            {selectedGymId ? (currentSuscription ? "Editar Suscripción" : "Asignar Plan") : "Selecciona un Gimnasio"}
          </Typography>

          {!selectedGymId ? (
            <Typography variant="body2" color="text.secondary">
              Haz clic en un gimnasio de la tabla para asignar o editar su plan.
            </Typography>
          ) : (
            <>
              {error && (
                <Typography color="error" sx={{ mb: 2 }} variant="body2">
                  {error}
                </Typography>
              )}

              {success && (
                <Box sx={{ mb: 2, p: 1.5, bgcolor: (theme) => theme.palette.mode === "dark" ? "rgba(76,175,80,0.15)" : "rgba(76,175,80,0.08)", borderRadius: 1.5, border: 1, borderColor: "success.main" }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CheckCircleIcon color="success" fontSize="small" />
                    <Typography color="success.main" variant="body2">{success}</Typography>
                  </Stack>
                </Box>
              )}

              <Stack spacing={2.5}>
                <Box sx={{ p: 2, background: (theme) => theme.palette.mode === "dark" ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)", borderRadius: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">Gimnasio seleccionado</Typography>
                  <Typography variant="body1" fontWeight={600}>{selectedGym?.name}</Typography>
                </Box>

                <FormControl fullWidth size="small">
                  <InputLabel>Plan de Suscripción</InputLabel>
                  <Select
                    value={selectedPlanId || ""}
                    onChange={(e) => setSelectedPlanId(Number(e.target.value) || null)}
                    label="Plan de Suscripción"
                  >
                    {plans.map((plan: GymPlan) => (
                      <MenuItem key={plan.id} value={plan.id}>
                        {plan.name} ({plan.max_alumnos} alumnos)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Fecha inicio"
                    type="date"
                    size="small"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                  <TextField
                    label="Fecha fin"
                    type="date"
                    size="small"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Stack>

                {selectedPlan && (
                  <Box sx={{ p: 2, background: (theme) => theme.palette.mode === "dark" ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)", borderRadius: 1.5, border: 1, borderColor: "divider" }}>
                    <Typography variant="caption" color="primary.main" fontWeight={600}>
                      PLAN: {selectedPlan.name}
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1 }}>
                      {selectedPlan.stats && <Chip label="Estadísticas" size="small" color="primary" variant="outlined" />}
                      {selectedPlan.classes && <Chip label="Clases" size="small" color="primary" variant="outlined" />}
                      {selectedPlan.services && <Chip label="Servicios" size="small" color="primary" variant="outlined" />}
                      {selectedPlan.appointments && <Chip label="Turnos" size="small" color="primary" variant="outlined" />}
                      {selectedPlan.portal && <Chip label="Portal" size="small" color="primary" variant="outlined" />}
                      {selectedPlan.settings && <Chip label="Config" size="small" color="primary" variant="outlined" />}
                    </Box>
                  </Box>
                )}

                <Button
                  variant="contained"
                  onClick={handleAssignPlan}
                  disabled={isUpdating || !selectedPlanId}
                  fullWidth
                  size="large"
                >
                  {isUpdating ? (
                    <CircularProgress size={22} color="inherit" />
                  ) : currentSuscription ? (
                    "Actualizar Suscripción"
                  ) : (
                    "Asignar Plan"
                  )}
                </Button>
              </Stack>
            </>
          )}
        </Paper>
      </Box>
    </Box>
  )
}
