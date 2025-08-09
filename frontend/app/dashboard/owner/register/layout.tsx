'use client';

import { SideBar } from "@/components/ui/header/SideBar";
import { ownerTabs } from "@/components/ui/header/sideBarTabs";
import { useAuthRole } from "@/hooks/auth/useAuthRole";
import { OWNER } from "@/const/roles/roles";

export default function ReceptionistLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  useAuthRole(OWNER)

  return (
    <div style={{ display: 'flex' }}>
      <SideBar tabs={ownerTabs} />
      <main style={{ flexGrow: 1, padding: '2rem' }} className="md:ml-[330px]">
        {children}
      </main>
    </div>
  );
}
