// 📁 frontend/app/register/page.tsx
"use client"

import { useState } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material"

const steps = ["Crear Gimnasio", "Crear Usuario Dueño"]

export default function RegisterPage() {
  const [activeStep, setActiveStep] = useState(0)
  const [gymName, setGymName] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [settings, setSettings] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [dni, setDni] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [newGymId, setNewGymId] = useState("")
  const router = useRouter()

  const handleNext = async () => {
    setErrorMessage("")
    if (activeStep === 0) {
      if (!gymName.trim()) {
        setErrorMessage("El nombre del gimnasio es requerido.")
        return
      }
      setLoading(true)
      try {
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/gyms`,
          { name: gymName, logo_url: logoUrl || null, settings: settings ? JSON.parse(settings) : null },
          { headers: { Authorization: `Bearer ${Cookies.get("token")}` } }
        )
        setNewGymId(res.data.id)
        setActiveStep(1)
      } catch (err: any) {
        setErrorMessage(err.response?.data?.error || "Error al crear gimnasio.")
      } finally {
        setLoading(false)
      }
    } else if (activeStep === 1) {
      if (!email.trim() || !password.trim() || !dni.trim()) {
        setErrorMessage("Todos los campos de usuario son obligatorios.")
        return
      }
      setLoading(true)
      try {
        await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/register`,
          { email, password, dni: Number(dni), gym_id: newGymId, role_id: 2 },
          { headers: { Authorization: `Bearer ${Cookies.get("token")}` } }
        )
        router.push("/login")
      } catch (err: any) {
        setErrorMessage(err.response?.data?.error || "Error al crear usuario.")
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <Box sx={{ p: 2, maxWidth: 600, margin: 'auto' }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Registro Inicial
        </Typography>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {errorMessage && (
          <Typography color="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Typography>
        )}

        {activeStep === 0 && (
          <Box>
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
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
            />
            <TextField
              label="Settings (JSON opcional)"
              fullWidth
              margin="normal"
              multiline
              rows={3}
              value={settings}
              onChange={(e) => setSettings(e.target.value)}
            />
          </Box>
        )}

        {activeStep === 1 && (
          <Box>
            <TextField
              label="Email (dueño)"
              type="email"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              label="Contraseña"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <TextField
              label="DNI (dueño)"
              fullWidth
              margin="normal"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
            />
          </Box>
        )}

        <Box sx={{ mt: 3, textAlign: 'right' }}>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : activeStep === steps.length - 1 ? 'Finalizar' : 'Siguiente'}
          </Button>
        </Box>
      </Paper>
    </Box>
  )
}