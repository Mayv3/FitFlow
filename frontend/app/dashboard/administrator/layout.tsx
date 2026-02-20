'use client';

import { SideBar } from "@/components/ui/header/SideBar";
import { SubscriptionStatusBadge } from "@/components/ui/SubscriptionStatusBadge";
import { adminTabs } from "@/const/headerTabs.tsx/sideBarTabs";
import { useAuthRole } from "@/hooks/auth/useAuthRole";
import { ADMINISTRADOR } from "@/const/roles/roles";
import { useMediaQuery, useTheme } from '@mui/material';
import { useSubscription } from '@/context/SubscriptionContext';

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  useAuthRole(ADMINISTRADOR);
  const { isSuspended, isSubscriptionLoading } = useSubscription();

  if (isSuspended || isSubscriptionLoading) return null;

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
        width: isDesktop ? '20px' : '100%'
      }}>
        {children}
      </main>
    </div>
  );
}
