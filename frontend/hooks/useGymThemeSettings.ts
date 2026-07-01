import { useEffect, useState } from 'react';

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

export function useGymThemeSettings() {
  const [borderRadius, setBorderRadius] = useState<number>(1.5);
  const [primaryColor, setPrimaryColor] = useState<string>('#16A34A');

  useEffect(() => {
    try {
      const gymSettingsStr = sessionStorage.getItem('gym_settings');
      if (gymSettingsStr) {
        const gymSettings = JSON.parse(gymSettingsStr) as GymThemeSettings;
        if (gymSettings.shape?.borderRadius) {
          const muBorderRadius = gymSettings.shape.borderRadius / 8;
          setBorderRadius(muBorderRadius);
        }
        if (gymSettings.colors?.primary) {
          setPrimaryColor(gymSettings.colors.primary);
        }
      }
    } catch (error) {
      console.error('Error reading gym theme settings from localStorage:', error);
    }
  }, []);

  return {
    borderRadius,
    primaryColor,
  };
}
