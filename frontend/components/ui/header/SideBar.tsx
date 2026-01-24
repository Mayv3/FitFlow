'use client'

import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  useMediaQuery,
  Tooltip,
  Typography,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import LogoutIcon from '@mui/icons-material/Logout'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import LockIcon from '@mui/icons-material/Lock'
import StarIcon from '@mui/icons-material/Star'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import { useEffect, useState } from 'react'
import { useLogout } from '@/hooks/logout/useLogout'
import { useDarkMode } from '@/context/DarkModeContext'
import Cookies from 'js-cookie'
import { useRouter, usePathname } from 'next/navigation'
import { ROLE_ROUTES } from '@/const/roles/roles'
import { useSubscription } from '@/context/SubscriptionContext'
import { SidebarSkeleton } from './SideBarSkeleton'
type TabItem = { label: string; icon: React.ReactNode; route: string }
type HeaderComponentProps = { tabs: TabItem[] }

const ROUTE_FEATURE_MAP: Record<string, string> = {
  'stats': 'stats',
  'clases': 'classes',
  'services': 'services',
  'appointments': 'appointments',
  'portal': 'portal',
  'settings': 'settings',
  'products': 'products',
}

function getFeatureFromRoute(route: string): string | null {
  for (const [key, feature] of Object.entries(ROUTE_FEATURE_MAP)) {
    if (route.includes(key)) return feature
  }
  return null
}

function readPrimary(): string {
  if (typeof window === 'undefined') return '#0dc985'
  try {
    const raw = localStorage.getItem('gym_settings')
    const parsed = raw ? JSON.parse(raw) : null
    return parsed?.colors?.primary || '#0dc985'
  } catch {
    return '#0dc985'
  }
}

