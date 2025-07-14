import { MemberLayout } from '@/layouts/MemberLayout';

const MemberDashboard = () => {
  return <div>Panel del alumno</div>;
};

MemberDashboard.getLayout = (page: React.ReactNode) => <MemberLayout>{page}</MemberLayout>;

export default MemberDashboard;