'use client';

import { SideBar } from "@/components/ui/header/SideBar";
import { ownerTabs } from "@/const/headerTabs.tsx/sideBarTabs";
import { useAuthRole } from "@/hooks/auth/useAuthRole";
import { OWNER } from "@/const/roles/roles";
import { useMediaQuery, useTheme } from '@mui/material';
import { ThemeProvider, createTheme, type Theme } from '@mui/material/styles';

// El owner no tiene gym propio, así que en vez del tema por defecto (texto
// secundario turquesa) usa los colores de la marca Fitness Flow.
const brandTheme = (outer: Theme) => {
  const dark = outer.palette.mode === 'dark';
  return createTheme(outer, {
    palette: {
      primary: { main: dark ? '#10C987' : '#0B6E4F', contrastText: dark ? '#04130D' : '#FFFFFF' },
      text: { secondary: dark ? '#9DB8AC' : '#5B6B63' },
    },
    components: {
      MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 700 } } },
    },
  });
};

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  useAuthRole(OWNER);

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      width: '100%'
    }}>
      <SideBar tabs={ownerTabs} color="#063A2B" />
      <ThemeProvider theme={brandTheme}>
        <main style={{
          flexGrow: 1,
          padding: isDesktop ? '2rem' : '1.25rem 1rem',
          marginBottom: isDesktop ? '0px' : '60px',
          marginLeft: isDesktop ? '80px' : '0px',
          width: isDesktop ? '20px' : '100%'
        }}>
          {children}
        </main>
      </ThemeProvider>
    </div>
  );
}
