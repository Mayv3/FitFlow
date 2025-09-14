"use client"

import { useState } from "react"
import axios from "axios"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"
import { useUser } from "@/context/UserContext"
import { FormEnterToTab } from "@/components/ui/tables/FormEnterToTab"
import { ADMINISTRADOR, RECEPCIONISTA, OWNER, SOCIO } from "@/const/roles/roles"
import { TextField, Button, Typography, Paper, Box, CircularProgress } from "@mui/material"

const LoginPage = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const { setUser } = useUser()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage("")

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Por favor completá todos los campos.")
      return
    }

    try {
      setLoading(true)

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/login`,
        { email, password }
      )

      const { session, profile } = res.data

      Cookies.set("id", String(profile.id))
      Cookies.set("token", session.access_token)
      Cookies.set("dni", String(profile.dni))
      Cookies.set("rol", String(profile.role_id))
      Cookies.set("gym_id", profile.gym_id)
      Cookies.set("name", String(profile.name))
      
      if (profile?.gyms?.name) Cookies.set("gym_name", String(profile.gyms.name))

      try {
        const { data: gym } = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/gyms/${profile.gym_id}?include_settings=true`,
          { headers: { Authorization: `Bearer ${session.access_token}` } }
        )

        localStorage.setItem("gym_settings", JSON.stringify(gym?.settings || {}))
        localStorage.setItem("gym_logo_url", gym?.logo_url || "")

        window.dispatchEvent(new Event("gym-settings-updated"))
      } catch (e) {
        console.warn("No se pudieron cargar los settings del gimnasio:", e)
        localStorage.removeItem("gym_settings")
        localStorage.removeItem("gym_logo_url")
      }

      setUser({
        id: profile.auth_user_id,
        dni: profile.dni,
        role_id: profile.role_id,
        gym_id: profile.gym_id,
      })

      if (profile.role_id === ADMINISTRADOR) {
        router.push("/dashboard/administrator/stats")
      } else if (profile.role_id === RECEPCIONISTA) {
        router.push("/dashboard/receptionist/members")
      } else if (profile.role_id === SOCIO) {
        router.push("/dashboard/member")
      } else if (profile.role_id === OWNER || profile.role_id === 1) {
        router.push("/dashboard/owner/register")
      } else {
        // fallback
        router.push("/")
      }
    } catch (err: any) {
      console.error("Error en login:", err)
      setErrorMessage(err.response?.data?.error || "DNI o contraseña incorrectos.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        height: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: (theme) => theme.palette.background.default,
        p: 2,
      }}
    >
      <Paper
        elevation={10}
        sx={{
          p: 4,
          maxWidth: 400,
          width: "100%",
          backgroundColor: (theme) => theme.palette.background.paper,
          color: (theme) => theme.palette.text.primary,
        }}
      >
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Ingresar al sistema
        </Typography>

        <FormEnterToTab>
          <TextField
            label="Email"
            variant="outlined"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            autoComplete="username"
          />

          <TextField
            fullWidth
            label="Contraseña"
            type="password"
            variant="outlined"
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Ingresar"}
          </Button>

          {errorMessage && (
            <Typography
              variant="body2"
              color="error"
              sx={{ mt: 2, textAlign: "center", fontWeight: 500 }}
            >
              {errorMessage}
            </Typography>
          )}
        </FormEnterToTab>
      </Paper>
    </Box>
  )
}

export default LoginPage