export const SideBar = ({ tabs }: HeaderComponentProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mounted, setMounted] = useState(false)

  const [isHovered, setIsHovered] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const isExpanded = isHovered || isLocked

  const router = useRouter()
  const pathname = usePathname()
  const { isDarkMode, toggleDarkMode } = useDarkMode()

  const [gym_name, setGymName] = useState<string | null>(null)
  const [gym_logo_url, setGymLogoUrl] = useState<string | null>(null)
  const [user_name, setUserName] = useState<string | null>(null)
  const [user_role, setUserRole] = useState<string | null>(null)

  const { planName, hasFeature, isSubscriptionActive, isSubscriptionLoading,
  } = useSubscription()

  const [sidebarBg, setSidebarBg] = useState<string>(theme.palette.primary.main)
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)
  const [blockedFeatureName, setBlockedFeatureName] = useState<string>('')

  const defaultLogo = '/images/icon.png'
  const isDefaultLogo = !gym_logo_url

  const logout = useLogout()

  const isTabEnabled = (route: string): boolean => {
    const feature = getFeatureFromRoute(route)
    if (!feature) return true
    if (!isSubscriptionActive) return false
    return hasFeature(feature as any) === true
  }


  const handleNav = (route: string, index?: number, enabled: boolean = true) => {
    if (!enabled) return // No navegar si está deshabilitado
    if (typeof index === 'number') setSelectedIndex(index)
    router.push(route)
  }

  const handleBlockedClick = (tabLabel: string) => {
    setBlockedFeatureName(tabLabel)
    setUpgradeModalOpen(true)
  }

  const getProfileRoute = () => {
    return ROLE_ROUTES[user_role ?? ""] || "/dashboard"
  }

  useEffect(() => {
    setGymName(Cookies.get('gym_name') ?? null)
    setUserName(Cookies.get('name') ?? null)
    setUserRole(Cookies.get('rol') ?? null)
    try {
      setGymLogoUrl(localStorage.getItem('gym_logo_url') || null)
      setSidebarBg(readPrimary())
    } catch { }
    setSidebarBg(readPrimary())
  }, [])

  useEffect(() => {
    const idx = tabs.findIndex(t => t.route === pathname)
    if (idx !== -1) setSelectedIndex(idx)
  }, [pathname, tabs])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'gym_settings' || e.key === 'gym_logo_url') {
        setSidebarBg(readPrimary())
        setGymLogoUrl(localStorage.getItem('gym_logo_url') || null)
      }
    }
    const onCustom = () => {
      setSidebarBg(readPrimary())
      setGymLogoUrl(localStorage.getItem('gym_logo_url') || null)
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('gym-settings-updated', onCustom as EventListener)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('gym-settings-updated', onCustom as EventListener)
    }
  }, [])

  useEffect(() => {
    if (!isLocked) return
    const t = setTimeout(() => setIsLocked(false), 150)
    return () => clearTimeout(t)
  }, [pathname, isLocked])

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || isSubscriptionLoading) {
    return <SidebarSkeleton />
  }

  const desktopSidebar = (
    <Box
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        if (!isLocked) setIsHovered(false)
      }}
      sx={{
        backgroundColor: sidebarBg,
        minHeight: '100vh',
        width: isExpanded ? 240 : 80,
        transition: 'opacity .25s ease, width .25s ease, background-color .0s',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'fixed',
        p: 2,
        zIndex: 1000,
        overflowX: 'hidden',
      }}
    >
      <Box
        onClick={() => handleNav('/dashboard/administrator/stats')}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          height: 60,
          width: '100%',
          py: 1,
          px: 1,
          mb: 1,
          cursor: 'pointer',
          borderRadius: 3,
          bgcolor: 'rgba(255,255,255,0.12)',
        }}
      >
        <Box
          component="img"
          src={isDefaultLogo ? defaultLogo : (gym_logo_url as string)}
          alt={gym_name || 'Gym'}
          onError={(e: any) => { e.currentTarget.src = defaultLogo }}
          sx={{
            width: isExpanded ? 50 : 30,
            height: isExpanded ? 50 : 30,
            borderRadius: '90%',
            objectFit: isDefaultLogo ? 'contain' : 'cover',
            bgcolor: isDefaultLogo ? 'white' : 'transparent',
            p: isDefaultLogo ? 0.5 : 0,
            boxShadow: isDefaultLogo ? '0 1px 4px rgba(0,0,0,.18)' : 'none',
            flexShrink: 0,
          }}
        />

        <Box
          sx={{
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            opacity: isExpanded ? 1 : 0,
            width: isExpanded ? 'auto' : 0,
            transition: 'opacity .25s ease, width .25s ease',
            justifyContent: 'center',
          }}
        >
          <Typography variant="subtitle1" fontWeight={800} textAlign='center' color="white" noWrap>
            {gym_name || 'Mi Gimnasio'}
          </Typography>

          {planName && (
            <Chip
              label={planName}
              size="small"
              sx={{
                height: 15,
                fontSize: '0.65rem',
                fontWeight: 600,
                bgcolor: planName.toLowerCase().includes('enterprise')
                  ? '#7c3aed'
                  : planName.toLowerCase().includes('premium')
                    ? '#f59e0b'
                    : planName.toLowerCase().includes('max')
                      ? '#ec4899'
                      : 'rgba(255,255,255,0.2)',
                color: 'white',
                '& .MuiChip-label': { px: 1 },
              }}
            />
          )}
        </Box>


      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.18)', mb: 1 }} />

      <List sx={{ color: 'white', py: 0, mt: 0 }}>
        {tabs.map((tab, index) => {
          const selected = selectedIndex === index
          const enabled = isTabEnabled(tab.route)
          const isNovedades = tab.label === 'Novedades'
          const item = (
            <ListItemButton
              key={tab.route}
              selected={selected && enabled}
              disableRipple
              onClick={() => enabled ? handleNav(tab.route, index, enabled) : handleBlockedClick(tab.label)}
              sx={{
                borderRadius: 2,
                mb: 1,
                height: 48,
                px: 1.45,
                bgcolor: selected && enabled ? '#fff' : 'transparent',
                opacity: enabled ? 1 : 0.7,
                cursor: 'pointer',
                border: isNovedades ? 'transparent' : 'none',
                '&:hover': {
                  bgcolor: !enabled
                    ? 'rgba(245, 206, 8, 0.1)'
                    : selected
                      ? '#fff'
                      : 'rgba(255,255,255,0.10)'
                },
                '&.Mui-selected': { bgcolor: '#fff !important' },
              }}
            >
              <ListItemIcon
                sx={{
                  color: !enabled ? '#F5CE08' : isNovedades && !selected ? '#FFD700' : selected ? 'black' : 'white',
                  minWidth: 0,
                  mr: isExpanded ? 1.5 : 0,
                }}
              >
                {!enabled ? <StarIcon /> : tab.icon}
              </ListItemIcon>
              <Box
                sx={{
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  opacity: isExpanded ? 1 : 0,
                  width: isExpanded ? 'auto' : 0,
                  transition: 'opacity .25s ease, width .25s ease',
                }}
              >
                <ListItemText
                  primary={tab.label}
                  primaryTypographyProps={{
                    color: !enabled ? '#F5CE08' : isNovedades && !selected ? '#FFD700' : selected ? 'black' : 'white',
                    sx: { 
                      textDecoration: !enabled ? 'line-through' : 'none',
                      fontWeight: isNovedades ? 700 : 400,
                    }
                  }}
                />
              </Box>
            </ListItemButton>
          )
          return isExpanded ? (
            item
          ) : (
            <Tooltip
              key={tab.route}
              title={!enabled ? `${tab.label} (No disponible en tu plan)` : tab.label}
              placement="right"
            >
              {item}
            </Tooltip>
          )
        })}
      </List>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box
          onClick={() => handleNav(getProfileRoute())}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isExpanded ? 'flex-start' : 'center',
            gap: isExpanded ? 1.25 : 0,
            height: 48,
            px: isExpanded ? 1.25 : 0,
            borderRadius: 2,
            cursor: 'pointer',
            bgcolor: 'rgba(255,255,255,0.10)',
          }}
        >
          <AccountCircleIcon
            sx={{
              color: 'white',
              fontSize: 24,
              flexShrink: 0,
            }}
          />
          <Box
            sx={{
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              opacity: isExpanded ? 1 : 0,
              width: isExpanded ? 'auto' : 0,
              transition: 'opacity .25s ease, width .25s ease',
            }}
          >
            <Typography variant="body2" color="white" noWrap>
              {user_name || ''}
            </Typography>
          </Box>
        </Box>

        <Tooltip title={isExpanded ? '' : isDarkMode ? 'Modo claro' : 'Modo oscuro'} placement="right">
          <ListItemButton
            onClick={toggleDarkMode}
            sx={{
              borderRadius: 2,
              height: 48,
              px: 1.25,
              justifyContent: 'flex-start',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.10)' },
            }}
          >
            <ListItemIcon sx={{ color: 'white', minWidth: 0, mr: isExpanded ? 1.5 : 0 }}>
              {isDarkMode ? <LightModeIcon fontSize="medium" /> : <DarkModeIcon fontSize="medium" />}
            </ListItemIcon>
            <Box
              sx={{
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                opacity: isExpanded ? 1 : 0,
                width: isExpanded ? 'auto' : 0,
                transition: 'opacity .3s ease, width .3s ease',
              }}
            >
              <ListItemText primary={isDarkMode ? 'Modo claro' : 'Modo oscuro'} primaryTypographyProps={{ color: 'white' }} />
            </Box>
          </ListItemButton>
        </Tooltip>

        <Tooltip title={isExpanded ? '' : 'Salir'} placement="right">
          <ListItemButton
            onClick={logout}
            sx={{
              borderRadius: 2,
              height: 48,
              px: 1.25,
              justifyContent: 'flex-start',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.10)' },
            }}
          >
            <ListItemIcon sx={{ color: 'white', minWidth: 0, mr: isExpanded ? 1.5 : 0 }}>
              <LogoutIcon fontSize="medium" />
            </ListItemIcon>
            <Box
              sx={{
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                opacity: isExpanded ? 1 : 0,
                width: isExpanded ? 'auto' : 0,
                transition: 'opacity .3s ease, width .3s ease',
              }}
            >
              <ListItemText primary="Salir" primaryTypographyProps={{ color: 'white' }} />
            </Box>
          </ListItemButton>
        </Tooltip>
      </Box>
    </Box>
  )

  const upgradeModal = (
    <Dialog
      open={upgradeModalOpen}
      onClose={() => setUpgradeModalOpen(false)}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 1,
        }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: '#FEF3C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <StarIcon sx={{ fontSize: 36, color: '#F59E0B' }} />
          </Box>
        </Box>
        <Typography variant="h5" fontWeight={700}>
          Funcionalidad Premium
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ textAlign: 'center', pb: 2 }}>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          La funcionalidad <strong>"{blockedFeatureName}"</strong> está disponible a partir del <strong>Plan Premium</strong>.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Actualizá tu plan para desbloquear esta y más funcionalidades avanzadas para tu gimnasio.
        </Typography>
        <Box
          sx={{
            mt: 3,
            p: 2,
            bgcolor: 'grey.100',
            borderRadius: 2,
            border: '1px dashed',
            borderColor: 'grey.300'
          }}
        >
          <Typography variant="body2" fontWeight={600} gutterBottom>
            📧 Contactanos para upgradear
          </Typography>
          <Typography variant="body2" color="primary" fontWeight={500}>
            contactofitnessflow@gmail.com
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 2 }}>
        <Button
          variant="outlined"
          onClick={() => setUpgradeModalOpen(false)}
          sx={{ px: 4 }}
        >
          Cerrar
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            window.open('mailto:contactofitnessflow@gmail.com?subject=Upgrade de Plan - ' + gym_name, '_blank')
            setUpgradeModalOpen(false)
          }}
          sx={{
            px: 4,
            bgcolor: '#F59E0B',
            '&:hover': { bgcolor: '#D97706' }
          }}
        >
          Contactar
        </Button>
      </DialogActions>
    </Dialog>
  )

  if (isMobile) {
    return (
      <>
        <Paper
          sx={{
            position: 'fixed',
            backgroundColor: sidebarBg,
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          }}
          elevation={8}
        >
          <Box
            sx={{
              overflowX: 'auto',
              overflowY: 'hidden',
              whiteSpace: 'nowrap',
              '&::-webkit-scrollbar': { display: 'none' },
            }}
          >
            <BottomNavigation
              showLabels={false}
              value={selectedIndex}
              sx={{
                bgcolor: 'transparent',
                display: 'inline-flex',
              }}
            >
              {tabs.map((tab, index) => {
                const enabled = isTabEnabled(tab.route)
                const isNovedades = tab.label === 'Novedades'
                return (
                  <BottomNavigationAction
                    key={tab.route}
                    value={index}
                    icon={!enabled ? <LockIcon /> : tab.icon}
                    disableRipple
                    onMouseDown={() => enabled ? handleNav(tab.route, index, enabled) : handleBlockedClick(tab.label)}
                    onClick={() => enabled ? handleNav(tab.route, index, enabled) : handleBlockedClick(tab.label)}
                    sx={{
                      color: !enabled
                        ? '#F5CE08'
                        : isNovedades && selectedIndex !== index
                          ? '#FFD700'
                          : selectedIndex === index
                            ? 'black'
                            : 'white',
                      opacity: enabled ? 1 : 0.7,
                      cursor: 'pointer',
                      bgcolor: 'transparent',
                      '&.Mui-selected': {
                        color: 'black',
                        bgcolor: enabled ? 'white !important' : 'transparent'
                      },
                    }}
                  />
                )
              })}
              <BottomNavigationAction
                value={20}
                icon={isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
                onClick={() => toggleDarkMode()}
                sx={{
                  color: 'white',
                  '&.Mui-selected': { color: 'black', bgcolor: 'white !important' },
                }}
              />
              <BottomNavigationAction
                value={21}
                icon={<LogoutIcon />}
                onClick={() => {
                  setSelectedIndex(21)
                  logout()
                }}
                sx={{
                  color: 'white',
                  '&.Mui-selected': { color: 'black', bgcolor: 'white !important' },
                }}
              />
            </BottomNavigation>
          </Box>
        </Paper>
        {upgradeModal}
      </>
    )
  }

  return (
    <>
      {desktopSidebar}
      {upgradeModal}
    </>
  )
}
