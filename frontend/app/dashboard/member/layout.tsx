'use client';

import { SideBar } from "@/components/ui/header/SideBar";
import { memberTabs } from "@/components/ui/header/sideBarTabs";
import { useAuthRole } from "@/hooks/auth/useAuthRole";
import { SOCIO } from "@/const/roles/roles";
import { useMediaQuery, useTheme } from '@mui/material';

export const MemberLayout = ({ children }: { children: React.ReactNode }) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  useAuthRole(SOCIO);

  return (
    <div style={{ 
      display: 'flex',
      minHeight: '100vh',
      width: '100%'
    }}>
      <SideBar tabs={memberTabs} />
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
};
