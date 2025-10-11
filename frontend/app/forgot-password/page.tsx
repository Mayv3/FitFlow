"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import {
  TextField,
  Button,
  Typography,
  Paper,
  Box,
  CircularProgress,
} from "@mui/material"
import SendIcon from "@mui/icons-material/Send"

import { notify } from "@/lib/toast"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0) // segundos restantes

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => (prev > 0 ? prev - 1 : 0))
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [cooldown])

  const handleSubmit = async () => {
    if (!isValidEmail(email)) {
      notify.error("Ingresá un email válido")
      return
    }

    try {
      setLoading(true)
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/forgot-password`,
        { email }
      )
      notify.success(
        res.data.message ||
          "Si el correo existe, te llegará un link de recuperación"
      )
      setCooldown(30) // ⏳ inicia cooldown de 30s
    } catch (err: any) {
      notify.error(
        err.response?.data?.error || "Error al enviar el correo de recuperación"
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: (theme) => theme.palette.background.default,
        p: 2,
      }}
    >
      <Paper
        sx={{ p: 4, maxWidth: 400, width: "100%", textAlign: "center" }}
        elevation={10}
      >
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Recuperar contraseña
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
          Ingresá tu correo y te enviaremos un enlace para restablecer tu
          contraseña.
        </Typography>

        <TextField
          label="Email"
          type="email"
          fullWidth
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Button
          fullWidth
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={loading || cooldown > 0 || !isValidEmail(email)}
          startIcon={!loading ? <SendIcon /> : null}
          sx={{ mt: 2 }}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : cooldown > 0 ? (
            `Reintentar en ${cooldown}s`
          ) : (
            "Enviar enlace"
          )}
        </Button>
      </Paper>
    </Box>
  )
}
