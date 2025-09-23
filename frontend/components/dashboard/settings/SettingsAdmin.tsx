"use client"

import { useState } from "react"
import {
    Box,
    Paper,
    Typography,
} from "@mui/material"
import { ThemeSettings } from "@/components/ui/gymThemeEditor/gymThemeEditor"
import { ThemePreview } from "./ThemePreview"
import { CustomBreadcrumbs } from "@/components/ui/breadcrums/CustomBreadcrumbs"
import { GymThemeEditorSimple } from "@/components/ui/gymThemeEditor/gymThemeEditorSimple"

import PaletteIcon from '@mui/icons-material/Palette';

export function SettingsAdmin() {
    const [themeSettings, setThemeSettings] = useState<ThemeSettings | null>(null)

    return (
        <Box sx={{ maxWidth: 'xl', mx: 'auto', py: 2 }}>
            <CustomBreadcrumbs
                items={[
                    { label: 'Dashboard', href: '' },
                    { label: 'Configuración' }
                ]}
            />
            <Paper sx={{ p: 3 }}>
                <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3 }}>
                    <Box
                        flex={1}
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >

                        <Box>
                            <Typography
                                variant="h6"
                                gutterBottom
                                sx={{ display: "flex", alignItems: "center", gap: 1 }}
                            >
                                <PaletteIcon /> Editor de Tema
                            </Typography>
                            <GymThemeEditorSimple
                                value={themeSettings ?? undefined}
                                onChange={setThemeSettings}
                            />
                        </Box>

                        <Box
                            sx={{
                                display: "flex",
                                gap: 2,
                                justifyContent: "flex-end",
                                mt: "auto",
                            }}
                        >
                        </Box>
                    </Box>

                    <Box flex={1}>
                        <ThemePreview settings={themeSettings} />
                    </Box>
                </Box>
            </Paper>

        </Box>
    )
}
