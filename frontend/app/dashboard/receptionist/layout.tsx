'use client';

import { SideBar } from "@/components/dashboard/header/SideBar";
import { recepcionistTabs } from "@/components/dashboard/header/sideBarTabs";

export default function ReceptionistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex' }}>
      <SideBar tabs={recepcionistTabs}/>
      <main style={{ flexGrow: 1, padding: '2rem' }} className="md:ml-[330px]">{children}</main>
    </div>
  );
}
