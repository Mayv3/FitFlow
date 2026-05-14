'use client'

import { useEffect, useRef, useState } from 'react'
import {
    Box,
    Button,
    Card,
    CardContent,
    Dialog,
    LinearProgress,
    Stack,
    TextField,
    Typography,
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
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
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
    const inputRef = useRef<HTMLInputElement>(null)
    const [summary, setSummary] = useState<Summary | null>(null)
    const [openAlreadyModal, setOpenAlreadyModal] = useState(false)
    const [alreadyInfo, setAlreadyInfo] = useState<{ hora: string; nombre: string } | null>(null)
    const [openErrorModal, setOpenErrorModal] = useState(false)
    const [errorModalMsg, setErrorModalMsg] = useState<string | null>(null)

    const daysLeft = (dateStr?: string | null) => {
        if (!dateStr) return null
        const end = new Date(`${dateStr}T00:00:00`)
        const now = new Date()
        return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    }

    const dleft = daysLeft(summary?.vencimiento)
    const pct = summary?.plan.progreso_pct ?? 0
    const clasesOk = (summary?.plan?.clases_pagadas ?? 0) === 0 || (summary?.plan?.clases_restantes ?? 0) > 0

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
                if (err.response?.status === 409 && err.response?.data?.alreadyCheckedIn) {
                    const alreadyErr = new Error('ALREADY_CHECKED_IN')
                    ;(alreadyErr as any).hora = err.response.data.hora
                    ;(alreadyErr as any).nombre = err.response.data.nombre
                    throw alreadyErr
                }
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
            setDni('')
            setTimeout(() => inputRef.current?.focus(), 0)
        },
        onError: (err) => {
            setDni('')
            if (err.message === 'ALREADY_CHECKED_IN') {
                setAlreadyInfo({ hora: (err as any).hora, nombre: (err as any).nombre })
                setOpenAlreadyModal(true)
                return
            }
            setErrorModalMsg(err.message || 'No se pudo registrar la asistencia')
            setOpenErrorModal(true)
        },
    })
    const closeModal = () => {
        setOpenModal(false)
        setTimeout(() => {
            const input = inputRef.current
            if (input) { input.focus(); input.select() }
        }, 250)
    }

    const closeAlreadyModal = () => {
        setOpenAlreadyModal(false)
        setTimeout(() => {
            const input = inputRef.current
            if (input) { input.focus(); input.select() }
        }, 250)
    }

    const closeErrorModal = () => {
        setOpenErrorModal(false)
        setTimeout(() => {
            const input = inputRef.current
            if (input) { input.focus(); input.select() }
        }, 250)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const trimmed = dni.trim()
        if (!trimmed) {
            setErrorModalMsg('Ingresá un DNI')
            setOpenErrorModal(true)
            return
        }
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
        if (!openErrorModal) return
        const t = setTimeout(closeErrorModal, 4000)
        return () => clearTimeout(t)
    }, [openErrorModal])

    useEffect(() => {
        if (!openErrorModal) return
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter') { e.preventDefault(); closeErrorModal() }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [openErrorModal])

    useEffect(() => {
        if (!openAlreadyModal) return
        const t = setTimeout(closeAlreadyModal, 4000)
        return () => clearTimeout(t)
    }, [openAlreadyModal])

    useEffect(() => {
        if (!openAlreadyModal) return
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter') { e.preventDefault(); closeAlreadyModal() }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [openAlreadyModal])

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
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 4,
                        overflow: 'hidden',
                        boxShadow: '0 16px 56px rgba(0,0,0,0.25)',
                        p: 0,
                    },
                }}
            >
                {/* Colored header */}
                <Box
                    sx={{
                        bgcolor: (dleft === null || dleft > 0) && clasesOk
                            ? theme.palette.success.main
                            : theme.palette.error.main,
                        py: 4,
                        px: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 1,
                    }}
                >
                    <Zoom in={openModal} timeout={350}>
                        <Box>
                            {(dleft === null || dleft > 0) && clasesOk ? (
                                <CheckCircleIcon sx={{ fontSize: 80, color: 'white' }} />
                            ) : (
                                <CancelIcon sx={{ fontSize: 80, color: 'white' }} />
                            )}
                        </Box>
                    </Zoom>
                    <Typography variant="h4" fontWeight={800} sx={{ color: 'white', mt: 0.5 }}>
                        {(dleft === null || dleft > 0) && clasesOk ? '¡Bienvenido!' : 'Acceso Denegado'}
                    </Typography>
                    <Typography variant="h6" fontWeight={600} sx={{ color: 'rgba(255,255,255,0.88)' }}>
                        {summary?.alumno?.nombre}
                    </Typography>
                    <Box mt={0.5}>{statusChip}</Box>
                </Box>

                {/* Body */}
                <Box sx={{ p: 3 }}>
                    <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mb={2}>
                        <Box sx={{ bgcolor: alpha(theme.palette.primary.main, 0.07), borderRadius: 2.5, p: 2, textAlign: 'center' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>
                                Plan
                            </Typography>
                            <Typography variant="h6" fontWeight={700} noWrap>
                                {summary?.plan?.nombre ?? '—'}
                            </Typography>
                        </Box>
                        <Box sx={{ bgcolor: alpha(theme.palette.primary.main, 0.07), borderRadius: 2.5, p: 2, textAlign: 'center' }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>
                                Vencimiento
                            </Typography>
                            <Typography variant="h6" fontWeight={700}>
                                {formatDate(summary?.vencimiento)}
                            </Typography>
                        </Box>
                    </Box>

                    {(summary?.plan?.clases_pagadas ?? 0) > 0 && (
                        <Box sx={{ bgcolor: alpha(theme.palette.primary.main, 0.07), borderRadius: 2.5, p: 2, mb: 2 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                                    Clases
                                </Typography>
                                <Typography variant="body2" fontWeight={700}>
                                    {summary?.plan?.clases_realizadas} / {summary?.plan?.clases_pagadas}
                                </Typography>
                            </Box>
                            <LinearProgress variant="determinate" value={pct} sx={barSx} />
                            <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                                {summary?.plan?.clases_restantes} clases restantes
                            </Typography>
                        </Box>
                    )}

                    <Button
                        onClick={closeModal}
                        variant="contained"
                        fullWidth
                        size="large"
                        sx={{
                            borderRadius: 999,
                            textTransform: 'none',
                            fontSize: 16,
                            fontWeight: 700,
                            py: 1.4,
                            boxShadow: 'none',
                            background: (dleft === null || dleft > 0) && clasesOk
                                ? `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`
                                : `linear-gradient(90deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`,
                        }}
                    >
                        Aceptar
                    </Button>
                </Box>
            </Dialog>

            <Dialog
                open={openAlreadyModal}
                onClose={closeAlreadyModal}
                TransitionComponent={Grow}
                keepMounted
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 4,
                        overflow: 'hidden',
                        boxShadow: '0 16px 56px rgba(0,0,0,0.25)',
                        p: 0,
                    },
                }}
            >
                {/* Colored header */}
                <Box
                    sx={{
                        bgcolor: theme.palette.warning.main,
                        py: 4,
                        px: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 1,
                    }}
                >
                    <Zoom in={openAlreadyModal} timeout={350}>
                        <Box>
                            <WarningAmberIcon sx={{ fontSize: 80, color: 'white' }} />
                        </Box>
                    </Zoom>
                    <Typography variant="h4" fontWeight={800} sx={{ color: 'white', mt: 0.5 }}>
                        Ya asistió hoy
                    </Typography>
                    <Typography variant="h6" fontWeight={600} sx={{ color: 'rgba(255,255,255,0.88)' }}>
                        {alreadyInfo?.nombre}
                    </Typography>
                </Box>

                {/* Body */}
                <Box sx={{ p: 3 }}>
                    <Box
                        sx={{
                            bgcolor: alpha(theme.palette.warning.main, 0.08),
                            borderRadius: 2.5,
                            p: 2.5,
                            mb: 3,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 1.5,
                        }}
                    >
                        <AccessTimeIcon sx={{ fontSize: 32, color: theme.palette.warning.main }} />
                        <Box>
                            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                                Hora de ingreso
                            </Typography>
                            <Typography variant="h5" fontWeight={800} sx={{ color: theme.palette.warning.dark }}>
                                {alreadyInfo?.hora} hs
                            </Typography>
                        </Box>
                    </Box>

                    <Button
                        onClick={closeAlreadyModal}
                        variant="contained"
                        fullWidth
                        size="large"
                        sx={{
                            borderRadius: 999,
                            textTransform: 'none',
                            fontSize: 16,
                            fontWeight: 700,
                            py: 1.4,
                            boxShadow: 'none',
                            background: `linear-gradient(90deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`,
                        }}
                    >
                        Aceptar
                    </Button>
                </Box>
            </Dialog>

            <Dialog
                open={openErrorModal}
                onClose={closeErrorModal}
                TransitionComponent={Grow}
                keepMounted
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 4,
                        overflow: 'hidden',
                        boxShadow: '0 16px 56px rgba(0,0,0,0.25)',
                        p: 0,
                    },
                }}
            >
                <Box
                    sx={{
                        bgcolor: theme.palette.error.main,
                        py: 4,
                        px: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 1,
                    }}
                >
                    <Zoom in={openErrorModal} timeout={350}>
                        <Box>
                            <CancelIcon sx={{ fontSize: 80, color: 'white' }} />
                        </Box>
                    </Zoom>
                    <Typography variant="h5" fontWeight={800} sx={{ color: 'white', mt: 0.5, textAlign: 'center' }}>
                        {errorModalMsg}
                    </Typography>
                </Box>

                <Box sx={{ p: 3 }}>
                    <Button
                        onClick={closeErrorModal}
                        variant="contained"
                        fullWidth
                        size="large"
                        sx={{
                            borderRadius: 999,
                            textTransform: 'none',
                            fontSize: 16,
                            fontWeight: 700,
                            py: 1.4,
                            boxShadow: 'none',
                            background: `linear-gradient(90deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`,
                        }}
                    >
                        Aceptar
                    </Button>
                </Box>
            </Dialog>

        </Box>
    )
}
