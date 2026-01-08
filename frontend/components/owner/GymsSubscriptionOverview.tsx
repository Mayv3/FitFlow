"use client"

import { useEffect, useState } from "react"
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Grid,
  CircularProgress,
} from "@mui/material"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import CancelIcon from "@mui/icons-material/Cancel"
import Cookies from 'js-cookie'

interface GymSubscription {
  gym_id: string
  gimnasio: string
  plan: string | null
  max_alumnos: number | null
  alumnos_actuales: number
  suscripcion_activa: boolean
  start_at: string | null
  end_at: string | null
}

export function GymsSubscriptionOverview() {
  const [data, setData] = useState<GymSubscription[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const token = Cookies.get('token')

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/gyms/owner/gyms/subscriptions/overview`,
          { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
        )

        const json = await res.json()
        setData(json)
      } catch (err) {
        console.error("Error loading subscriptions overview", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Grid container spacing={2}>
      {data.map((g) => {
        const percent =
          g.max_alumnos && g.max_alumnos > 0
            ? Math.min(
              Math.round((g.alumnos_actuales / g.max_alumnos) * 100),
              100
            )
            : 0

        return (
          <Grid item xs={12} md={6} key={g.gym_id}>
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  mb={1}
                >
                  <Typography fontWeight={600}>
                    {g.gimnasio}
                  </Typography>

                  <Chip
                    size="small"
                    icon={
                      g.suscripcion_activa ? (
                        <CheckCircleIcon />
                      ) : (
                        <CancelIcon />
                      )
                    }
                    label={
                      g.suscripcion_activa
                        ? "Activa"
                        : "Inactiva"
                    }
                    color={
                      g.suscripcion_activa
                        ? "success"
                        : "default"
                    }
                  />
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  mb={1}
                >
                  Plan: {g.plan ?? "Sin plan"}
                </Typography>

                <Typography variant="body2" mb={0.5}>
                  Alumnos:{" "}
                  <strong>
                    {g.alumnos_actuales}
                    {g.max_alumnos
                      ? ` / ${g.max_alumnos}`
                      : ""}
                  </strong>
                </Typography>

                {g.max_alumnos && (
                  <LinearProgress
                    variant="determinate"
                    value={percent}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      mt: 0.5,
                    }}
                  />
                )}

                {g.max_alumnos && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Uso del plan: {percent}%
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        )
      })}
    </Grid>
  )
}
