"use client"

import { useState } from "react"
import { Box, Stack, Typography, FormControlLabel, Switch, ToggleButtonGroup, ToggleButton, MenuItem, TextField, Divider } from "@mui/material"
import { ColorPickerPopover } from "../colorSelector/colorSelector"

export type ThemeSettings = {
  theme: {
    palette: {
      primary: string
      secondary: string   // lo dejamos por compatibilidad, no se edita acá
      background: string
      surface: string
      text: { primary: string; secondary: string } // idem
    }
    typography: { fontFamily: string }
    shape: { borderRadius: number }
    misc?: { generateLogoFromPrimary?: boolean }
  }
}

const DEFAULTS: ThemeSettings = {
  theme: {
    palette: {
      primary: "#ff8000",
      secondary: "#4DB6AC",
      background: "#F1F8F6",
      surface: "#FFFFFF",
      text: { primary: "#1A1A1A", secondary: "#4DB6AC" },
    },
    typography: { fontFamily: "Quicksand, sans-serif" },
    shape: { borderRadius: 12 },
    misc: { generateLogoFromPrimary: true },
  },
}

export function GymThemeEditor({
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
      <Typography variant="h6" sx={{ mb: 1 }}>Tema del gimnasio</Typography>
      <Stack spacing={2}>
        <ColorPickerPopover
          label="Color primario"
          value={settings.theme.palette.primary}
          onChange={(c) => update({ palette: { ...settings.theme.palette, primary: c } })}
        />

        <ColorPickerPopover
          label="Fondo (background)"
          value={settings.theme.palette.background}
          onChange={(c) => update({ palette: { ...settings.theme.palette, background: c } })}
        />

        <Divider />

        <TextField
          select
          label="Tipografía"
          fullWidth
          value={settings.theme.typography.fontFamily}
          onChange={(e) => update({ typography: { fontFamily: e.target.value } })}
        >
          <MenuItem value={"Quicksand, sans-serif"}>Quicksand</MenuItem>
          <MenuItem value={"Roboto, sans-serif"}>Roboto</MenuItem>
          <MenuItem value={"Poppins, sans-serif"}>Poppins</MenuItem>
        </TextField>

        <Stack>
          <Typography variant="body2" sx={{ mb: .5 }}>Bordes</Typography>
          <ToggleButtonGroup
            exclusive
            value={settings.theme.shape.borderRadius}
            onChange={(_, v) => v != null && update({ shape: { borderRadius: v } })}
            size="small"
          >
            <ToggleButton value={8}>Suave</ToggleButton>
            <ToggleButton value={12}>Medio</ToggleButton>
            <ToggleButton value={16}>Redondo</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        <FormControlLabel
          control={
            <Switch
              checked={!!settings.theme.misc?.generateLogoFromPrimary}
              onChange={(e) =>
                update({ misc: { ...(settings.theme.misc ?? {}), generateLogoFromPrimary: e.target.checked } })
              }
            />
          }
          label="Generar logo con el color primario (si no cargo URL)"
        />
      </Stack>
    </Box>
  )
}
