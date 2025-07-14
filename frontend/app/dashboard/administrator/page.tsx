import { AdminLayout } from '@/layouts/AdministratorLayout';

const AdminDashboard = () => {
  return <div>Panel del administrador</div>;
};

AdminDashboard.getLayout = (page: React.ReactNode) => (
  <AdminLayout>{page}</AdminLayout>
);
export default AdminDashboard;