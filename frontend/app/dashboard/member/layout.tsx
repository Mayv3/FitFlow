import { SideBar } from "@/components/dashboard/header/SideBar";
import { memberTabs } from "@/components/dashboard/header/sideBarTabs";

export const MemberLayout = ({ children }: any) => (
  <div style={{ display: 'flex' }}>
    <SideBar tabs={memberTabs} />
    <main style={{ flexGrow: 1, padding: '2rem' }}>{children}</main>
  </div>
);
