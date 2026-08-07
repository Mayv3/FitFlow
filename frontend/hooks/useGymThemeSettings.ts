'use client';

import { useClientSnapshot } from '@/hooks/useClientSnapshot';

export interface GymThemeSettings {
  shape: {
    borderRadius: number;
  };
  colors: {
    paper: string;
    primary: string;
    secondary: string;
    background: string;
    textPrimary: string;
    textSecondary: string;
  };
  typography: {
    fontFamily: string;
  };
}

const BORDER_RADIUS_DEFAULT = 1.5;
const PRIMARY_DEFAULT = '#16A34A';

// getSnapshot corre en cada render, asi que se cachea el parseo contra el string
// crudo: solo se vuelve a parsear si sessionStorage realmente cambio.
let rawCache: string | null = null;
let parsedCache: GymThemeSettings | null = null;

function leerSettings(): GymThemeSettings | null {
  try {
    const raw = sessionStorage.getItem('gym_settings');
    if (raw !== rawCache) {
      rawCache = raw;
      parsedCache = raw ? (JSON.parse(raw) as GymThemeSettings) : null;
    }
    return parsedCache;
  } catch (error) {
    console.error('Error reading gym theme settings from sessionStorage:', error);
    return null;
  }
}

const leerBorderRadius = () => {
  const radius = leerSettings()?.shape?.borderRadius;
  // MUI usa multiplos de 8px.
  return radius ? radius / 8 : BORDER_RADIUS_DEFAULT;
};

const leerPrimaryColor = () => leerSettings()?.colors?.primary ?? PRIMARY_DEFAULT;

const borderRadiusEnServer = () => BORDER_RADIUS_DEFAULT;
const primaryColorEnServer = () => PRIMARY_DEFAULT;

/**
 * Tema del gimnasio guardado en sessionStorage. Antes era useState + useEffect,
 * lo que hacia que cada consumidor renderizara primero con los valores por
 * defecto y despues otra vez con los reales (flash de color en toda la app).
 */
export function useGymThemeSettings() {
  const borderRadius = useClientSnapshot(leerBorderRadius, borderRadiusEnServer);
  const primaryColor = useClientSnapshot(leerPrimaryColor, primaryColorEnServer);

  return {
    borderRadius,
    primaryColor,
  };
}
