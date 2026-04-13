"use client"

import { useState } from "react"
import {
  Box,
  Paper,
  Typography,
  Switch,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Divider,
} from "@mui/material"
import WhatsAppIcon from "@mui/icons-material/WhatsApp"
import SaveIcon from "@mui/icons-material/Save"
import { useListGyms, useUpdateGymWhatsapp } from "@/hooks/gyms/useGyms"

interface GymWhatsappForm {
  whatsapp_enabled: boolean
  evolution_instance_name: string
  evolution_api_url: string
}

export default function WhatsappPage() {
  const { data: gyms, isLoading, error } = useListGyms()
  const updateWhatsapp = useUpdateGymWhatsapp()

  const [forms, setForms] = useState<Record<string, GymWhatsappForm>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  const getForm = (gym: { id: string; whatsapp_enabled: boolean; evolution_instance_name: string | null; evolution_api_url: string | null }): GymWhatsappForm => {
    return forms[gym.id] ?? {
      whatsapp_enabled: gym.whatsapp_enabled ?? false,
      evolution_instance_name: gym.evolution_instance_name ?? "",
      evolution_api_url: gym.evolution_api_url ?? "",
    }
  }

  const updateForm = (gymId: string, field: keyof GymWhatsappForm, value: string | boolean) => {
    setForms(prev => ({
      ...prev,
      [gymId]: { ...getForm(gyms!.find(g => g.id === gymId)!), ...prev[gymId], [field]: value },
    }))
    setSaved(prev => ({ ...prev, [gymId]: false }))
  }

  const handleSave = async (gymId: string) => {
    const form = forms[gymId]
    if (!form) return
    await updateWhatsapp.mutateAsync({
      id: gymId,
      whatsapp_enabled: form.whatsapp_enabled,
      evolution_instance_name: form.evolution_instance_name || undefined,
      evolution_api_url: form.evolution_api_url || undefined,
    })
    setSaved(prev => ({ ...prev, [gymId]: true }))
  }

  return (
    <Box sx={{ maxWidth: 900, mx: "auto" }}>
      <Paper
        elevation={0}
        sx={{ mb: 3, p: 3, backgroundColor: "#0dc985", borderRadius: 1.5 }}
      >
        <Typography variant="h4" fontWeight={700} color="white" gutterBottom>
          Automatización WhatsApp
        </Typography>
        <Typography variant="body1" color="white">
          Habilitá el envío automático de recordatorios de vencimiento por WhatsApp para cada gimnasio.
        </Typography>
      </Paper>

      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error al cargar gimnasios
        </Alert>
      )}

      {gyms?.map((gym) => {
        const form = getForm(gym)
        const isSaving = updateWhatsapp.isPending
        const wasSaved = saved[gym.id]

        return (
          <Paper key={gym.id} sx={{ mb: 2, p: 3, borderRadius: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                {gym.name}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <WhatsAppIcon sx={{ color: form.whatsapp_enabled ? "#25D366" : "text.disabled" }} />
                <Typography variant="body2" color="text.secondary">
                  {form.whatsapp_enabled ? "Habilitado" : "Deshabilitado"}
                </Typography>
                <Switch
                  checked={form.whatsapp_enabled}
                  onChange={(e) => updateForm(gym.id, "whatsapp_enabled", e.target.checked)}
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": { color: "#25D366" },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "#25D366" },
                  }}
                />
              </Box>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2, mb: 2 }}>
              <TextField
                label="Nombre de instancia Evolution"
                placeholder="ej: gym-crossfit-centro"
                value={form.evolution_instance_name}
                onChange={(e) => updateForm(gym.id, "evolution_instance_name", e.target.value)}
                size="small"
                fullWidth
                helperText="Nombre único de la instancia en Evolution API"
              />
              <TextField
                label="URL de Evolution API"
                placeholder="ej: https://evo.miservidor.com"
                value={form.evolution_api_url}
                onChange={(e) => updateForm(gym.id, "evolution_api_url", e.target.value)}
                size="small"
                fullWidth
                helperText="URL donde está corriendo Evolution API"
              />
            </Box>

            <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 2 }}>
              {wasSaved && (
                <Typography variant="body2" color="success.main">
                  Guardado
                </Typography>
              )}
              <Button
                variant="contained"
                startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                onClick={() => handleSave(gym.id)}
                disabled={isSaving || !forms[gym.id]}
                sx={{ backgroundColor: "#0dc985", "&:hover": { backgroundColor: "#0ab374" } }}
              >
                Guardar
              </Button>
            </Box>
          </Paper>
        )
      })}
    </Box>
  )
}
