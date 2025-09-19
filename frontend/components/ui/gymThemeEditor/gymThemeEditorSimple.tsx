"use client"

import { useState } from "react"
import {
    Box,
    Stack,
    Typography,
    ToggleButtonGroup,
    ToggleButton,
    MenuItem,
    TextField,
    Divider,
} from "@mui/material"
import { ColorPickerPopover } from "../colorSelector/colorSelector"

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
            primary: "",
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

    const update = (patch: Partial<ThemeSettings["theme"]>) => {
        const next = { ...settings, theme: { ...settings.theme, ...patch } }
        setSettings(next)
        onChange(next)
    }

    return (
        <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Personalizá el aspecto de tu gimnasio eligiendo el color principal, la tipografía y el estilo de los bordes.
                Estos ajustes se aplicarán en toda la plataforma para mantener una identidad visual coherente.
            </Typography>

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
                    <Typography variant="body2" sx={{ mb: 0.5 }}>Bordes</Typography>
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
    )
}
