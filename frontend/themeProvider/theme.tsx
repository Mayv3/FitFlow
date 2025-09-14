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

function buildTheme(s: GymSettings): Theme {
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
    },
    palette: {
      mode: "light",
      primary: { main: s.colors.primary, contrastText: "#FFFFFF" },
      secondary: { main: s.colors.secondary, contrastText: "#FFFFFF" },
      background: { default: s.colors.background, paper: s.colors.paper },
      text: { primary: s.colors.textPrimary, secondary: s.colors.textSecondary },
    },
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

export const DEFAULT_THEME = buildTheme(DEFAULT_SETTINGS)

export function createAppTheme(): Theme {
  return buildTheme(readSettingsFromStorage())
}
