import HomeIcon from '@mui/icons-material/Home';
import GroupIcon from '@mui/icons-material/Group';
import PaidIcon from '@mui/icons-material/Paid';
import BarChartIcon from '@mui/icons-material/BarChart';
import TodayIcon from '@mui/icons-material/Today';

export const adminTabs = [
  { label: 'Inicio', icon: <HomeIcon />, route: '/dashboard/administrator' },
  { label: 'Miembros', icon: <GroupIcon />, route: '/dashboard/administrator/members' },
  { label: 'Pagos', icon: <PaidIcon />, route: '/dashboard/administrator/payments' },
  { label: 'Estadísticas', icon: <BarChartIcon />, route: '/dashboard/administrator/stats'},
];

export const recepcionistTabs = [
  { label: 'Inicio', icon: <HomeIcon />, route: '/dashboard/receptionist' },
  { label: 'Miembros', icon: <GroupIcon />, route: '/dashboard/receptionist/members' },
  { label: 'Pagos', icon: <PaidIcon />, route: '/dashboard/receptionist/payments' },
  { label: 'Turnos', icon: <TodayIcon />, route: '/dashboard/receptionist/turnos' },
];

export const memberTabs = [
  { label: 'Mi cuenta', icon: <GroupIcon />, route: '/dashboard/member' },
  { label: 'Pagos', icon: <PaidIcon />, route: '/dashboard/member/payments' },
];