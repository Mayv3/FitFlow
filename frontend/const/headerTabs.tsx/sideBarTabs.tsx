import GroupIcon from '@mui/icons-material/Group';
import PaidIcon from '@mui/icons-material/Paid';
import BarChartIcon from '@mui/icons-material/BarChart';
import TodayIcon from '@mui/icons-material/Today';
import SettingsIcon from '@mui/icons-material/Settings';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import StorefrontIcon from "@mui/icons-material/Storefront"

export const adminTabs = [
  { label: 'Estadísticas', icon: <BarChartIcon />, route: '/dashboard/administrator/stats' },
  { label: 'Asistencias', icon: <AssignmentTurnedInIcon />, route: '/dashboard/administrator/assists' },
  { label: 'Miembros', icon: <GroupIcon />, route: '/dashboard/administrator/members' },
  { label: 'Pagos', icon: <PaidIcon />, route: '/dashboard/administrator/payments' },
  { label: 'Planes', icon: <AssignmentIcon />, route: '/dashboard/administrator/plans' },
  { label: 'Servicios', icon: <AccessibilityNewIcon />, route: '/dashboard/administrator/services' },
  { label: 'Turnos', icon: <TodayIcon />, route: '/dashboard/administrator/appointments' },
  { label: 'Configuración', icon: <SettingsIcon />, route: '/dashboard/administrator/settings' },
  // { label: 'Soporte', icon: <HelpIcon />, route: '/dashboard/administrator/support' },
];

export const recepcionistTabs = [
  { label: 'Asistencias', icon: <AssignmentTurnedInIcon />, route: '/dashboard/receptionist/assists' },
  { label: 'Miembros', icon: <GroupIcon />, route: '/dashboard/receptionist/members' },
  { label: 'Pagos', icon: <PaidIcon />, route: '/dashboard/receptionist/payments' },
  { label: 'Planes', icon: <AssignmentIcon />, route: '/dashboard/receptionist/plans' },
  { label: 'Servicios', icon: <AccessibilityNewIcon />, route: '/dashboard/receptionist/services' },
  { label: 'Turnos', icon: <TodayIcon />, route: '/dashboard/receptionist/appointments' },
  // { label: 'Soporte', icon: <HelpIcon />, route: '/dashboard/receptionist/support' },
];

export const ownerTabs = [
  { label: "Onboarding", icon: <StorefrontIcon />, route: "/dashboard/owner/onboarding" },
]

// To do

export const memberTabs = [
  { label: 'Mi cuenta', icon: <GroupIcon />, route: '/dashboard/member' },
  { label: 'Pagos', icon: <PaidIcon />, route: '/dashboard/member/payments' },
  { label: 'Turnos', icon: <TodayIcon />, route: '/dashboard/member/appointments' },
  { label: 'Asistencias', icon: <AssignmentTurnedInIcon />, route: '/dashboard/receptionist/assists' },
  { label: 'Configuración', icon: <SettingsIcon />, route: '/dashboard/member/settings' },
];