import GroupIcon from '@mui/icons-material/Group';
import PaidIcon from '@mui/icons-material/Paid';
import BarChartIcon from '@mui/icons-material/BarChart';
import TodayIcon from '@mui/icons-material/Today';
import SettingsIcon from '@mui/icons-material/Settings';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import StorefrontIcon from "@mui/icons-material/Storefront"
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import LinkIcon from '@mui/icons-material/Link';
import InventoryIcon from '@mui/icons-material/Inventory';
import AnnouncementIcon from '@mui/icons-material/Announcement';

export const adminTabs = [
  { label: 'Novedades', icon: <AnnouncementIcon />, route: '/dashboard/administrator/novedades', section: 'Inicio' },
  { label: 'Estadísticas', icon: <BarChartIcon />, route: '/dashboard/administrator/stats', section: 'Inicio' },
  { label: 'Asistencias', icon: <AssignmentTurnedInIcon />, route: '/dashboard/administrator/assists', section: 'Inicio' },
  { label: 'Miembros', icon: <GroupIcon />, route: '/dashboard/administrator/members', section: 'Gestión' },
  { label: 'Pagos', icon: <PaidIcon />, route: '/dashboard/administrator/payments', section: 'Gestión' },
  { label: 'Planes', icon: <AssignmentIcon />, route: '/dashboard/administrator/plans', section: 'Gestión' },
  { label: 'Clases', icon: <FitnessCenterIcon />, route: '/dashboard/administrator/clases', section: 'Gestión' },
  { label: 'Servicios', icon: <AccessibilityNewIcon />, route: '/dashboard/administrator/services', section: 'Gestión' },
  { label: 'Productos', icon: <InventoryIcon />, route: '/dashboard/administrator/products', section: 'Gestión' },
  { label: 'Turnos', icon: <TodayIcon />, route: '/dashboard/administrator/appointments', section: 'Gestión' },
  { label: 'Portal Alumnos', icon: <LinkIcon />, route: '/dashboard/administrator/portal', section: 'Config' },
  { label: 'Configuración', icon: <SettingsIcon />, route: '/dashboard/administrator/settings', section: 'Config' },
  // { label: 'Soporte', icon: <HelpIcon />, route: '/dashboard/administrator/support', section: 'Config' },
];

export const recepcionistTabs = [
  { label: 'Novedades', icon: <AnnouncementIcon />, route: '/dashboard/receptionist/novedades', section: 'Inicio' },
  { label: 'Asistencias', icon: <AssignmentTurnedInIcon />, route: '/dashboard/receptionist/assists', section: 'Inicio' },
  { label: 'Miembros', icon: <GroupIcon />, route: '/dashboard/receptionist/members', section: 'Gestión' },
  { label: 'Pagos', icon: <PaidIcon />, route: '/dashboard/receptionist/payments', section: 'Gestión' },
  { label: 'Planes', icon: <AssignmentIcon />, route: '/dashboard/receptionist/plans', section: 'Gestión' },
  { label: 'Clases', icon: <FitnessCenterIcon />, route: '/dashboard/receptionist/clases', section: 'Gestión' },
  { label: 'Servicios', icon: <AccessibilityNewIcon />, route: '/dashboard/receptionist/services', section: 'Gestión' },
  { label: 'Productos', icon: <InventoryIcon />, route: '/dashboard/receptionist/products', section: 'Gestión' },
  { label: 'Turnos', icon: <TodayIcon />, route: '/dashboard/receptionist/appointments', section: 'Gestión' },
  { label: 'Portal Alumnos', icon: <LinkIcon />, route: '/dashboard/receptionist/portal', section: 'Config' },
  // { label: 'Soporte', icon: <HelpIcon />, route: '/dashboard/receptionist/support', section: 'Config' },
];

export const ownerTabs = [
  { label: "Dashboard", icon: <StorefrontIcon />, route: "/dashboard/owner" },
]

export const memberTabs = [
  { label: 'Mi cuenta', icon: <GroupIcon />, route: '/dashboard/member' },
  { label: 'Pagos', icon: <PaidIcon />, route: '/dashboard/member/payments' },
  { label: 'Turnos', icon: <TodayIcon />, route: '/dashboard/member/appointments' },
  { label: 'Asistencias', icon: <AssignmentTurnedInIcon />, route: '/dashboard/receptionist/assists' },
  { label: 'Configuración', icon: <SettingsIcon />, route: '/dashboard/member/settings' },
];