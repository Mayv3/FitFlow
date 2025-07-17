'use client';

import { SideBar } from "@/components/dashboard/header/SideBar";
import { memberTabs } from "@/components/dashboard/header/sideBarTabs";
import { useAuthRole } from "@/hooks/useAuthRole";

export const MemberLayout = ({ children }: { children: React.ReactNode }) => {
  useAuthRole('miembro');

  return (
    <div style={{ display: 'flex' }}>
      <SideBar tabs={memberTabs} />
      <main style={{ flexGrow: 1, padding: '2rem' }}>
        {children}
      </main>
    </div>
  );
};
