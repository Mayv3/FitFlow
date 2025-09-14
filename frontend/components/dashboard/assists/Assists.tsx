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
    LinearProgress,
    Avatar,
    Fade,
    Grow,
    Zoom,
} from '@mui/material'
import { useTheme, alpha } from '@mui/material/styles'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'
import PersonIcon from '@mui/icons-material/Person'
import EmailIcon from '@mui/icons-material/Email'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter'
import Inventory2Icon from '@mui/icons-material/Inventory2'
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
        setTimeout(() => inputRef.current?.focus(), 0)
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
                                type='number'

                                label="DNI del alumno"
                                placeholder="Ej: 12345678"
                                value={dni}
                                onChange={(e) => {
                                    const val = e.target.value.slice(0, 9)
                                    setDni(val)
                                }}
                                onFocus={(e) => e.currentTarget.select()}
                                fullWidth
                                inputProps={{ inputMode: 'numeric' }}
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
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
                        overflow: 'hidden',
                        bgcolor: theme.palette.background.paper,
                        backdropFilter: 'blur(6px)',
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 1,
                        py: 1,
                        fontSize: { xs: 18, md: 20 },
                        fontWeight: 800,
                    }}
                >
                    Asistencia registrada
                </DialogTitle>

                <DialogContent
                    dividers
                    sx={{
                        p: { xs: 2, md: 3 },
                        bgcolor: theme.palette.background.default,
                    }}
                >
                    {asistencia && summary ? (
                        <Grow in timeout={220}>
                            <Stack spacing={2}>
                                <Stack
                                    direction={{ xs: 'column', sm: 'row' }}
                                    alignItems={{ xs: 'center', sm: 'center' }}
                                    justifyContent="space-between"
                                    gap={2}
                                >
                                    <Stack direction="row" alignItems="center" gap={1.25}>
                                        <Zoom in timeout={200}>
                                            <Avatar
                                                sx={{
                                                    bgcolor: theme.palette.primary.main,
                                                    color: theme.palette.primary.contrastText,
                                                    width: 52,
                                                    height: 52,
                                                    fontWeight: 800,
                                                    boxShadow: 2,
                                                }}
                                            >
                                                {summary.alumno.nombre?.[0]?.toUpperCase() || 'A'}
                                            </Avatar>
                                        </Zoom>

                                        <Stack spacing={0.25}>
                                            <Stack direction="row" alignItems="center" gap={1} sx={{ flexWrap: 'wrap' }}>
                                                <PersonIcon color="action" fontSize="small" />
                                                <Typography variant="h6" fontWeight={800} lineHeight={1.15}>
                                                    {summary.alumno.nombre}
                                                </Typography>
                                                <Chip label={`DNI ${summary.alumno.dni}`} size="small" variant="outlined" />
                                            </Stack>

                                            <Stack direction="row" alignItems="center" gap={0.75}>
                                                <EmailIcon color="action" fontSize="small" />
                                                <Typography variant="body2" color="text.secondary">
                                                    {summary.alumno.email}
                                                </Typography>
                                            </Stack>
                                        </Stack>
                                    </Stack>

                                    <Stack>{statusChip}</Stack>
                                </Stack>

                                <Divider flexItem />
                                <Stack
                                    direction={{ xs: 'column', md: 'row' }}
                                    gap={1.25}
                                    alignItems="center"
                                    justifyContent="center"
                                    sx={{
                                        p: 1.5,
                                        borderRadius: 3,
                                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                                        border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
                                    }}
                                >
                                    <Stack direction="row" alignItems="center" gap={1}>
                                        <Inventory2Icon color="action" fontSize="small" />
                                        <Typography variant="body1">
                                            <strong>Plan:</strong> {summary.plan?.nombre ?? '—'}
                                        </Typography>
                                    </Stack>

                                    <Stack direction="row" alignItems="center" gap={1} sx={{ opacity: 0.5 }}>
                                        ·
                                    </Stack>

                                    <Stack direction="row" alignItems="center" gap={1}>
                                        <CalendarMonthIcon color="action" fontSize="small" />
                                        <Typography variant="body1">
                                            <strong>Vence:</strong> {summary.vencimiento ? summary.vencimiento : '—'}
                                        </Typography>
                                    </Stack>
                                </Stack>

                                <Stack spacing={1}>
                                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                                        <Stack direction="row" alignItems="center" gap={0.75}>
                                            <FitnessCenterIcon color="action" fontSize="small" />
                                            <Typography variant="body2" fontWeight={800}>
                                                Usadas: {summary.plan.clases_realizadas}/{summary.plan.clases_pagadas}
                                            </Typography>
                                        </Stack>
                                        <Typography variant="body2" color="text.secondary">
                                            Restantes: {summary.plan.clases_restantes}
                                        </Typography>
                                    </Stack>

                                    <LinearProgress variant="determinate" value={pct} sx={barSx} />
                                </Stack>

                                <Fade in timeout={200}>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ display: 'block', pt: 0.5, textAlign: 'center' }}
                                    >
                                        ID: {asistencia.id} • Fecha: {asistencia.fecha} • Hora: {asistencia.hora} • Gym
                                        ID: {summary.gym_id}
                                    </Typography>
                                </Fade>
                            </Stack>
                        </Grow>
                    ) : (
                        <Typography variant="body2">Sin datos</Typography>
                    )}
                </DialogContent>

                <DialogActions
                    sx={{
                        p: 1.5,
                        justifyContent: 'center',
                        gap: 1,
                        bgcolor: alpha(theme.palette.background.paper, 0.6),
                    }}
                >
                    <Button
                        onClick={() => setOpenModal(false)}
                        variant="contained"
                        size="large"
                        sx={{ px: 4, borderRadius: 999, textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}
                    >
                        Aceptar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}
