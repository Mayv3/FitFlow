'use client'

import { useEffect, useRef, useState } from 'react'
import {
    Box,
    Button,
    Card,
    CardContent,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Stack,
    TextField,
    Typography,
    Alert,
    CircularProgress,
    Divider,
    Chip,
    Grow,
    Zoom,
} from '@mui/material'


import { useTheme, alpha } from '@mui/material/styles'
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter'
import Cookies from 'js-cookie'
import { useMutation } from '@tanstack/react-query'
import axios, { AxiosError } from 'axios'

type RegistrarPayload = { DNI: string }

type Summary = {
    alumno: { id: string; nombre: string; email: string; dni: string }
    plan: {
        id: number | null
        nombre: string
        clases_pagadas: number
        clases_realizadas: number
        clases_restantes: number
        progreso_pct: number
    }
    vencimiento: string | null
    gym_id: string
}

type RegistrarResponse = {
    message: string
    asistencia: Asistencia
    summary: Summary
}

type Asistencia = {
    id: string
    fecha: string
    hora: string
    alumno_id: string
    plan_id: string | null
    gym_id: string
}

const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—"
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return "—"
    return date.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    })
}

export default function Assists() {
    const theme = useTheme()
    const [dni, setDni] = useState('')
    const [openModal, setOpenModal] = useState(false)
    const [asistencia, setAsistencia] = useState<Asistencia | null>(null)
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const [summary, setSummary] = useState<Summary | null>(null)

    const daysLeft = (dateStr?: string | null) => {
        if (!dateStr) return null
        const end = new Date(`${dateStr}T00:00:00`)
        const now = new Date()
        return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    }

    const dleft = daysLeft(summary?.vencimiento)
    const pct = summary?.plan.progreso_pct ?? 0

    const barSx = {
        height: 12,
        borderRadius: 6,
        bgcolor: alpha(theme.palette.primary.main, 0.08),
        '& .MuiLinearProgress-bar': {
            borderRadius: 6,
            backgroundColor:
                pct >= 60
                    ? theme.palette.success.main
                    : pct >= 30
                        ? theme.palette.warning.main
                        : theme.palette.error.main,
        },
    }

    const statusChip = (() => {
        if (dleft === null) return <Chip size="small" label="Sin vencimiento" variant="outlined" />
        if (dleft <= 0) return <Chip size="small" color="error" label="Vencido" />
        if (dleft <= 7) return <Chip size="small" color="warning" label={`Por vencer (${dleft} días)`} />
        return <Chip size="small" color="success" label={`Activo (${dleft} días)`} />
    })()

    const registrarAsistencia = useMutation<RegistrarResponse, Error, RegistrarPayload>({
        mutationFn: async (payload) => {
            setIsLoading(true);
            try {
                const token = Cookies.get('token')
                const { data } = await axios.post(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/asistencias`,
                    payload,
                    { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
                )
                return data
            } catch (e) {
                const err = e as AxiosError<any>
                const msg =
                    err.response?.data?.error ||
                    err.response?.data?.message ||
                    err.message ||
                    'Error desconocido'
                throw new Error(msg)
            } finally {
                setIsLoading(false);
            }
        },
        onSuccess: (data) => {
            setAsistencia(data.asistencia)
            setSummary(data.summary)
            setOpenModal(true)
            setErrorMsg(null)
            setDni('')
            setTimeout(() => inputRef.current?.focus(), 0)
        },
        onError: (err) => {
            setErrorMsg(err.message || 'No se pudo registrar la asistencia')
        },
    })
    const closeModal = () => {
        setOpenModal(false)
        setTimeout(() => {
            const input = inputRef.current
            if (input) {
                input.focus()
                input.select()
            }
        }, 250)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const trimmed = dni.trim()
        if (!trimmed) {
            setErrorMsg('Ingresá un DNI')
            return
        }
        setErrorMsg(null)
        registrarAsistencia.mutate({ DNI: trimmed })
    }

    useEffect(() => {
        inputRef.current?.focus()
    }, [])


    useEffect(() => {
        if (!openModal) return
        const t = setTimeout(closeModal, 4000)
        return () => clearTimeout(t)
    }, [openModal])

    useEffect(() => {
        if (!openModal) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault()
                closeModal()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [openModal])

    useEffect(() => {
        if (!errorMsg) return
        const t = setTimeout(() => setErrorMsg(null), 3000)
        return () => clearTimeout(t)
    }, [errorMsg])

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            height: '100%',
            justifyContent: 'center',
            flexGrow: 1,
        }}>
            <Stack direction="row" alignItems="center" gap={1} mb={2} justifyContent="center">
                <AssignmentTurnedInIcon color="action" />
                <Typography variant="h5" fontWeight={700}>
                    Registrar asistencia
                </Typography>
            </Stack>

            {errorMsg && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMsg(null)}>
                    {errorMsg}
                </Alert>
            )}

            <Card
                variant="outlined"
                sx={{
                    width: { xs: '100%', sm: 500, md: 600 },
                    borderRadius: 2,
                    boxShadow: '0 8px 24px rgba(0,0,0,.08)',
                    borderColor: alpha(theme.palette.primary.main, 0.16),
                    backdropFilter: 'blur(4px)',
                }}
            >
                <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                    <form onSubmit={handleSubmit}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
                            <TextField
                                inputRef={inputRef}
                                type='text'
                                label="DNI del alumno"
                                placeholder="Ej: 12345678"
                                value={dni}
                                inputProps={{
                                    inputMode: 'numeric',
                                    pattern: '[0-9]*',
                                }}
                                onChange={(e) => {
                                    const val = e.target.value
                                    if (/^[0-9]*$/.test(val)) {
                                        setDni(val.slice(0, 9))
                                    }
                                }}
                                onFocus={(e) => e.currentTarget.select()}
                                fullWidth

                            />
                            <Button
                                type="submit"
                                variant="contained"
                                size="large"
                                disabled={isLoading}
                                startIcon={
                                    isLoading ? <CircularProgress size={18} /> : undefined
                                }
                                sx={{
                                    minWidth: 160,
                                    borderRadius: 999,
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    boxShadow: 'none',
                                }}
                            >
                                {isLoading ? 'Registrando…' : 'Registrar'}
                            </Button>
                        </Stack>
                    </form>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="body2" color="text.secondary" textAlign="center">
                        Tip: pasá el lector/teclado, presioná Enter para confirmar y seguí con el próximo DNI.
                    </Typography>
                </CardContent>
            </Card>

            <Dialog
                open={openModal}
                onClose={closeModal}
                TransitionComponent={Grow}
                keepMounted
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 5,
                        overflow: "hidden",
                        bgcolor: theme.palette.background.paper,
                        boxShadow: "0 12px 48px rgba(0,0,0,0.3)",
                        textAlign: "center",
                        backdropFilter: "blur(8px)",
                        transition: "all 0.3s ease",
                        p: { xs: 3, md: 4 },
                    },
                }}
            >
                <DialogTitle
                    component={Box}
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 1,
                        pb: 0,
                        pt: 2,
                    }}
                >
                    {/* Animación de entrada del ícono */}
                    <Zoom in={openModal} timeout={400}>
                        <Box>
                            {dleft && dleft > 0 && (summary?.plan?.clases_restantes ?? 0) > 0 ? (
                                <CheckCircleIcon
                                    sx={{
                                        fontSize: 88,
                                        color: theme.palette.success.main,
                                        mb: 1,
                                        filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.15))",
                                    }}
                                />
                            ) : (
                                <CancelIcon
                                    sx={{
                                        fontSize: 88,
                                        color: theme.palette.error.main,
                                        mb: 1,
                                        filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.15))",
                                    }}
                                />
                            )}
                        </Box>
                    </Zoom>

                    {/* Texto principal */}
                    <Typography
                        variant="h4"
                        fontWeight={800}
                        sx={{
                            color:
                                dleft && dleft > 0 && (summary?.plan?.clases_restantes ?? 0) > 0
                                    ? theme.palette.success.dark
                                    : theme.palette.error.dark,
                            mt: 0.5,
                        }}
                    >
                        {dleft && dleft > 0 && (summary?.plan?.clases_restantes ?? 0) > 0
                            ? `¡Bienvenido ${summary?.alumno?.nombre || ""}!`
                            : "Acceso Denegado"}
                    </Typography>
                </DialogTitle>

                <DialogContent
                    sx={{
                        mt: 3,
                        px: 5,
                        pb: 4,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 2.5,
                    }}
                >
                    <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="center"
                        gap={1.5}
                        sx={{
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            borderRadius: 3,
                            px: 3,
                            py: 1.2,
                            minWidth: 280,
                        }}
                    >
                        <FitnessCenterIcon sx={{ fontSize: 28, color: theme.palette.primary.main }} />
                        <Typography
                            variant="h5"
                            fontWeight={800}
                            sx={{
                                color: theme.palette.text.primary,
                                letterSpacing: 0.3,
                            }}
                        >
                            {summary?.plan?.nombre ?? "—"}
                        </Typography>
                    </Stack>

                    <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="center"
                        gap={1.5}
                        sx={{
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            borderRadius: 3,
                            px: 3,
                            py: 1.2,
                            minWidth: 280,
                        }}
                    >
                        <CalendarMonthIcon sx={{ fontSize: 28, color: theme.palette.primary.main }} />
                        <Typography
                            variant="h5"
                            fontWeight={700}
                            sx={{
                                color: theme.palette.text.primary,
                            }}
                        >
                            Vence: {formatDate(summary?.vencimiento)}
                        </Typography>
                    </Stack>

                    <Typography
                        variant="h4"
                        fontWeight={900}
                        sx={{
                            mt: 1,
                            color: theme.palette.primary.main,
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            px: 5,
                            py: 1.5,
                            borderRadius: 2,
                            letterSpacing: 0.5,
                        }}
                    >
                        {`Clases restantes: ${summary?.plan?.clases_restantes ?? 0}`}
                    </Typography>
                </DialogContent>

                <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
                    <Button
                        onClick={closeModal}
                        variant="contained"
                        size="large"
                        sx={{
                            px: 5,
                            py: 1.4,
                            borderRadius: 999,
                            textTransform: "none",
                            fontSize: 17,
                            fontWeight: 700,
                            boxShadow: "0 3px 8px rgba(0,0,0,0.25)",
                            background:
                                dleft && dleft > 0 && (summary?.plan?.clases_restantes ?? 0) > 0
                                    ? `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`
                                    : `linear-gradient(90deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`,
                        }}
                    >
                        Aceptar
                    </Button>
                </DialogActions>
            </Dialog>



        </Box>
    )
}
