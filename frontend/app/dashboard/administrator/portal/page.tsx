'use client'
import { useState, useEffect, useRef } from 'react'
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
import DownloadIcon from '@mui/icons-material/Download'
import { QRCodeSVG } from 'qrcode.react'
import { notify } from '@/lib/toast'
import { slugify } from '@/utils/slugify'
import { useTheme } from '@mui/material/styles'

export default function PortalPage() {
    const theme = useTheme()
    const [gymName, setGymName] = useState('')
    const [portalUrl, setPortalUrl] = useState('')
    const [loading, setLoading] = useState(true)
    const [primaryColor, setPrimaryColor] = useState(theme.palette.primary.main)
    const qrRef = useRef<HTMLDivElement>(null)

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
                const gymColor = getCookie('gym_primary_color')

                console.log('[loadGymInfo] gym_name desde cookies:', gymName)

                if (!gymName) {
                    console.error('[loadGymInfo] No se pudo obtener el nombre del gimnasio')
                    notify.error('No se encontró información del gimnasio')
                    setLoading(false)
                    return
                }

                console.log('[loadGymInfo] Gym name final:', gymName)
                setGymName(gymName)

                if (gymColor) {
                    setPrimaryColor(gymColor)
                }

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

    const handleDownloadQR = () => {
        if (!qrRef.current) return

        const svg = qrRef.current.querySelector('svg')
        if (!svg) return

        // Crear un canvas
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Configurar el tamaño del canvas
        const size = 1024 // Tamaño grande para mejor calidad
        canvas.width = size
        canvas.height = size + 150 // Espacio extra para el texto

        // Fondo blanco
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Convertir SVG a imagen
        const svgData = new XMLSerializer().serializeToString(svg)
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(svgBlob)
        const img = new Image()

        img.onload = () => {
            // Dibujar QR centrado
            const qrSize = size * 0.8
            const qrX = (size - qrSize) / 2
            const qrY = 50
            ctx.drawImage(img, qrX, qrY, qrSize, qrSize)

            // Agregar texto del gimnasio
            ctx.fillStyle = primaryColor
            ctx.font = 'bold 48px Arial'
            ctx.textAlign = 'center'
            ctx.fillText(gymName, size / 2, size + 100)

            // Descargar
            canvas.toBlob((blob) => {
                if (!blob) return
                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.download = `qr-${slugify(gymName)}.png`
                link.href = url
                link.click()
                URL.revokeObjectURL(url)
                notify.success('Código QR descargado')
            })

            URL.revokeObjectURL(url)
        }

        img.src = url
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
                                                width: 60,
                                                height: 60,
                                                borderRadius: '50%',
                                                border: '1px solid',
                                                borderColor: 'primary.main',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
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

                {/* Código QR */}
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
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <QrCode2Icon />
                                    <span>Código QR</span>
                                </Stack>
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Los alumnos pueden escanear este código para acceder directamente al portal
                            </Typography>
                        </Box>

                        <Divider />

                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems="center">
                            {/* QR Code */}
                            <Box
                                ref={qrRef}
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    p: 3,
                                    bgcolor: '#fff',
                                    borderRadius: 2,
                                    boxShadow: 3,
                                }}
                            >
                                <QRCodeSVG
                                    value={portalUrl}
                                    size={256}
                                    level="H"
                                    includeMargin={true}
                                    fgColor={primaryColor}
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                                    {gymName}
                                </Typography>
                            </Box>

                            {/* Instrucciones */}
                            <Box flex={1}>
                                <Stack spacing={2}>
                                    <Typography variant="subtitle1" fontWeight="bold">
                                        ¿Cómo usar el código QR?
                                    </Typography>

                                    <Box component="ol" sx={{ pl: 2, '& li': { mb: 1 } }}>
                                        <li>
                                            <Typography variant="body2">
                                                Descarga el código QR o tómale una captura de pantalla
                                            </Typography>
                                        </li>
                                        <li>
                                            <Typography variant="body2">
                                                Compártelo en tu gimnasio (cartelera, entrada, recepción)
                                            </Typography>
                                        </li>
                                        <li>
                                            <Typography variant="body2">
                                                Los alumnos lo escanean con su celular
                                            </Typography>
                                        </li>
                                        <li>
                                            <Typography variant="body2">
                                                Acceden directamente con su DNI
                                            </Typography>
                                        </li>
                                    </Box>

                                    <Button
                                        variant="contained"
                                        startIcon={<DownloadIcon />}
                                        onClick={handleDownloadQR}
                                        fullWidth
                                        sx={{ mt: 2 }}
                                    >
                                        Descargar código QR
                                    </Button>

                                    <Alert severity="success">
                                        <Typography variant="body2">
                                            💡 <strong>Recomendación:</strong> Imprime el QR en alta calidad
                                            y colócalo en lugares visibles del gimnasio
                                        </Typography>
                                    </Alert>
                                </Stack>
                            </Box>
                        </Stack>
                    </Stack>
                </Paper>
            </Stack>
        </Container>
    )
}
