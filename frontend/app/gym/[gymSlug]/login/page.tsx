'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
    Box,
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Stack,
    Alert,
    CircularProgress,
} from '@mui/material'
import { slugify } from '@/utils/slugify'
import axios from 'axios'
import { notify } from '@/lib/toast'

export default function GymLoginPage() {
    const params = useParams()
    const router = useRouter()
    const gymSlug = params.gymSlug as string

    const [dni, setDni] = useState('')
    const [loading, setLoading] = useState(false)
    const [gymLoading, setGymLoading] = useState(true)
    const [gymInfo, setGymInfo] = useState<any>(null)
    const [error, setError] = useState('')

    // Cargar información del gimnasio
    useEffect(() => {
        const fetchGymInfo = async () => {
            try {
                setGymLoading(true)
                // Buscar gym por nombre (el slug es el nombre)
                const response = await axios.get(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/gyms`
                )
                
                // Buscar el gym cuyo nombre coincida con el slug
                const gym = response.data.find((g: any) => 
                    slugify(g.name) === gymSlug
                )

                if (gym) {
                    setGymInfo(gym)
                } else {
                    setError('Gimnasio no encontrado')
                }
            } catch (err) {
                console.error('Error cargando gimnasio:', err)
                setError('Error al cargar información del gimnasio')
            } finally {
                setGymLoading(false)
            }
        }

        fetchGymInfo()
    }, [gymSlug])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!dni.trim()) {
            notify.error('Por favor ingresa tu DNI')
            return
        }

        if (!gymInfo) {
            notify.error('Información del gimnasio no disponible')
            return
        }

        try {
            setLoading(true)
            
            // Buscar alumno por DNI y gym_id
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/gym-login`,
                {
                    dni: dni.trim(),
                    gym_id: gymInfo.id,
                }
            )

            const alumno = response.data

            // Guardar datos en localStorage
            localStorage.setItem('gym_alumno', JSON.stringify(alumno))
            localStorage.setItem('gym_id', gymInfo.id)
            localStorage.setItem('gym_slug', gymSlug)

            notify.success(`¡Bienvenido ${alumno.nombre}!`)
            
            // Redirigir al panel del alumno
            router.push(`/gym/${gymSlug}/panel`)
            
        } catch (err: any) {
            console.error('Error en login:', err)
            const errorMsg = err.response?.data?.error || 'DNI no encontrado en este gimnasio'
            notify.error(errorMsg)
        } finally {
            setLoading(false)
        }
    }

    if (gymLoading) {
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

    if (error) {
        return (
            <Container maxWidth="sm">
                <Box
                    sx={{
                        minHeight: '100vh',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Alert severity="error">{error}</Alert>
                </Box>
            </Container>
        )
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.default',
                py: 4,
            }}
        >
            <Container maxWidth="sm">
                <Paper
                    elevation={3}
                    sx={{
                        p: { xs: 3, sm: 4 },
                        borderRadius: 2,
                    }}
                >
                    <Stack spacing={3} alignItems="center">
                        {/* Logo o nombre del gym */}
                        <Box textAlign="center">
                            <Typography variant="h4" fontWeight="bold" gutterBottom>
                                {gymInfo?.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Portal de acceso para socios
                            </Typography>
                        </Box>

                        {/* Formulario de login */}
                        <Box component="form" onSubmit={handleLogin} sx={{ width: '100%' }}>
                            <Stack spacing={3}>
                                <TextField
                                    label="DNI"
                                    placeholder="Ingresa tu DNI"
                                    value={dni}
                                    onChange={(e) => setDni(e.target.value)}
                                    fullWidth
                                    required
                                    autoFocus
                                    type="text"
                                    inputProps={{
                                        inputMode: 'numeric',
                                        pattern: '[0-9]*',
                                    }}
                                />

                                <Button
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    fullWidth
                                    disabled={loading}
                                >
                                    {loading ? <CircularProgress size={24} /> : 'Ingresar'}
                                </Button>
                            </Stack>
                        </Box>

                        {/* Información adicional */}
                        <Box textAlign="center">
                            <Typography variant="caption" color="text.secondary">
                                ¿No tienes acceso? Consulta en recepción
                            </Typography>
                        </Box>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    )
}
