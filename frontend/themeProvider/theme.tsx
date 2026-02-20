import { createTheme, type Theme } from "@mui/material/styles"

export type GymSettings = {
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

export const DEFAULT_SETTINGS: GymSettings = {
  colors: {
    primary: "#0dc985",
    secondary: "#4DB6AC",
    background: "#F1F8F6",
    paper: "#FFFFFF",
    textPrimary: "#1A1A1A",
    textSecondary: "#4DB6AC",
  },
  typography: { fontFamily: "'Quicksand', sans-serif" },
  shape: { borderRadius: 12 },
}

const DARK_MODE_OVERRIDES = {
  background: "#121212",
  paper: "#1E1E1E",
  textPrimary: "#FFFFFF",
  textSecondary: "#B0BEC5",
}

function buildTheme(s: GymSettings, isDarkMode: boolean = false): Theme {
  const palette = isDarkMode
    ? {
        mode: "dark" as const,
        primary: { main: s.colors.primary, contrastText: "#FFFFFF" },
        secondary: { main: s.colors.secondary, contrastText: "#FFFFFF" },
        background: { default: DARK_MODE_OVERRIDES.background, paper: DARK_MODE_OVERRIDES.paper },
        text: { primary: DARK_MODE_OVERRIDES.textPrimary, secondary: DARK_MODE_OVERRIDES.textSecondary },
      }
    : {
        mode: "light" as const,
        primary: { main: s.colors.primary, contrastText: "#FFFFFF" },
        secondary: { main: s.colors.secondary, contrastText: "#FFFFFF" },
        background: { default: s.colors.background, paper: s.colors.paper },
        text: { primary: s.colors.textPrimary, secondary: s.colors.textSecondary },
      }

  return createTheme({
    components: {
      MuiTextField: {
        styleOverrides: {
          root: {
            "& input[type=number]::-webkit-inner-spin-button, & input[type=number]::-webkit-outer-spin-button": {
              WebkitAppearance: "none",
              margin: 0,
            },
            "& input[type=number]": { MozAppearance: "textfield" },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            backgroundColor: "inherit",
          },
        },
      },
    },
    palette,
    typography: { fontFamily: s.typography.fontFamily },
    shape: { borderRadius: s.shape.borderRadius },
  })
}

function readSettingsFromStorage(): GymSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem("gym_settings")
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw)

    return {
      colors: {
        primary: parsed?.colors?.primary ?? DEFAULT_SETTINGS.colors.primary,
        secondary: parsed?.colors?.secondary ?? DEFAULT_SETTINGS.colors.secondary,
        background: parsed?.colors?.background ?? DEFAULT_SETTINGS.colors.background,
        paper: parsed?.colors?.paper ?? DEFAULT_SETTINGS.colors.paper,
        textPrimary: parsed?.colors?.textPrimary ?? DEFAULT_SETTINGS.colors.textPrimary,
        textSecondary: parsed?.colors?.textSecondary ?? DEFAULT_SETTINGS.colors.textSecondary,
      },
      typography: {
        fontFamily: parsed?.typography?.fontFamily ?? DEFAULT_SETTINGS.typography.fontFamily,
      },
      shape: {
        borderRadius:
          typeof parsed?.shape?.borderRadius === "number"
            ? parsed.shape.borderRadius
            : DEFAULT_SETTINGS.shape.borderRadius,
      },
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export const DEFAULT_THEME = buildTheme(DEFAULT_SETTINGS, false)

export function createAppTheme(isDarkMode: boolean = false): Theme {
  return buildTheme(readSettingsFromStorage(), isDarkMode)
}
