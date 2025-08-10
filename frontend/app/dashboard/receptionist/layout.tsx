'use client';

import { SideBar } from "@/components/ui/header/SideBar";
import { recepcionistTabs } from "@/components/ui/header/sideBarTabs";
import { useAuthRole } from "@/hooks/auth/useAuthRole";
import { RECEPCIONISTA } from "@/const/roles/roles";

export default function ReceptionistLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  useAuthRole(RECEPCIONISTA)

  return (
    <div style={{ display: 'flex' }}>
      <SideBar tabs={recepcionistTabs} />
      <main style={{ flexGrow: 1 }} className="max-w-[80vw] mx-auto mb-20 mt-5 md:max-w-[80%] md:ml-[20%] md:px-5">
        {children}
      </main>
    </div>
  );
}
