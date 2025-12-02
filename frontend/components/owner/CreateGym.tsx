"use client"

import { useState } from "react"
import axios from "axios"
import Cookies from "js-cookie"
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Divider,
} from "@mui/material"
import { GymThemeEditor, ThemeSettings } from "@/components/ui/gymThemeEditor/gymThemeEditor"

const initialsOf = (name: string) =>
  name.trim().split(/\s+/).map(p => p[0]).join("").slice(0, 2).toUpperCase()

const makeLogoUrl = (gymName: string, bg: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(initialsOf(gymName || "G"))}&background=${bg.replace("#", "")}&color=fff&bold=true&size=256&format=png`

type SettingsPayload = {
  colors: {
    primary: string
    secondary: string
    background: string
    paper: string
    textPrimary: string
    textSecondary: string
  }
  typography: { fontFamily: string }
  shape: { borderRadius: number }
}

function toSettingsPayload(ts: ThemeSettings): SettingsPayload {
  return {
    colors: {
      primary: ts.theme.palette.primary,
      secondary: ts.theme.palette.secondary,
      background: ts.theme.palette.background,
      paper: ts.theme.palette.surface,
      textPrimary: ts.theme.palette.text.primary,
      textSecondary: ts.theme.palette.text.secondary,
    },
    typography: { fontFamily: ts.theme.typography.fontFamily },
    shape: { borderRadius: ts.theme.shape.borderRadius },
  }
}

export function CreateGym() {
  const [gymName, setGymName] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [themeSettings, setThemeSettings] = useState<ThemeSettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [createdGymId, setCreatedGymId] = useState<string | null>(null)

  const handleCreate = async () => {
    setError("")
    if (!gymName.trim()) return setError("El nombre del gimnasio es requerido.")
    if (!themeSettings) return setError("Configurá el tema del gimnasio.")

    setLoading(true)
    try {
      const token = Cookies.get("token")
      const settingsPayload = toSettingsPayload(themeSettings)

      const finalLogo = logoUrl.trim()
        ? logoUrl.trim()
        : (themeSettings.theme.misc?.generateLogoFromPrimary
          ? makeLogoUrl(gymName, settingsPayload.colors.primary)
          : null)

      const payload = { name: gymName, logo_url: finalLogo, settings: settingsPayload }

      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/gyms`,
        payload,
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      )

      // Guardar el ID en cookies o en estado
      Cookies.set("last_created_gym_id", data.id, { expires: 1 })
      setCreatedGymId(data.id)   // 👈 lo guardamos local, sin redirigir
    } catch (e: any) {
      setError(e.response?.data?.error || "No se pudo crear el gimnasio")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Crear Nuevo Gimnasio
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configura el nombre, logo y tema visual de tu gimnasio.
      </Typography>

      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2, mb: 3 }}>
        <TextField
          label="Nombre del Gimnasio"
          fullWidth
          value={gymName}
          onChange={(e) => setGymName(e.target.value)}
          placeholder="Ej: PowerFit Gym"
        />
        <TextField
          label="Logo URL (opcional)"
          fullWidth
          helperText="Si lo dejás vacío, se genera automáticamente"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
        />
      </Box>

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Personalización del Tema
      </Typography>

      <GymThemeEditor value={themeSettings ?? undefined} onChange={setThemeSettings} />

      <Box sx={{ mt: 4, display: "flex", gap: 2, justifyContent: "flex-end", alignItems: "center" }}>
        {createdGymId && (
          <Typography color="success.main" sx={{ mr: 2 }}>
            ✓ Gimnasio creado (ID: {createdGymId})
          </Typography>
        )}
        <Button 
          variant="contained" 
          size="large"
          onClick={handleCreate} 
          disabled={loading}
          sx={{ px: 4 }}
        >
          {loading ? <CircularProgress size={24} /> : "Crear Gimnasio"}
        </Button>
      </Box>
    </Box>
  )
}
