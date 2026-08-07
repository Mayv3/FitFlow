"use client"

import { useState } from "react"
import { useClientSnapshot } from "@/hooks/useClientSnapshot"
import { useRouter } from "next/navigation"
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  InputAdornment,
  IconButton,
} from "@mui/material"
import { api } from "@/lib/api"
import { Visibility, VisibilityOff } from "@mui/icons-material"
import { getApiErrorMessage } from "@/utils/errors/apiError"

function leerAccessTokenDelHash(): string {
  return new URLSearchParams(window.location.hash.substring(1)).get("access_token") ?? ""
}

const sinToken = () => ""

export default function ResetPasswordPage() {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  // El token llega en el fragmento de la URL (#access_token=...), que solo existe
  // en el cliente. useClientSnapshot lo lee sin provocar un render extra al montar.
  const accessToken = useClientSnapshot(leerAccessTokenDelHash, sinToken)
  const [showPassword, setShowPassword] = useState(false)
  const [showRepeatPassword, setShowRepeatPassword] = useState(false)

  const handleTogglePassword = () => setShowPassword((prev) => !prev)
  const handleToggleRepeatPassword = () => setShowRepeatPassword((prev) => !prev)

  const handleResetPassword = async () => {
    setMessage("")
    if (!newPassword.trim() || !repeatPassword.trim()) {
      setMessage("Completá todos los campos.")
      return
    }
    if (newPassword !== repeatPassword) {
      setMessage("Las contraseñas no coinciden.")
      return
    }

    try {
      setLoading(true)
      const res = await api.post(`/api/auth/reset-password`, {
        access_token: accessToken,
        newPassword,
      })

      setMessage(res.data.message || "Contraseña cambiada")
      setTimeout(() => router.push("/login"), 2000)
    } catch (err: unknown) {
      console.error("Error reset password:", err)
      setMessage(getApiErrorMessage(err) || "Error al cambiar la contraseña")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Paper sx={{ p: 4, maxWidth: 400, width: "100%", textAlign: "center" }} elevation={10}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Restablecer contraseña
        </Typography>

        <TextField
          label="Nueva contraseña"
          type={showPassword ? "text" : "password"}
          fullWidth
          margin="normal"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={handleTogglePassword} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        <TextField
          label="Repetir nueva contraseña"
          type={showRepeatPassword ? "text" : "password"}
          fullWidth
          margin="normal"
          value={repeatPassword}
          onChange={(e) => setRepeatPassword(e.target.value)}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={handleToggleRepeatPassword} edge="end">
                    {showRepeatPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 2 }}
          onClick={handleResetPassword}
          disabled={loading || !accessToken}
        >
          {loading ? <CircularProgress size={24} /> : "Cambiar contraseña"}
        </Button>

        {message && (
          <Typography sx={{ mt: 2, fontWeight: 500, color: message.includes("✅") ? "success.main" : "error.main" }}>
            {message}
          </Typography>
        )}
      </Paper>
    </Box>
  )
}
