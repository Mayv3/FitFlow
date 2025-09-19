"use client"

import { useState } from "react"
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    CircularProgress,
    Divider,
} from "@mui/material"
import Cookies from "js-cookie"
import axios from "axios"
import { GymThemeEditor, ThemeSettings } from "@/components/ui/gymThemeEditor/gymThemeEditor"
import { ThemePreview } from "./ThemePreview"
import { CustomBreadcrumbs } from "@/components/ui/breadcrums/CustomBreadcrumbs"
import { GymThemeEditorSimple } from "@/components/ui/gymThemeEditor/gymThemeEditorSimple"

type SettingsPayload = {
    colors: {
        primary: string
        secondary: string
        background: string
        paper: string
        textPrimary: string
        textSecondary: string
    }
    typography: { fontFamily: string }
    shape: { borderRadius: number }
}

function toSettingsPayload(ts: ThemeSettings): SettingsPayload {
    return {
        colors: {
            primary: ts.theme.palette.primary,
            secondary: ts.theme.palette.secondary,
            background: ts.theme.palette.background,
            paper: ts.theme.palette.surface,
            textPrimary: ts.theme.palette.text.primary,
            textSecondary: ts.theme.palette.text.secondary,
        },
        typography: { fontFamily: ts.theme.typography.fontFamily },
        shape: { borderRadius: ts.theme.shape.borderRadius },
    }
}

export function SettingsAdmin() {
    const [themeSettings, setThemeSettings] = useState<ThemeSettings | null>(null)
    const [loadingTheme, setLoadingTheme] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [repeatPassword, setRepeatPassword] = useState("")
    const [loadingPass, setLoadingPass] = useState(false)

    const handleSaveTheme = async () => {
        setError("")
        setSuccess("")
        if (!themeSettings) return setError("Configurá el tema antes de guardar.")
        setLoadingTheme(true)
        try {
            const token = Cookies.get("token")
            const payload = toSettingsPayload(themeSettings)

            await axios.put(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/gyms/settings`,
                payload,
                token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
            )

            setSuccess("Tema actualizado con éxito ✅")
        } catch (e: any) {
            setError(e.response?.data?.error || "No se pudo guardar el tema")
        } finally {
            setLoadingTheme(false)
        }
    }


    const handleChangePassword = async () => {
        setError("")
        setSuccess("")
        if (newPassword !== repeatPassword) {
            return setError("Las contraseñas nuevas no coinciden.")
        }
        setLoadingPass(true)
        try {
            const token = Cookies.get("token")
            await axios.put(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/change-password`,
                { currentPassword, newPassword },
                token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
            )
            setSuccess("Contraseña cambiada con éxito 🔑")
            setCurrentPassword("")
            setNewPassword("")
            setRepeatPassword("")
        } catch (e: any) {
            setError(e.response?.data?.error || "Error al cambiar la contraseña")
        } finally {
            setLoadingPass(false)
        }
    }

    return (
        <Box sx={{ maxWidth: 'xl', mx: 'auto', py: 2 }}>
            <CustomBreadcrumbs
                items={[
                    { label: 'Dashboard', href: '' },
                    { label: 'Configuración' }
                ]}
            />
            <Paper sx={{ p: 3 }}>
                {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
                {success && <Typography color="success.main" sx={{ mb: 2 }}>{success}</Typography>}

                <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3 }}>
                    <Box flex={1}>
                        <Typography variant="h6" gutterBottom>
                            🎨 Editor de Tema
                        </Typography>
                        <GymThemeEditorSimple value={themeSettings ?? undefined} onChange={setThemeSettings} />
                    </Box>

                    <Box flex={1}>
                        <ThemePreview settings={themeSettings} />
                    </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>🔑 Cambiar Contraseña</Typography>
                <TextField
                    label="Contraseña actual"
                    type="password"
                    fullWidth
                    margin="normal"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <TextField
                    label="Nueva contraseña"
                    type="password"
                    fullWidth
                    margin="normal"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                />
                <TextField
                    label="Repetir nueva contraseña"
                    type="password"
                    fullWidth
                    margin="normal"
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                />

                <Box sx={{ mt: 2, textAlign: "right" }}>
                    <Button variant="contained" color="secondary" onClick={handleChangePassword} disabled={loadingPass}>
                        {loadingPass ? <CircularProgress size={24} /> : "Cambiar contraseña"}
                    </Button>
                </Box>
            </Paper>
        </Box>

    )
}
