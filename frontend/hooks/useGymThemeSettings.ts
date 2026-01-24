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
  const [borderRadius, setBorderRadius] = useState<number>(1.5); // default Material-UI value (12px / 8)

  useEffect(() => {
    try {
      const gymSettingsStr = localStorage.getItem('gym_settings');
      if (gymSettingsStr) {
        const gymSettings = JSON.parse(gymSettingsStr) as GymThemeSettings;
        if (gymSettings.shape?.borderRadius) {
          // Convert from pixels to Material-UI units (divide by 8)
          const muBorderRadius = gymSettings.shape.borderRadius / 8;
          setBorderRadius(muBorderRadius);
        }
      }
    } catch (error) {
      console.error('Error reading gym theme settings from localStorage:', error);
    }
  }, []);

  return {
    borderRadius,
  };
}
