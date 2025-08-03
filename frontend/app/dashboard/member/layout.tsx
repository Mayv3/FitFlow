'use client';

import { SideBar } from "@/components/ui/header/SideBar";
import { memberTabs } from "@/components/ui/header/sideBarTabs";
import { useAuthRole } from "@/hooks/useAuthRole";
import { SOCIO } from "@/const/roles/roles";
export const MemberLayout = ({ children }: { children: React.ReactNode }) => {
  useAuthRole(SOCIO);

  return (
    <div style={{ display: 'flex' }}>
      <SideBar tabs={memberTabs} />
      <main style={{ flexGrow: 1, padding: '2rem' }}>
        {children}
      </main>
    </div>
  );
};
