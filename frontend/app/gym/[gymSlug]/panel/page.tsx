'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
    Box,
    Container,
    Typography,
    Stack,
    Avatar,
    IconButton,
    CircularProgress,
    LinearProgress,
    Chip,
    Modal,
    Divider,
} from '@mui/material'
import LogoutIcon from '@mui/icons-material/Logout'
import PersonIcon from '@mui/icons-material/Person'
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter'
import ReceiptIcon from '@mui/icons-material/Receipt'
import CloseIcon from '@mui/icons-material/Close'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import ClassIcon from '@mui/icons-material/Class'
import GroupIcon from '@mui/icons-material/Group'
import AddIcon from '@mui/icons-material/Add'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { notify } from '@/lib/toast'
import axios from 'axios'

export default function GymPanelPage() {
    const params = useParams()
    const router = useRouter()
    const gymSlug = params.gymSlug as string

    const [alumno, setAlumno] = useState<any>(null)
    const [gymName, setGymName] = useState<string>('')
    const [gymColor, setGymColor] = useState<string>('#FF6B35')
    const [loading, setLoading] = useState(true)
    const [selectedPago, setSelectedPago] = useState<any>(null)
    const [modalOpen, setModalOpen] = useState(false)
    const [servicios, setServicios] = useState<any[]>([])
    const [selectedServicio, setSelectedServicio] = useState<any>(null)
    const [sesiones, setSesiones] = useState<any[]>([])
    const [servicioModalOpen, setServicioModalOpen] = useState(false)
    const [loadingSesiones, setLoadingSesiones] = useState(false)
    const [reloadingSesiones, setReloadingSesiones] = useState(false)
    const [enrollModalOpen, setEnrollModalOpen] = useState(false)
    const [selectedSesionId, setSelectedSesionId] = useState<number | null>(null)
    const [selectedSesionName, setSelectedSesionName] = useState<string>('')
    const [enrollingSession, setEnrollingSession] = useState<number | null>(null)
    const [cancelingSession, setCancelingSession] = useState<number | null>(null)

    useEffect(() => {
        const loadData = async () => {
            const storedAlumno = localStorage.getItem('gym_alumno')
            const storedSlug = localStorage.getItem('gym_slug')
            const gymId = localStorage.getItem('gym_id')

            if (!storedAlumno || storedSlug !== gymSlug) {
                notify.error('Debes iniciar sesión')
                router.push(`/gym/${gymSlug}/login`)
                return
            }

            try {
                const alumnoBasic = JSON.parse(storedAlumno)

                // Obtener info completa del alumno desde el nuevo endpoint
                const alumnoResponse = await axios.get(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/gym-alumno/${gymId}/${alumnoBasic.dni}`
                )
                setAlumno(alumnoResponse.data)

                // Obtener info del gimnasio
                if (gymId) {
                    const gymResponse = await axios.get(
                        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/gyms/${gymId}?include_settings=true`
                    )
                    setGymName(gymResponse.data.name || 'GymSpace')

                    // Obtener color del gimnasio desde settings
                    const primaryColor = gymResponse.data?.settings?.colors?.primary || '#2196F3'
                    setGymColor(primaryColor)

                    // Obtener servicios/clases del gimnasio
                    const serviciosResponse = await axios.get(
                        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/public/appointments/gym/${gymId}/services`
                    )
                    setServicios(serviciosResponse.data)
                }
            } catch (err) {
                console.error('Error loading data:', err)
                notify.error('Error al cargar información')
                router.push(`/gym/${gymSlug}/login`)
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [gymSlug, router])

    const handleLogout = () => {
        localStorage.removeItem('gym_alumno')
        localStorage.removeItem('gym_id')
        localStorage.removeItem('gym_slug')
        notify.success('Sesión cerrada')
        router.push(`/gym/${gymSlug}/login`)
    }

    const handleOpenServicio = async (servicio: any) => {
        setSelectedServicio(servicio)
        setServicioModalOpen(true)
        setLoadingSesiones(true)

        try {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/public/appointments/service/${servicio.id}/sessions`,
                {
                    params: { alumno_id: datosPersonales?.id }
                }
            )
            setSesiones(response.data)
        } catch (error) {
            console.error('Error loading sessions:', error)
            notify.error('Error al cargar las sesiones')
        } finally {
            setLoadingSesiones(false)
        }
    }

    const handleOpenEnrollModal = (sessionId: number, diaNombre: string) => {
        setSelectedSesionId(sessionId)
        setSelectedSesionName(diaNombre)
        setEnrollModalOpen(true)
    }

    const handleEnroll = async (esFija: boolean) => {
        if (!datosPersonales?.id || !selectedSesionId) return

        setEnrollingSession(selectedSesionId)
        try {
            await axios.post(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/public/appointments/session/${selectedSesionId}/enroll`,
                {
                    alumno_id: datosPersonales.id,
                    es_fija: esFija
                }
            )
            notify.success(esFija ? '¡Inscripción fija creada!' : '¡Inscripción exitosa!')
            setEnrollModalOpen(false)
            // Recargar sesiones con barra de progreso
            await reloadSesiones()
        } catch (error: any) {
            notify.error(error.response?.data?.error || 'Error en la inscripción')
        } finally {
            setEnrollingSession(null)
        }
    }

    const handleUnenroll = async (sessionId: number) => {
        if (!datosPersonales?.id) return

        setCancelingSession(sessionId)
        try {
            await axios.post(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/public/appointments/session/${sessionId}/cancel`,
                { alumno_id: datosPersonales.id }
            )
            notify.success('Inscripción cancelada')
            // Recargar sesiones con barra de progreso
            await reloadSesiones()
        } catch (error: any) {
            notify.error(error.response?.data?.error || 'Error al cancelar')
        } finally {
            setCancelingSession(null)
        }
    }

    const reloadSesiones = async () => {
        if (!selectedServicio) return

        setReloadingSesiones(true)
        try {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/public/appointments/service/${selectedServicio.id}/sessions`,
                {
                    params: { alumno_id: datosPersonales?.id }
                }
            )
            setSesiones(response.data)
        } catch (error) {
            console.error('Error reloading sessions:', error)
        } finally {
            setReloadingSesiones(false)
        }
    }

    if (loading) {
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <CircularProgress />
            </Box>
        )
    }

    if (!alumno) {
        return null
    }

    // Obtener datos del nuevo formato
    const datosPersonales = alumno?.datosPersonales
    const plan = alumno?.plan
    const membresia = alumno?.membresia
    const clases = alumno?.clases
    const pagos = alumno?.pagos || []
    const totales = alumno?.totales

    const planActivo =
        membresia?.estado === 'activo' &&
        typeof membresia?.dias_restantes === 'number' &&
        membresia.dias_restantes > 0

    const tieneClasesDisponibles =
        typeof clases?.clases_disponibles === 'number' &&
        clases.clases_disponibles > 0

    const puedeInscribirse = planActivo && tieneClasesDisponibles

    return (
        <Box
            sx={{
                minHeight: '100vh',
                bgcolor: '#f5f5f5',
            }}
        >
            {/* Header con logo y avatar */}
            <Box
                sx={{
                    bgcolor: '#fff',
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid #e0e0e0',
                }}
            >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            bgcolor: gymColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontWeight: 'bold',
                            fontSize: '1.2rem',
                        }}
                    >
                        {gymName.charAt(0)}
                    </Box>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                    <IconButton
                        size="small"
                        onClick={handleLogout}
                        sx={{
                            bgcolor: '#f5f5f5',
                            '&:hover': { bgcolor: '#e0e0e0' }
                        }}
                    >
                        <LogoutIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                </Stack>
            </Box>

            <Container maxWidth="sm" sx={{ px: 2, py: 3 }}>
                <Stack spacing={2.5}>
                    {/* Bienvenida */}
                    <Stack spacing={0.5}>
                        <Typography
                            variant="h5"
                            sx={{
                                fontWeight: 700,
                                color: gymColor,
                                fontSize: { xs: '1.75rem', sm: '2rem' },
                            }}
                        >
                            {gymName}
                        </Typography>
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 600,
                                color: 'text.primary',
                                fontSize: { xs: '1.25rem', sm: '1.5rem' },
                            }}
                        >
                            ¡Bienvenido, {datosPersonales?.nombre?.split(' ')[0]}!
                        </Typography>
                    </Stack>

                    {/* Card Plan Actual */}
                    {plan && (
                        <Box
                            sx={{
                                bgcolor: '#fff',
                                borderRadius: 3,
                                p: 2.5,
                                border: '1px solid #e0e0e0',
                            }}
                        >
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                    Plan Actual
                                </Typography>
                                <FitnessCenterIcon sx={{ fontSize: 24, color: gymColor }} />
                            </Stack>
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 700,
                                    color: gymColor,
                                    mb: 0.5,
                                    fontSize: { xs: '1.25rem', sm: '1.5rem' }
                                }}
                            >
                                {plan.nombre || 'Plan activo'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Precio del plan: ${plan.precio?.toLocaleString() || '0'}
                            </Typography>
                        </Box>
                    )}

                    {/* Card Estado de Membresía */}
                    {membresia && membresia.dias_restantes !== null && (
                        <Box
                            sx={{
                                bgcolor: '#fff',
                                borderRadius: 3,
                                p: 2.5,
                                border: '1px solid #e0e0e0',
                            }}
                        >
                            <Typography variant="body2" color="text.secondary" fontWeight={500} mb={1.5}>
                                Estado de Membresía
                            </Typography>
                            <Typography
                                variant="h5"
                                sx={{
                                    fontWeight: 700,
                                    color: gymColor,
                                    mb: 1,
                                    fontSize: { xs: '1.75rem', sm: '2rem' }
                                }}
                            >
                                {membresia.dias_restantes} días restantes
                            </Typography>
                            <Typography variant="body2" color="text.secondary" mb={2}>
                                Fin: {membresia.fecha_vencimiento ? new Date(membresia.fecha_vencimiento + 'T00:00:00').toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }) : 'N/A'}
                            </Typography>
                            <Box sx={{ position: 'relative' }}>
                                <LinearProgress
                                    variant="determinate"
                                    value={100 - membresia.porcentaje_tiempo_usado}
                                    sx={{
                                        height: 8,
                                        borderRadius: 4,
                                        bgcolor: '#e0e0e0',
                                        '& .MuiLinearProgress-bar': {
                                            bgcolor: gymColor,
                                            borderRadius: 4,
                                        }
                                    }}
                                />
                            </Box>
                            <Stack direction="row" justifyContent="flex-end" mt={1}>
                                <Chip
                                    label={membresia.estado === 'activo' ? 'Activo' : 'Vencido'}
                                    size="small"
                                    sx={{
                                        bgcolor: membresia.estado === 'activo' ? '#10B981' : '#EF4444',
                                        color: '#fff',
                                        fontWeight: 600,
                                        fontSize: '0.75rem',
                                    }}
                                />
                            </Stack>
                        </Box>
                    )}

                    {/* Card Clases Restantes */}
                    {clases && clases.clases_disponibles !== null && (
                        <Box
                            sx={{
                                bgcolor: '#fff',
                                borderRadius: 3,
                                p: 2.5,
                                border: '1px solid #e0e0e0',
                            }}
                        >
                            <Typography variant="body2" color="text.secondary" fontWeight={500} mb={1.5}>
                                Clases Restantes
                            </Typography>
                            <Typography
                                variant="h5"
                                sx={{
                                    fontWeight: 700,
                                    color: gymColor,
                                    mb: 1,
                                    fontSize: { xs: '1.75rem', sm: '2rem' }
                                }}
                            >
                                {clases.clases_disponibles}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" mb={2}>
                                De {clases.clases_pagadas} clases este mes
                            </Typography>
                            <Box sx={{ position: 'relative' }}>
                                <LinearProgress
                                    variant="determinate"
                                    value={clases.porcentaje_uso}
                                    sx={{
                                        height: 8,
                                        borderRadius: 4,
                                        bgcolor: '#e0e0e0',
                                        '& .MuiLinearProgress-bar': {
                                            bgcolor: gymColor,
                                            borderRadius: 4,
                                        }
                                    }}
                                />
                            </Box>
                            <Stack direction="row" justifyContent="flex-end" mt={1}>
                                <Chip
                                    label="Activo"
                                    size="small"
                                    sx={{
                                        bgcolor: '#10B981',
                                        color: '#fff',
                                        fontWeight: 600,
                                        fontSize: '0.75rem',
                                    }}
                                />
                            </Stack>
                        </Box>
                    )}

                    {/* Clases Disponibles */}

                    {!puedeInscribirse && (
                        <Box
                            sx={{
                                bgcolor: '#fff',
                                borderRadius: 3,
                                p: 2.5,
                                border: '1px solid #e0e0e0',
                                textAlign: 'center',
                            }}
                        >
                            <Typography variant="body1" fontWeight={600} mb={1}>
                                No podés inscribirte a clases
                            </Typography>

                            <Typography variant="body2" color="text.secondary">
                                {!planActivo
                                    ? 'Tu plan se encuentra vencido. Regularizalo para volver a inscribirte.'
                                    : 'No tenés clases disponibles en tu plan actual.'
                                }
                            </Typography>
                        </Box>
                    )}


                    {puedeInscribirse && servicios && servicios.length > 0 && (
                        <Box
                            sx={{
                                bgcolor: '#fff',
                                borderRadius: 3,
                                p: 2.5,
                                border: '1px solid #e0e0e0',
                            }}
                        >
                            <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                                <ClassIcon sx={{ fontSize: 20, color: gymColor }} />
                                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                    Clases Disponibles
                                </Typography>
                            </Stack>
                            <Stack spacing={1.5}>
                                {servicios.map((servicio: any) => (
                                    <Box
                                        key={servicio.id}
                                        onClick={() => handleOpenServicio(servicio)}
                                        sx={{
                                            p: 2,
                                            bgcolor: '#f9f9f9',
                                            borderRadius: 2,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            '&:hover': {
                                                bgcolor: '#f0f0f0',
                                                transform: 'translateX(4px)',
                                            }
                                        }}
                                    >
                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Box>
                                                <Typography variant="body1" fontWeight={600} color={gymColor}>
                                                    {servicio.nombre}
                                                </Typography>
                                                {servicio.descripcion && (
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                        sx={{
                                                            maxWidth: '250px',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                            display: 'block'
                                                        }}
                                                    >
                                                        {servicio.descripcion.length > 20
                                                            ? `${servicio.descripcion.substring(0, 20)}...`
                                                            : servicio.descripcion
                                                        }
                                                    </Typography>
                                                )}
                                            </Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Ver horarios →
                                            </Typography>
                                        </Stack>
                                    </Box>
                                ))}
                            </Stack>
                        </Box>
                    )}

                    {/* Historial de Pagos */}
                    {pagos && pagos.length > 0 && (
                        <Box
                            sx={{
                                bgcolor: '#fff',
                                borderRadius: 3,
                                p: 2.5,
                                border: '1px solid #e0e0e0',
                            }}
                        >
                            <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                                <ReceiptIcon sx={{ fontSize: 20, color: gymColor }} />
                                <Box flex={1}>
                                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                        Historial de Pagos
                                    </Typography>
                                    {pagos.length > 3 && (
                                        <Typography variant="caption" color="text.secondary">
                                            {pagos.length} pagos registrados
                                        </Typography>
                                    )}
                                </Box>
                            </Stack>
                            <Box
                                sx={{
                                    maxHeight: pagos.length > 3 ? '280px' : 'auto',
                                    overflowY: pagos.length > 3 ? 'auto' : 'visible',
                                    pr: pagos.length > 3 ? 0.5 : 0,
                                    '&::-webkit-scrollbar': {
                                        width: '6px',
                                    },
                                    '&::-webkit-scrollbar-track': {
                                        bgcolor: 'transparent',
                                    },
                                    '&::-webkit-scrollbar-thumb': {
                                        bgcolor: '#d0d0d0',
                                        borderRadius: '10px',
                                        '&:hover': {
                                            bgcolor: '#b0b0b0',
                                        }
                                    },
                                }}
                            >
                                <Stack spacing={1.5}>
                                    {pagos.map((pago: any) => (
                                        <Box
                                            key={pago.id}
                                            onClick={() => {
                                                setSelectedPago(pago)
                                                setModalOpen(true)
                                            }}
                                            sx={{
                                                p: 2,
                                                bgcolor: '#f9f9f9',
                                                borderRadius: 2,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                '&:hover': {
                                                    bgcolor: '#f0f0f0',
                                                    transform: 'translateX(4px)',
                                                }
                                            }}
                                        >
                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                <Box>
                                                    <Typography variant="body1" fontWeight={600} color={gymColor}>
                                                        ${pago.monto_total?.toLocaleString()}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {new Date(pago.fecha_de_pago + 'T00:00:00').toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}
                                                    </Typography>
                                                </Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    Ver detalles →
                                                </Typography>
                                            </Stack>
                                        </Box>
                                    ))}
                                </Stack>
                            </Box>
                        </Box>
                    )}

                </Stack>
            </Container>

            {/* Modal de Detalles del Pago */}
            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 2,
                }}
            >
                <Box
                    sx={{
                        bgcolor: '#fff',
                        borderRadius: 3,
                        maxWidth: 500,
                        width: '100%',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        position: 'relative',
                        outline: 'none',
                        border: 'none',
                    }}
                >
                    {/* Header del Modal */}
                    <Box
                        sx={{
                            p: 2.5,
                            borderBottom: '1px solid #e0e0e0',
                            position: 'sticky',
                            top: 0,
                            bgcolor: '#fff',
                            zIndex: 1,
                        }}
                    >
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <Box
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 2,
                                        bgcolor: `${gymColor}15`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <ReceiptIcon sx={{ fontSize: 22, color: gymColor }} />
                                </Box>
                                <Typography variant="h6" fontWeight={600}>
                                    Detalle del Pago
                                </Typography>
                            </Stack>
                            <IconButton
                                size="small"
                                onClick={() => setModalOpen(false)}
                                sx={{
                                    bgcolor: '#f5f5f5',
                                    '&:hover': { bgcolor: '#e0e0e0' }
                                }}
                            >
                                <CloseIcon sx={{ fontSize: 20 }} />
                            </IconButton>
                        </Stack>
                    </Box>

                    {/* Content del Modal */}
                    {selectedPago && (
                        <Box sx={{ p: 3 }}>
                            <Stack spacing={3}>
                                {/* Monto */}
                                <Box
                                    sx={{
                                        textAlign: 'center',
                                        p: 3,
                                        bgcolor: `${gymColor}08`,
                                        borderRadius: 2,
                                    }}
                                >
                                    <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                                        Monto Total
                                    </Typography>
                                    <Typography variant="h3" fontWeight={700} color={gymColor}>
                                        ${selectedPago.monto_total?.toLocaleString()}
                                    </Typography>
                                </Box>

                                <Divider />

                                {/* Detalles */}
                                <Stack spacing={2.5}>
                                    {/* Tipo */}
                                    {selectedPago.tipo && (
                                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                            <Chip
                                                label={selectedPago.tipo}
                                                size="medium"
                                                sx={{
                                                    bgcolor: `${gymColor}15`,
                                                    color: gymColor,
                                                    fontWeight: 600,
                                                    fontSize: '0.875rem',
                                                    px: 1,
                                                }}
                                            />
                                        </Box>
                                    )}

                                    {/* Fecha de Pago */}
                                    {selectedPago.fecha_de_pago && (
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                            <CalendarTodayIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    Fecha de Pago
                                                </Typography>
                                                <Typography variant="body1" fontWeight={500}>
                                                    {new Date(selectedPago.fecha_de_pago + 'T00:00:00').toLocaleDateString('es-AR', {
                                                        timeZone: 'America/Argentina/Buenos_Aires',
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    )}



                                    {/* Responsable */}
                                    {selectedPago.responsable && (
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                            <PersonIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    Registrado por
                                                </Typography>
                                                <Typography variant="body1" fontWeight={500} sx={{ textTransform: 'capitalize' }}>
                                                    {selectedPago.responsable}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    )}
                                </Stack>
                            </Stack>
                        </Box>
                    )}
                </Box>
            </Modal>

            {/* Modal de Sesiones/Horarios */}
            <Modal
                open={servicioModalOpen}
                onClose={() => setServicioModalOpen(false)}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 2,
                }}
            >
                <Box
                    sx={{
                        bgcolor: '#fff',
                        borderRadius: 3,
                        maxWidth: 600,
                        width: '100%',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        position: 'relative',
                        outline: 'none',
                        border: 'none',
                    }}
                >
                    {/* Header del Modal */}
                    <Box
                        sx={{
                            p: 2.5,
                            borderBottom: '1px solid #e0e0e0',
                            position: 'sticky',
                            top: 0,
                            bgcolor: '#fff',
                            zIndex: 1,
                        }}
                    >
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <Box
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 2,
                                        bgcolor: `${gymColor}15`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <ClassIcon sx={{ fontSize: 22, color: gymColor }} />
                                </Box>
                                <Box>
                                    <Typography variant="h6" fontWeight={600}>
                                        {selectedServicio?.nombre}
                                    </Typography>
                                    {selectedServicio?.descripcion && (
                                        <Typography variant="caption" color="text.secondary">
                                            {selectedServicio.descripcion}
                                        </Typography>
                                    )}
                                </Box>
                            </Stack>
                            <IconButton
                                size="small"
                                onClick={() => setServicioModalOpen(false)}
                                sx={{
                                    bgcolor: '#f5f5f5',
                                    '&:hover': { bgcolor: '#e0e0e0' }
                                }}
                            >
                                <CloseIcon sx={{ fontSize: 20 }} />
                            </IconButton>
                        </Stack>
                    </Box>

                    {/* Content del Modal */}
                    <Box sx={{ p: 3, position: 'relative' }}>
                        {loadingSesiones ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <CircularProgress sx={{ color: gymColor }} />
                            </Box>
                        ) : sesiones.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography variant="body2" color="text.secondary">
                                    No hay sesiones disponibles próximamente
                                </Typography>
                            </Box>
                        ) : (
                            <Stack spacing={2}>
                                {sesiones.map((sesion: any, index: number) => {
                                    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                                    const diaNombre = diasSemana[sesion.dia_semana] || `Día ${sesion.dia_semana}`;

                                    // Calcular si faltan 30 minutos o menos (hora Argentina)
                                    const ahoraArgentina = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
                                    let horaBase = sesion.hora_inicio || '00:00';
                                    if (/^\d{2}:\d{2}$/.test(horaBase)) horaBase = `${horaBase}:00`;
                                    // Construimos fecha/hora con offset -03:00 (Argentina)
                                    const fechaHoraSesionArgentina = new Date(`${sesion.fecha_proxima}T${horaBase}-03:00`);
                                    const minutosRestantes = (fechaHoraSesionArgentina.getTime() - ahoraArgentina.getTime()) / (1000 * 60);
                                    const yaNoSePuedeInscribir = minutosRestantes <= 30;
                                    const botonDeshabilitado = (sesion.cupos_disponibles === 0) || yaNoSePuedeInscribir;

                                    return (
                                        <Box
                                            key={`${sesion.id}-${sesion.dia_semana}-${sesion.hora_inicio}-${index}`}
                                            sx={{
                                                p: 2.5,
                                                bgcolor: '#f9f9f9',
                                                borderRadius: 2,
                                                border: '1px solid #e0e0e0',
                                            }}
                                        >
                                            <Stack spacing={3}>

                                                {/* Día + Hora */}
                                                <Stack direction="row" spacing={2} alignItems="flex-start" justifyContent='space-between'>
                                                    <Stack direction='row' alignItems="center" spacing={2}>

                                                        <Stack>
                                                            <Typography
                                                                variant="h5"
                                                                color={gymColor}
                                                                paddingBottom={0.5}
                                                                fontWeight={700}
                                                                sx={{ textTransform: 'capitalize', lineHeight: 1.1 }}
                                                            >
                                                                {diaNombre}
                                                            </Typography>

                                                            <Stack direction="row" spacing={1} alignItems="center">
                                                                <Typography sx={{ fontSize: '18px' }} fontWeight={600}>
                                                                    {new Date(sesion.fecha_proxima + 'T00:00:00').toLocaleDateString('es-AR', {
                                                                        day: '2-digit',
                                                                        month: '2-digit',
                                                                        year: 'numeric',
                                                                        timeZone: 'America/Argentina/Buenos_Aires'
                                                                    })}
                                                                </Typography>

                                                            </Stack>
                                                            <Typography sx={{ fontSize: '18px' }} fontWeight={600}>
                                                                {sesion.hora_inicio?.substring(0, 5)} hs
                                                            </Typography>
                                                        </Stack>

                                                    </Stack>
                                                    <Stack direction="row" spacing={2} alignItems="center">
                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <GroupIcon sx={{ fontSize: 26, color: gymColor }} />
                                                            <Typography
                                                                variant="h6"
                                                                fontWeight={700}
                                                                color={sesion.cupos_disponibles === 0 ? 'error.main' : gymColor}
                                                            >
                                                                {sesion.cupos_disponibles} / {sesion.capacidad}
                                                            </Typography>
                                                        </Stack>


                                                    </Stack>

                                                </Stack>

                                                {/* Capacidad */}


                                                {/* Botones */}
                                                {sesion.inscrito ? (
                                                    <Stack direction="row" spacing={1.5} alignItems="center">

                                                        {/* Botón Inscrito */}
                                                        <Box
                                                            sx={{
                                                                flex: 1,
                                                                py: 2,
                                                                px: 2,
                                                                bgcolor: sesion.es_fija ? '#F59E0B' : '#10B981',
                                                                color: '#fff',
                                                                borderRadius: 20,
                                                                textAlign: 'center',
                                                            }}
                                                        >
                                                            <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                                                                <CheckCircleIcon sx={{ fontSize: 20 }} />
                                                                <Typography variant="body1" fontWeight={600}>
                                                                    {sesion.es_fija ? 'Inscripción Fija' : 'Inscrito'}
                                                                </Typography>
                                                            </Stack>
                                                        </Box>

                                                        {/* Cancelar */}
                                                        <Box
                                                            onClick={() => !cancelingSession && handleUnenroll(sesion.id)}
                                                            sx={{
                                                                py: 1.8,
                                                                px: 2,
                                                                bgcolor: '#EF4444',
                                                                color: '#fff',
                                                                borderRadius: 3,
                                                                cursor: cancelingSession === sesion.id ? 'not-allowed' : 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                transition: 'all 0.2s',
                                                                opacity: cancelingSession === sesion.id ? 0.6 : 1,
                                                                '&:hover': {
                                                                    opacity: cancelingSession === sesion.id ? 0.6 : 0.9,
                                                                    transform: cancelingSession === sesion.id ? 'none' : 'translateY(-2px)',
                                                                }
                                                            }}
                                                        >
                                                            {cancelingSession === sesion.id ? (
                                                                <CircularProgress size={20} sx={{ color: '#fff' }} />
                                                            ) : (
                                                                <CloseIcon sx={{ fontSize: 20 }} />
                                                            )}
                                                        </Box>
                                                    </Stack>
                                                ) : (
                                                    <Box
                                                        onClick={() =>
                                                            !botonDeshabilitado && handleOpenEnrollModal(sesion.id, diaNombre)
                                                        }
                                                        sx={{
                                                            mt: 1,
                                                            py: 1.8,
                                                            px: 2,
                                                            bgcolor: botonDeshabilitado ? '#ccc' : gymColor,
                                                            color: '#fff',
                                                            borderRadius: 2,
                                                            textAlign: 'center',
                                                            cursor: botonDeshabilitado ? 'not-allowed' : 'pointer',
                                                            transition: 'all 0.2s',
                                                            opacity: botonDeshabilitado ? 0.8 : 1,
                                                            '&:hover': {
                                                                opacity: botonDeshabilitado ? 0.8 : 0.9,
                                                                transform: botonDeshabilitado ? 'none' : 'translateY(-2px)',
                                                            }
                                                        }}
                                                    >
                                                        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                                                            {botonDeshabilitado ? (
                                                                <>
                                                                    <CloseIcon sx={{ fontSize: 20 }} />
                                                                    <Typography variant="body1" fontWeight={600}>
                                                                        {sesion.cupos_disponibles === 0 ? 'Sin cupos' : 'Cerrada'}
                                                                    </Typography>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <AddIcon sx={{ fontSize: 20 }} />
                                                                    <Typography variant="body1" fontWeight={600}>
                                                                        Inscribirme
                                                                    </Typography>
                                                                </>
                                                            )}
                                                        </Stack>
                                                    </Box>
                                                )}
                                            </Stack>

                                        </Box>
                                    );
                                })}
                            </Stack>
                        )}
                    </Box>

                    {/* Barra de carga en la parte inferior */}
                    {reloadingSesiones && (
                        <Box
                            sx={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: 4,
                                bgcolor: 'rgba(0, 0, 0, 0.1)',
                                overflow: 'hidden',
                                borderBottomLeftRadius: 12,
                                borderBottomRightRadius: 12,
                            }}
                        >
                            <Box
                                sx={{
                                    height: '100%',
                                    bgcolor: gymColor,
                                    animation: 'progressBar 1.5s ease-in-out infinite',
                                    '@keyframes progressBar': {
                                        '0%': {
                                            width: '0%',
                                            marginLeft: '0%',
                                        },
                                        '50%': {
                                            width: '75%',
                                            marginLeft: '0%',
                                        },
                                        '100%': {
                                            width: '0%',
                                            marginLeft: '100%',
                                        },
                                    },
                                }}
                            />
                        </Box>
                    )}
                </Box>
            </Modal>

            {/* Modal de confirmación de inscripción */}
            <Modal
                open={enrollModalOpen}
                onClose={() => setEnrollModalOpen(false)}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 2,
                }}
            >
                <Box
                    sx={{
                        bgcolor: '#fff',
                        borderRadius: 3,
                        maxWidth: 450,
                        width: '100%',
                        p: 3,
                        outline: 'none',
                        border: 'none',
                    }}
                >
                    <Stack spacing={3}>
                        {/* Header */}
                        <Stack spacing={1}>
                            <Typography variant="h6" fontWeight={600} textAlign="center">
                                ¿Cómo quieres inscribirte?
                            </Typography>
                            <Typography variant="body2" color="text.secondary" textAlign="center">
                                {selectedSesionName} - {selectedServicio?.nombre}
                            </Typography>
                        </Stack>

                        <Stack spacing={2}>
                            {/* Inscripción Solo esta clase */}
                            <Box
                                onClick={() => !enrollingSession && handleEnroll(false)}
                                sx={{
                                    p: 2.5,
                                    bgcolor: '#f9f9f9',
                                    borderRadius: 2,
                                    border: '2px solid #e0e0e0',
                                    cursor: enrollingSession ? 'not-allowed' : 'pointer',
                                    opacity: enrollingSession ? 0.6 : 1,
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        borderColor: enrollingSession ? '#e0e0e0' : gymColor,
                                        bgcolor: enrollingSession ? '#f9f9f9' : `${gymColor}08`,
                                        transform: enrollingSession ? 'none' : 'translateY(-2px)',
                                        boxShadow: enrollingSession ? 0 : 2,
                                    }
                                }}
                            >
                                <Stack spacing={1}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Box
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: 1,
                                                bgcolor: `${gymColor}15`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            {enrollingSession ? (
                                                <CircularProgress size={18} sx={{ color: gymColor }} />
                                            ) : (
                                                <Typography fontSize="1.2rem">🎯</Typography>
                                            )}
                                        </Box>
                                        <Typography variant="body1" fontWeight={600}>
                                            {enrollingSession ? 'Inscribiendo...' : 'Solo a esta clase'}
                                        </Typography>
                                    </Stack>
                                    <Typography sx={{ fontSize: '16px' }} color="text.primary">
                                        Te inscribes únicamente para esta sesión
                                    </Typography>
                                </Stack>
                            </Box>

                            {/* Inscripción Todas las semanas */}
                            <Box
                                onClick={() => !enrollingSession && handleEnroll(true)}
                                sx={{
                                    p: 2.5,
                                    bgcolor: '#f9f9f9',
                                    borderRadius: 2,
                                    border: '2px solid #e0e0e0',
                                    cursor: enrollingSession ? 'not-allowed' : 'pointer',
                                    opacity: enrollingSession ? 0.6 : 1,
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        borderColor: enrollingSession ? '#e0e0e0' : gymColor,
                                        bgcolor: enrollingSession ? '#f9f9f9' : `${gymColor}08`,
                                        transform: enrollingSession ? 'none' : 'translateY(-2px)',
                                        boxShadow: enrollingSession ? 0 : 2,
                                    }
                                }}
                            >
                                <Stack spacing={1}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Box
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: 1,
                                                bgcolor: `${gymColor}15`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            {enrollingSession ? (
                                                <CircularProgress size={18} sx={{ color: gymColor }} />
                                            ) : (
                                                <Typography fontSize="1.2rem">🔄</Typography>
                                            )}
                                        </Box>
                                        <Typography variant="body1" fontWeight={600}>
                                            {enrollingSession ? 'Inscribiendo...' : 'Todas las semanas'}
                                        </Typography>
                                    </Stack>
                                    <Typography sx={{ fontSize: '16px' }} color="text.primary">
                                        Te inscribes automáticamente cada semana en este horario
                                    </Typography>
                                </Stack>
                            </Box>
                        </Stack>

                        {/* Botón Cancelar */}
                        <Box
                            onClick={() => setEnrollModalOpen(false)}
                            sx={{
                                mt: 1,
                                py: 1.5,
                                textAlign: 'center',
                                cursor: 'pointer',
                                color: 'text.secondary',
                                borderRadius: 1,
                                transition: 'all 0.2s',
                                '&:hover': {
                                    bgcolor: '#f5f5f5',
                                    color: 'text.primary',
                                }
                            }}
                        >
                            <Typography variant="body2" fontWeight={500}>
                                Cancelar
                            </Typography>
                        </Box>
                    </Stack>
                </Box>
            </Modal>
        </Box>
    )
}
