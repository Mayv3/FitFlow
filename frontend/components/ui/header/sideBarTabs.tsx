import HomeIcon from '@mui/icons-material/Home';
import GroupIcon from '@mui/icons-material/Group';
import PaidIcon from '@mui/icons-material/Paid';
import BarChartIcon from '@mui/icons-material/BarChart';
import TodayIcon from '@mui/icons-material/Today';
import SettingsIcon from '@mui/icons-material/Settings';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HelpIcon from '@mui/icons-material/Help';

export const adminTabs = [
  { label: 'Inicio', icon: <HomeIcon />, route: '/dashboard/administrator' },
  { label: 'Miembros', icon: <GroupIcon />, route: '/dashboard/administrator/members' },
  { label: 'Pagos', icon: <PaidIcon />, route: '/dashboard/administrator/payments' },
  { label: 'Turnos', icon: <TodayIcon />, route: '/dashboard/administrator/turnos' },
  { label: 'Planes', icon: <AssignmentIcon />, route: '/dashboard/administrator/plans' },
  { label: 'Estadísticas', icon: <BarChartIcon />, route: '/dashboard/administrator/stats' },
  { label: 'Configuración', icon: <SettingsIcon />, route: '/dashboard/administrator/settings' },
  { label: 'Soporte', icon: <HelpIcon />, route: '/dashboard/administrator/support' },
];

export const recepcionistTabs = [
  { label: 'Inicio', icon: <HomeIcon />, route: '/dashboard/receptionist' },
  { label: 'Miembros', icon: <GroupIcon />, route: '/dashboard/receptionist/members' },
  { label: 'Pagos', icon: <PaidIcon />, route: '/dashboard/receptionist/payments' },
  { label: 'Turnos', icon: <TodayIcon />, route: '/dashboard/receptionist/turnos' },
  { label: 'Planes', icon: <AssignmentIcon />, route: '/dashboard/administrator/plans' },
  { label: 'Soporte', icon: <HelpIcon />, route: '/dashboard/receptionist/support' },
  { label: 'Configuración', icon: <SettingsIcon />, route: '/dashboard/administrator/settings' },
];

export const memberTabs = [
  { label: 'Mi cuenta', icon: <GroupIcon />, route: '/dashboard/member' },
  { label: 'Pagos', icon: <PaidIcon />, route: '/dashboard/member/payments' },
  { label: 'Turnos', icon: <TodayIcon />, route: '/dashboard/member/turnos' },
  { label: 'Configuración', icon: <SettingsIcon />, route: '/dashboard/member/turnos' },
];

export const ownerTabs = [
  { label: 'Registrar', icon: <GroupIcon />, route: '/dashboard/owner/register' },
  { label: 'Configuración', icon: <SettingsIcon />, route: '/dashboard/owner/settings' },
];
