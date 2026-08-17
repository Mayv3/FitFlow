'use client';

import { SideBar } from "@/components/ui/header/SideBar";
import { SubscriptionStatusBadge } from "@/components/ui/SubscriptionStatusBadge";
import { adminTabs } from "@/const/headerTabs.tsx/sideBarTabs";
import { useAuthRole } from "@/hooks/auth/useAuthRole";
import { ADMINISTRADOR } from "@/const/roles/roles";
import { useMediaQuery, useTheme } from '@mui/material';
import NovedadesModal from "@/components/dashboard/novedades/NovedadesBanner";
import { WhatsappDisconnectedBanner } from "@/components/dashboard/settings/WhatsappDisconnectedBanner";
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  useAuthRole(ADMINISTRADOR);

  return (
    <div style={{
      display: 'flex',  
      minHeight: '100vh',
      width: '100%'
    }}>
      <SideBar tabs={adminTabs} />
      <SubscriptionStatusBadge />
      <main style={{
        flexGrow: 1,
        padding: '1rem',
        marginBottom: isDesktop ? '0px' : '60px',
        marginLeft: isDesktop ? '80px' : '0px',
        width: isDesktop ? 'auto' : '100%'
      }}>
        <NovedadesModal />
        <WhatsappDisconnectedBanner />
        {children}
      </main>
    </div>
  );
}
