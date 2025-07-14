import { SideBar } from '@/components/dashboard/header/SideBar';
import { adminTabs } from '@/components/dashboard/header/sideBarTabs';
import { Box } from '@mui/material';

const AdminDashboard = () => {
  return (
    <Box sx={{ ml: '280px', p: 4 }}>
      <h1>Bienvenido al panel del administrador</h1>
    </Box>
  );
};

AdminDashboard.getLayout = (page: React.ReactNode) => (
  <>
    <SideBar tabs={adminTabs} />
    {page}
  </>
);

export default AdminDashboard;