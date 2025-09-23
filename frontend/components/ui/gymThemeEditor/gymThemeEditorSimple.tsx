"use client"

import { useState, useEffect } from "react"
import {
    Box,
    Stack,
    Typography,
    ToggleButtonGroup,
    ToggleButton,
    MenuItem,
    TextField,
    Divider,
    Button,
    CircularProgress,
} from "@mui/material"
import { ColorPickerPopover } from "../colorSelector/colorSelector"
import Cookies from "js-cookie"
import axios from "axios"

export type ThemeSettings = {
    theme: {
        palette: {
            primary: string
            secondary: string
            background: string
            surface: string
            text: { primary: string; secondary: string }
        }
        typography: { fontFamily: string }
        shape: { borderRadius: number }
    }
}

const DEFAULTS: ThemeSettings = {
    theme: {
        palette: {
            primary: "#2196F3",
            secondary: "#4DB6AC",
            background: "#F1F8F6",
            surface: "#FFFFFF",
            text: { primary: "#1A1A1A", secondary: "#4DB6AC" },
        },
        typography: { fontFamily: "Quicksand, sans-serif" },
        shape: { borderRadius: 12 },
    },
}

const FONT_OPTIONS = [
    { label: "Quicksand", value: "Quicksand, sans-serif" },
    { label: "Roboto", value: "Roboto, sans-serif" },
    { label: "Montserrat", value: "Montserrat, sans-serif" },
    { label: "Merriweather", value: "Merriweather, serif" },
]

export function GymThemeEditorSimple({
    value,
    onChange,
}: {
    value?: ThemeSettings
    onChange: (v: ThemeSettings) => void
}) {
    const [settings, setSettings] = useState<ThemeSettings>(value ?? DEFAULTS)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        try {
            const saved = localStorage.getItem("gym_settings")
            if (saved) {
                const parsed = JSON.parse(saved)
                if (parsed.colors) {
                    const adapted: ThemeSettings = {
                        theme: {
                            palette: {
                                primary: parsed.colors.primary,
                                secondary: parsed.colors.secondary,
                                background: parsed.colors.background,
                                surface: parsed.colors.paper,
                                text: {
                                    primary: parsed.colors.textPrimary,
                                    secondary: parsed.colors.textSecondary,
                                },
                            },
                            typography: parsed.typography,
                            shape: parsed.shape,
                        },
                    }
                    setSettings(adapted)
                    onChange(adapted)
                }
            }
        } catch (e) {
            console.warn("Error parseando gym_settings", e)
        }
    }, [])

    const update = (patch: Partial<ThemeSettings["theme"]>) => {
        const next = { ...settings, theme: { ...settings.theme, ...patch } }
        setSettings(next)
        onChange(next)
    }

    const handleReiniciar = () => {
        try {
            const saved = localStorage.getItem("gym_settings")
            if (saved) {
                const parsed = JSON.parse(saved)
                if (parsed.colors) {
                    const adapted: ThemeSettings = {
                        theme: {
                            palette: {
                                primary: parsed.colors.primary,
                                secondary: parsed.colors.secondary,
                                background: parsed.colors.background,
                                surface: parsed.colors.paper,
                                text: {
                                    primary: parsed.colors.textPrimary,
                                    secondary: parsed.colors.textSecondary,
                                },
                            },
                            typography: parsed.typography,
                            shape: parsed.shape,
                        },
                    }
                    setSettings(adapted)
                    onChange(adapted)
                }
            }
        } catch (e) {
            console.error("Error al reiniciar tema", e)
        }
    }

    const handleGuardar = async () => {
        try {
            setLoading(true)
            const payload = {
                colors: {
                    primary: settings.theme.palette.primary,
                    secondary: settings.theme.palette.secondary,
                    background: settings.theme.palette.background,
                    paper: settings.theme.palette.surface,
                    textPrimary: settings.theme.palette.text.primary,
                    textSecondary: settings.theme.palette.text.secondary,
                },
                typography: settings.theme.typography,
                shape: settings.theme.shape,
            }

            const token = Cookies.get("token")

            await axios.put(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/gyms/settings`,
                payload,
                token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
            )

            localStorage.setItem("gym_settings", JSON.stringify(payload))

            window.location.reload()

        } catch (err) {
            console.error("Error guardando el tema", err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2 }}
            >
                Personalizá el aspecto de tu gimnasio eligiendo el color principal,
                la tipografía y el estilo de los bordes.
            </Typography>

            <Box sx={{ flexGrow: 1 }}>
                <Stack spacing={2}>
                    <ColorPickerPopover
                        label="Color primario"
                        value={settings.theme.palette.primary}
                        onChange={(c) =>
                            update({ palette: { ...settings.theme.palette, primary: c } })
                        }
                    />

                    <Divider />

                    <TextField
                        select
                        label="Tipografía"
                        fullWidth
                        value={settings.theme.typography.fontFamily}
                        onChange={(e) =>
                            update({ typography: { fontFamily: e.target.value } })
                        }
                    >
                        {FONT_OPTIONS.map((font) => (
                            <MenuItem key={font.value} value={font.value}>
                                {font.label}
                            </MenuItem>
                        ))}
                    </TextField>

                    <Stack>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                            Bordes
                        </Typography>
                        <ToggleButtonGroup
                            exclusive
                            value={settings.theme.shape.borderRadius}
                            onChange={(_, v) =>
                                v != null && update({ shape: { borderRadius: v } })
                            }
                            size="small"
                        >
                            <ToggleButton value={8}>Suave</ToggleButton>
                            <ToggleButton value={12}>Medio</ToggleButton>
                            <ToggleButton value={16}>Redondo</ToggleButton>
                        </ToggleButtonGroup>
                    </Stack>
                </Stack>
            </Box>

            <Box
                sx={{
                    display: "flex",
                    gap: 2,
                    justifyContent: { xs: 'center', md: 'flex-end' },
                    pt: 2,
                }}
            >
                <Button variant="outlined" onClick={handleReiniciar} disabled={loading}>
                    Reiniciar
                </Button>

                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleGuardar}
                    disabled={loading}
                >
                    {loading ? <CircularProgress size={20} /> : "Guardar cambios"}
                </Button>
            </Box>
        </Box>
    )
}
