"use client"

import {
  Box,
  Button,
  Typography,
  Paper,
  Card,
  CardContent,
  IconButton,
} from "@mui/material"
import { ThemeProvider, createTheme } from "@mui/material/styles"
import {
  People,
  AttachMoney,
  BarChart,
  Settings,
  CalendarToday,
  Person,
  Group,
  EventAvailable,
  Edit,
  Delete,
} from "@mui/icons-material"
import { StateCheap } from "@/components/ui/cheap/StateCheap"
import { ThemeSettings } from "@/components/ui/gymThemeEditor/gymThemeEditor"
import { createAppTheme, DEFAULT_SETTINGS } from "@/themeProvider/theme"

type Props = {
  settings?: ThemeSettings | null
}

export function ThemePreview({ settings }: Props) {
  const theme = settings
    ? createTheme({
      palette: {
        primary: { main: settings.theme.palette.primary },
        secondary: { main: settings.theme.palette.secondary },
        background: {
          default: settings.theme.palette.background,
          paper: settings.theme.palette.surface,
        },
        text: {
          primary: settings.theme.palette.text.primary,
          secondary: settings.theme.palette.text.secondary,
        },
      },
      typography: { fontFamily: settings.theme.typography.fontFamily },
      shape: { borderRadius: settings.theme.shape.borderRadius },
    })
    : createAppTheme()

  return (
    <Box
      sx={{
        display: "flex",
        height: 520,
        mt: 3,
        borderRadius: 2,
        overflow: "hidden",
        boxShadow: 3,
        position: 'relative'
      }}
    >
      <ThemeProvider theme={theme}>
        <Box
          sx={{
            bgcolor: "primary.main",
            display: "flex",
            flexDirection: { xs: "row", md: "column" },
            alignItems: "center",
            justifyContent: { xs: "space-around", md: "flex-start" },
            width: { xs: "100%", md: 70 },
            height: { xs: 70, md: "auto" },
            py: { xs: 0, md: 2 },
            gap: { xs: 0, md: 2 },
            position: { xs: "absolute", md: "static" },
            bottom: { xs: 0, md: "auto" },
            left: { xs: 0, md: "auto" },
          }}
        >
          <IconButton sx={{ color: "white" }}><BarChart /></IconButton>
          <IconButton sx={{ color: "white" }}><People /></IconButton>
          <IconButton sx={{ color: "white" }}><AttachMoney /></IconButton>
          <IconButton sx={{ color: "white" }}><CalendarToday /></IconButton>
          <IconButton sx={{ color: "white" }}><Settings /></IconButton>
        </Box>


        <Box sx={{ flex: 1, bgcolor: "background.default", p: { xs: 2, md: 3 } }}>
          <Box sx={{ display: "flex", justifyContent: "space-between",alignItems:'center', mb: 3, mx: { xs: 'auto' } }}>
            <Typography variant="h6" sx={{ color: "#11111" }}>
              Miembros
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="large"
              sx={{ color: "#fff" }}
            >
              + Añadir miembro
            </Button>
          </Box>

          <Paper variant="outlined" sx={{ mb: 3, borderRadius: 2, overflow: "hidden" }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr 1fr 1fr", md: "1fr 1fr 1fr 1fr" },
                p: 1,
                bgcolor: "background.paper",
                textAlign: "center",
                fontWeight: "bold",
              }}
            >
              <Typography variant="body2">Nombre</Typography>
              <Typography variant="body2">Plan</Typography>

              <Typography
                variant="body2"
                sx={{ display: { xs: "none", md: "block" } }}
              >
                Estado
              </Typography>

              <Typography variant="body2">Acciones</Typography>
            </Box>

            {[
              { nombre: "José", plan: "Pase Libre", code: "active", label: "Activo", daysDiff: 12 },
              { nombre: "Nico", plan: "Prueba", code: "expired", label: "Vencido", daysDiff: -3 },
              { nombre: "Lucía", plan: "Crossfit", code: "expiring", label: "Por vencer", daysDiff: 2 },
              { nombre: "Mariana", plan: "Funcional", code: "expired", label: "Vencido", daysDiff: -10 },
            ].map((alumno, i) => (
              <Box
                key={i}
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr 1fr 1fr", md: "1fr 1fr 1fr 1fr" },
                  p: 1,
                  borderTop: "1px solid #ddd",
                  alignItems: "center",
                  textAlign: "center",
                }}
              >
                <Typography variant="body2">{alumno.nombre}</Typography>
                <Typography variant="body2">{alumno.plan}</Typography>

                <Box sx={{ display: { xs: "none", md: "block" } }}>
                  <StateCheap
                    code={alumno.code as any}
                    label={alumno.label}
                    daysDiff={alumno.daysDiff}
                  />
                </Box>

                <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                  <IconButton color="primary" size="small"><Edit fontSize="small" /></IconButton>
                  <IconButton color="error" size="small"><Delete fontSize="small" /></IconButton>
                </Box>
              </Box>
            ))}
          </Paper>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 2 }}>
            <Card>
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Group color="primary" />
                <Box>
                  <Typography variant="body2" color="text.secondary">Miembros activos</Typography>
                  <Typography variant="h6">2 / 4 (50%)</Typography>
                </Box>
              </CardContent>
            </Card>
            <Card>
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <EventAvailable color="primary" />
                <Box>
                  <Typography variant="body2" color="text.secondary">Asistencias de hoy</Typography>
                  <Typography variant="h6">0 / 30</Typography>
                </Box>
              </CardContent>
            </Card>
            <Card>
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Person color="primary" />
                <Box>
                  <Typography variant="body2" color="text.secondary">Alumnos con plan</Typography>
                  <Typography variant="h6">4 / 4 (100%)</Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </ThemeProvider>
    </Box>
  )
}
