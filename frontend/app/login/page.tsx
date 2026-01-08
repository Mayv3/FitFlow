"use client"

import { useState } from "react"
import axios from "axios"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"
import { useUser } from "@/context/UserContext"
import { FormEnterToTab } from "@/components/ui/tables/FormEnterToTab"
import { ADMINISTRADOR, RECEPCIONISTA, OWNER, SOCIO } from "@/const/roles/roles"
import {
  TextField,
  Button,
  Typography,
  Paper,
  Box,
  CircularProgress,
  InputAdornment,
  IconButton,
  useTheme,
} from "@mui/material"
import Link from "next/link"
import { Visibility, VisibilityOff } from "@mui/icons-material"
import Image from "next/image"

const LoginPage = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const { setUser } = useUser()
  const theme = useTheme()

  const handleToggle = () => setShowPassword((prev) => !prev)

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
      Cookies.set("email", String(session.user.email))
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
        router.push("/dashboard/administrator/members")
      } else if (profile.role_id === RECEPCIONISTA) {
        router.push("/dashboard/receptionist/members")
      } else if (profile.role_id === SOCIO) {
        router.push("/dashboard/member")
      } else if (profile.role_id === OWNER || profile.role_id === 1) {
        router.push("/dashboard/owner/register")
      } else {
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
        backgroundColor: theme.palette.background.default,
        p: 2,
      }}
    >
      <Paper
        elevation={10}
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          maxWidth: 1100,
          width: { xs: "95%", md: "100%" },
          height: { xs: 500, md: 600 },
          overflow: "hidden",
          borderRadius: 1,
        }}
      >
        <Box
          sx={{
            flex: { xs: 0.6, sm: 0.8, md: 1 },
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            justifyContent: "center",
            p: 0,
          }}
        >
          <Image
            src="/images/login-illustrations.jpg"
            alt="login illustration"
            width={200}
            height={200}
            style={{
              objectFit: "cover",
              width: "100%",
              height: "auto",
              userSelect: "none",
              pointerEvents: "none",
              // @ts-ignore
              WebkitUserDrag: "none",
            } as React.CSSProperties & { WebkitUserDrag?: string }}
            draggable={false}
            priority
          />
        </Box>

        <Box
          sx={{
            flex: 1,
            p: { xs: 3, md: 5 },
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >

          <div className="flex justify-center mb-5">
            <Image
              src="/images/icon.png"
              alt="login illustration"
              width={100}
              height={100}
              style={{
                objectFit: "cover",
                userSelect: "none",
                pointerEvents: "none",
                // @ts-ignore
                WebkitUserDrag: "none",
              } as React.CSSProperties & { WebkitUserDrag?: string }}
              draggable={false}
              priority
            />
          </div>

          <Typography variant="h4" sx={{ fontWeight: 700, color: '#2ECC71', textAlign: "center" }}>
            Fitness Flow
          </Typography>
          <FormEnterToTab onSubmit={handleLogin}>
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
              type={showPassword ? "text" : "password"}
              variant="outlined"
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleToggle} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{ 
                mt: 2, 
                py: 1.2, 
                fontWeight: 600,
                bgcolor: '#2ECC71',
                '&:hover': {
                  bgcolor: '#27AE60'
                }
              }}
              disabled={loading || !email.trim() || !password.trim()}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Ingresar"}
            </Button>

            <Box sx={{ mt: 2, textAlign: "center" }}>
              <Link href="/forgot-password" style={{ color: '#2ECC71', fontWeight: 500 }}>
                ¿Olvidaste tu contraseña?
              </Link>
            </Box>

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
        </Box>
      </Paper>
    </Box>
  )
}

export default LoginPage
