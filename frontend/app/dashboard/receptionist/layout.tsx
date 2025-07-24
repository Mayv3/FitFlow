'use client';

import { SideBar } from "@/components/ui/header/SideBar";
import { recepcionistTabs } from "@/components/ui/header/sideBarTabs";
import { useAuthRole } from "@/hooks/useAuthRole";
import { RECEPCIONISTA } from "@/const/roles";

export default function ReceptionistLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  useAuthRole(RECEPCIONISTA)

  return (
    <div style={{ display: 'flex' }}>
      <SideBar tabs={recepcionistTabs} />
      <main style={{ flexGrow: 1, padding: '2rem' }} className="md:ml-[330px]">
        {children}
      </main>
    </div>
  );
}
