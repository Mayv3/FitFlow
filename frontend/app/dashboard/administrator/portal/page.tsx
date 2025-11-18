'use client'
import { useState, useEffect } from 'react'
import {
    Box,
    Container,
    Paper,
    Typography,
    Stack,
    Button,
    TextField,
    Alert,
    IconButton,
    Tooltip,
    Divider,
} from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import QrCode2Icon from '@mui/icons-material/QrCode2'
import { notify } from '@/lib/toast'
import { slugify } from '@/utils/slugify'

export default function PortalPage() {
    const [gymName, setGymName] = useState('')
    const [portalUrl, setPortalUrl] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Obtener información del gym de las cookies
        const loadGymInfo = () => {
            try {
                // Función para obtener una cookie por nombre
                const getCookie = (name: string) => {
                    const value = `; ${document.cookie}`
                    const parts = value.split(`; ${name}=`)
                    if (parts.length === 2) return parts.pop()?.split(';').shift()
                    return null
                }

                // Obtener gym_name de las cookies
                const gymName = getCookie('gym_name')
                
                console.log('[loadGymInfo] gym_name desde cookies:', gymName)
                
                if (!gymName) {
                    console.error('[loadGymInfo] No se pudo obtener el nombre del gimnasio')
                    notify.error('No se encontró información del gimnasio')
                    setLoading(false)
                    return
                }

                console.log('[loadGymInfo] Gym name final:', gymName)
                setGymName(gymName)
                
                // Generar URL con el slug
                const slug = slugify(gymName)
                const url = `${window.location.origin}/gym/${slug}/login`
                console.log('[loadGymInfo] Portal URL:', url)
                setPortalUrl(url)
            } catch (error) {
                console.error('[loadGymInfo] Error:', error)
                notify.error('Error al cargar la información del gimnasio')
            } finally {
                setLoading(false)
            }
        }

        loadGymInfo()
    }, [])

    const handleCopyUrl = () => {
        navigator.clipboard.writeText(portalUrl)
        notify.success('URL copiada al portapapeles')
    }

    const handleOpenUrl = () => {
        window.open(portalUrl, '_blank')
    }

    if (loading) {
        return (
            <Container maxWidth="lg">
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <Typography>Cargando información del gimnasio...</Typography>
                </Box>
            </Container>
        )
    }

    if (!portalUrl) {
        return (
            <Container maxWidth="lg">
                <Alert severity="error">
                    No se pudo cargar la información del gimnasio. Por favor, recarga la página.
                </Alert>
            </Container>
        )
    }

    return (
        <Container maxWidth="lg">
            <Stack spacing={4}>
                {/* Header */}
                <Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        Portal de Alumnos
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Comparte esta URL con tus alumnos para que puedan acceder a su panel personal
                    </Typography>
                </Box>

                {/* URL Card */}
                <Paper
                    elevation={3}
                    sx={{
                        p: { xs: 3, sm: 4 },
                        borderRadius: 2,
                        bgcolor: 'background.paper',
                    }}
                >
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                URL de acceso personalizada
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Esta es la URL única de tu gimnasio: <strong>{gymName}</strong>
                            </Typography>
                        </Box>

                        <Divider />

                        {/* URL Display */}
                        <Box>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <TextField
                                    fullWidth
                                    value={portalUrl}
                                    InputProps={{
                                        readOnly: true,
                                        sx: {
                                            fontFamily: 'monospace',
                                            fontSize: { xs: '0.8rem', sm: '0.9rem' },
                                        },
                                    }}
                                />
                                <Stack direction="row" spacing={1}>
                                    <Tooltip title="Copiar URL">
                                        <Button
                                            variant="contained"
                                            onClick={handleCopyUrl}
                                            startIcon={<ContentCopyIcon />}
                                            sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
                                        >
                                            Copiar
                                        </Button>
                                    </Tooltip>
                                    <Tooltip title="Abrir en nueva pestaña">
                                        <IconButton
                                            color="primary"
                                            onClick={handleOpenUrl}
                                            sx={{
                                                border: '1px solid',
                                                borderColor: 'primary.main',
                                            }}
                                        >
                                            <OpenInNewIcon />
                                        </IconButton>
                                    </Tooltip>
                                </Stack>
                            </Stack>
                        </Box>

                        {/* Info Alert */}
                        <Alert severity="info" sx={{ mt: 2 }}>
                            <Typography variant="body2">
                                Los alumnos solo necesitan su <strong>DNI</strong> para ingresar. 
                                Asegúrate de que estén registrados en el sistema.
                            </Typography>
                        </Alert>
                    </Stack>
                </Paper>

                {/* Instrucciones */}
                <Paper
                    elevation={1}
                    sx={{
                        p: { xs: 3, sm: 4 },
                        borderRadius: 2,
                        bgcolor: 'background.default',
                    }}
                >
                    <Stack spacing={2}>
                        <Typography variant="h6" fontWeight="bold">
                            ¿Cómo funciona?
                        </Typography>
                        
                        <Box component="ol" sx={{ pl: 2, '& li': { mb: 1.5 } }}>
                            <li>
                                <Typography variant="body2">
                                    <strong>Comparte la URL</strong> con tus alumnos por WhatsApp, email o redes sociales
                                </Typography>
                            </li>
                            <li>
                                <Typography variant="body2">
                                    <strong>Los alumnos ingresan</strong> usando únicamente su número de DNI
                                </Typography>
                            </li>
                            <li>
                                <Typography variant="body2">
                                    <strong>Acceden a su panel</strong> donde pueden ver:
                                </Typography>
                                <Box component="ul" sx={{ pl: 2, mt: 1 }}>
                                    <li>Sus datos personales</li>
                                    <li>Plan activo y vencimiento</li>
                                    <li>Historial de pagos</li>
                                    <li>Clases inscritas (próximamente)</li>
                                </Box>
                            </li>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Alert severity="success">
                            <Typography variant="body2">
                                💡 <strong>Tip:</strong> Puedes agregar esta URL a tu Instagram, Facebook o sitio web 
                                para que tus alumnos accedan fácilmente.
                            </Typography>
                        </Alert>
                    </Stack>
                </Paper>

                {/* Próximamente */}
                <Paper
                    elevation={1}
                    sx={{
                        p: 3,
                        borderRadius: 2,
                        bgcolor: 'grey.100',
                        border: '1px dashed',
                        borderColor: 'grey.400',
                    }}
                >
                    <Stack direction="row" spacing={2} alignItems="center">
                        <QrCode2Icon sx={{ fontSize: 40, color: 'text.secondary' }} />
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold">
                                Código QR - Próximamente
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Pronto podrás generar un código QR para que tus alumnos escaneen y accedan directamente
                            </Typography>
                        </Box>
                    </Stack>
                </Paper>
            </Stack>
        </Container>
    )
}
