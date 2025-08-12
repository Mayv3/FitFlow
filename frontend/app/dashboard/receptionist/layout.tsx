'use client';

import { SideBar } from "@/components/ui/header/SideBar";
import { recepcionistTabs } from "@/components/ui/header/sideBarTabs";
import { useAuthRole } from "@/hooks/auth/useAuthRole";
import { RECEPCIONISTA } from "@/const/roles/roles";
import { useMediaQuery, useTheme } from '@mui/material';

export default function ReceptionistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  useAuthRole(RECEPCIONISTA);

  return (
    <div style={{ 
      display: 'flex',
      minHeight: '100vh',
      width: '100%'
    }}>
      <SideBar tabs={recepcionistTabs} />
      <main style={{ 
        flexGrow: 1, 
        padding: '2rem',
        marginBottom: isDesktop ? '0px' : '60px',
        marginLeft: isDesktop ? '20%' : '0px',
        width: isDesktop ? 'calc(100% - 20%)' : '100%'
      }}>
        {children}
      </main>
    </div>
  );
}
