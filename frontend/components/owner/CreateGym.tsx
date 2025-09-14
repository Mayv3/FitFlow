"use client"

import { useState } from "react"
import axios from "axios"
import Cookies from "js-cookie"
import {
  Box,
  Paper,
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
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Crea tu gimnasio</Typography>
      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

      <TextField
        label="Nombre del Gimnasio"
        fullWidth
        margin="normal"
        value={gymName}
        onChange={(e) => setGymName(e.target.value)}
      />

      <TextField
        label="Logo URL (opcional)"
        fullWidth
        margin="normal"
        helperText="Si lo dejás vacío y está habilitado, se genera con el color primario"
        value={logoUrl}
        onChange={(e) => setLogoUrl(e.target.value)}
      />

      <Divider sx={{ my: 2 }} />

      <GymThemeEditor value={themeSettings ?? undefined} onChange={setThemeSettings} />

      <Box sx={{ mt: 3, textAlign: "right" }}>
        <Button variant="contained" onClick={handleCreate} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : "Crear gimnasio"}
        </Button>
      </Box>

      {createdGymId && (
        <Typography sx={{ mt: 2 }} color="success.main">
          Gimnasio creado con éxito (ID: {createdGymId})
        </Typography>
      )}
    </Paper>
  )
}
