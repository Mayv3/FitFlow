"use client"

import { useState } from "react"
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Stack,
  Chip,
  CircularProgress,
  Switch,
  FormControlLabel,
} from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import BusinessIcon from "@mui/icons-material/Business"
import {
  useGymPlans,
  useCreateGymPlan,
  useUpdateGymPlan,
  useDeleteGymPlan,
} from "@/hooks/gymPlans/useGymPlans"

interface PlanFormData {
  name: string
  max_alumnos: string
  stats: boolean
  classes: boolean
  services: boolean
  appointments: boolean
  portal: boolean
  settings: boolean
}

const initialFormData: PlanFormData = {
  name: "",
  max_alumnos: "100",
  stats: true,
  classes: true,
  services: true,
  appointments: true,
  portal: true,
  settings: true,
}

export function ManageGymPlans() {
  const { data: planes = [], isLoading } = useGymPlans()
  const createMutation = useCreateGymPlan()
  const updateMutation = useUpdateGymPlan()
  const deleteMutation = useDeleteGymPlan()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<PlanFormData>(initialFormData)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  const handleOpenDialog = (plan?: any) => {
    if (plan) {
      setEditingId(plan.id)
      setFormData({
        name: plan.name,
        max_alumnos: plan.max_alumnos?.toString() || "100",
        stats: plan.stats,
        classes: plan.classes,
        services: plan.services,
        appointments: plan.appointments,
        portal: plan.portal,
        settings: plan.settings,
      })
    } else {
      setEditingId(null)
      setFormData(initialFormData)
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingId(null)
    setFormData(initialFormData)
  }

  const handleSubmit = async () => {
    const planData = {
      name: formData.name.trim(),
      max_alumnos: parseInt(formData.max_alumnos),
      stats: formData.stats,
      classes: formData.classes,
      services: formData.services,
      appointments: formData.appointments,
      portal: formData.portal,
      settings: formData.settings,
    }

    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, ...planData })
    } else {
      await createMutation.mutateAsync(planData)
    }

    handleCloseDialog()
  }

  const handleDelete = async (id: number) => {
    await deleteMutation.mutateAsync(id)
    setDeleteConfirmId(null)
  }

  const getFeatureChips = (plan: any) => {
    const features = []
    if (plan.stats) features.push("Estadísticas")
    if (plan.classes) features.push("Clases")
    if (plan.services) features.push("Servicios")
    if (plan.appointments) features.push("Turnos")
    if (plan.portal) features.push("Portal")
    if (plan.settings) features.push("Configuración")
    return features
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Box>
          <Typography variant="h5" fontWeight={600}>Planes de Suscripción</Typography>
          <Typography variant="body2" color="text.secondary">
            Define los planes disponibles para los gimnasios.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nuevo Plan
        </Button>
      </Box>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : planes.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <BusinessIcon sx={{ fontSize: 60, color: "text.secondary", mb: 2 }} />
          <Typography color="text.secondary">
            No hay planes creados aún. ¡Crea tu primer plan de suscripción!
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
          {planes.map((plan: any) => (
            <Box key={plan.id}>
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  height: "100%",
                  minHeight: 320,
                  display: "flex",
                  flexDirection: "column",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1.5,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: 8,
                    transform: 'translateY(-4px)',
                  }
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
                  <Typography variant="h5" fontWeight="bold" sx={{ flex: 1 }}>
                    {plan.name}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenDialog(plan)}
                      sx={{ 
                        bgcolor: 'primary.lighter',
                        '&:hover': { bgcolor: 'primary.light' }
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleteConfirmId(plan.id)}
                      sx={{ 
                        bgcolor: 'error.lighter',
                        '&:hover': { bgcolor: 'error.light' }
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                <Chip
                  label={`Hasta ${plan.max_alumnos} alumnos`}
                  size="medium"
                  color="primary"
                  sx={{ 
                    mb: 3, 
                    width: "fit-content",
                    fontWeight: 600,
                    py: 2.5
                  }}
                />

                <Typography variant="subtitle1" fontWeight={600} color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                  Funcionalidades incluidas:
                </Typography>
                
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 'auto' }}>
                  {getFeatureChips(plan).map((feature) => (
                    <Chip
                      key={feature}
                      label={feature}
                      size="medium"
                      variant="outlined"
                      color="success"
                      sx={{ fontWeight: 500, width: '100%', justifyContent: 'flex-start' }}
                    />
                  ))}
                </Box>
              </Paper>
            </Box>
          ))}
        </Box>
      )}

      {/* Dialog Crear/Editar */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingId ? "Editar Plan de Suscripción" : "Crear Nuevo Plan de Suscripción"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Nombre del Plan"
              fullWidth
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              helperText="Ej: Plan Básico, Plan Premium, Plan Enterprise"
            />

            <TextField
              label="Máximo de Alumnos"
              fullWidth
              required
              type="number"
              value={formData.max_alumnos}
              onChange={(e) => setFormData({ ...formData, max_alumnos: e.target.value })}
              helperText="Número máximo de alumnos permitidos en el gimnasio"
            />

            <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2 }}>
              Funcionalidades Incluidas
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.stats}
                    onChange={(e) => setFormData({ ...formData, stats: e.target.checked })}
                  />
                }
                label="Estadísticas"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.classes}
                    onChange={(e) => setFormData({ ...formData, classes: e.target.checked })}
                  />
                }
                label="Gestión de Clases"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.services}
                    onChange={(e) => setFormData({ ...formData, services: e.target.checked })}
                  />
                }
                label="Servicios"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.appointments}
                    onChange={(e) => setFormData({ ...formData, appointments: e.target.checked })}
                  />
                }
                label="Sistema de Turnos"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.portal}
                    onChange={(e) => setFormData({ ...formData, portal: e.target.checked })}
                  />
                }
                label="Portal de Alumnos"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.settings}
                    onChange={(e) => setFormData({ ...formData, settings: e.target.checked })}
                  />
                }
                label="Configuración Avanzada"
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={
              !formData.name.trim() ||
              !formData.max_alumnos ||
              createMutation.isPending ||
              updateMutation.isPending
            }
          >
            {createMutation.isPending || updateMutation.isPending ? (
              <CircularProgress size={24} />
            ) : editingId ? (
              "Actualizar"
            ) : (
              "Crear"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Confirmar Eliminación */}
      <Dialog
        open={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>¿Eliminar Plan?</DialogTitle>
        <DialogContent>
          <Typography>
            Esta acción no se puede deshacer. ¿Estás seguro de que deseas eliminar este plan de suscripción?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmId(null)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => handleDelete(deleteConfirmId!)}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? <CircularProgress size={24} /> : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
