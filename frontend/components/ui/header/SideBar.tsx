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
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import LogoutIcon from '@mui/icons-material/Logout'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import { useEffect, useState } from 'react'
import { useLogout } from '@/hooks/logout/useLogout'
import Cookies from 'js-cookie'
import { useRouter, usePathname } from 'next/navigation'

type TabItem = { label: string; icon: React.ReactNode; route: string }
type HeaderComponentProps = { tabs: TabItem[] }

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

  const [gym_name, setGymName] = useState<string | null>(null)
  const [gym_logo_url, setGymLogoUrl] = useState<string | null>(null)
  const [user_name, setUserName] = useState<string | null>(null)

  const [sidebarBg, setSidebarBg] = useState<string>(() => readPrimary())
  const defaultLogo = '/images/icon.png'
  const isDefaultLogo = !gym_logo_url

  const logout = useLogout()

  const handleNav = (route: string, index?: number) => {
    if (typeof index === 'number') setSelectedIndex(index)
    router.push(route)
  }

  useEffect(() => {
    setGymName(Cookies.get('gym_name') ?? null)
    setUserName(Cookies.get('name') ?? null)
    try {
      setGymLogoUrl(localStorage.getItem('gym_logo_url') || null)
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

  if (!mounted) return null

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
        onClick={() => handleNav('/')}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          height: 56,
          px: 1,
          mb: 1,
          cursor: 'pointer',
          borderRadius: 2,
          bgcolor: 'rgba(255,255,255,0.10)',
        }}
      >
        <Box
          component="img"
          src={isDefaultLogo ? defaultLogo : (gym_logo_url as string)}
          alt={gym_name || 'Gym'}
          onError={(e: any) => { e.currentTarget.src = defaultLogo }}
          sx={{
            width: isExpanded ? 40 : 32,
            height: isExpanded ? 40 : 32,
            borderRadius: '50%',
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
          }}
        >
          <Typography variant="subtitle1" fontWeight={800} color="white" noWrap>
            {gym_name || 'Mi Gimnasio'}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.18)', mb: 1 }} />

      <List sx={{ color: 'white', py: 0, mt: 0 }}>
        {tabs.map((tab, index) => {
          const selected = selectedIndex === index
          const item = (
            <ListItemButton
              key={tab.route}
              selected={selected}
              disableRipple
              onClick={() => handleNav(tab.route, index)}
              sx={{
                borderRadius: 2,
                mb: 1,
                height: 48,
                px: 1.45,
                bgcolor: selected ? '#fff' : 'transparent',
                '&:hover': { bgcolor: selected ? '#fff' : 'rgba(255,255,255,0.10)' },
                '&.Mui-selected': { bgcolor: '#fff !important' },
              }}
            >
              <ListItemIcon
                sx={{
                  color: selected ? 'black' : 'white',
                  minWidth: 0,
                  mr: isExpanded ? 1.5 : 0,
                }}
              >
                {tab.icon}
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
                  primaryTypographyProps={{ color: selected ? 'black' : 'white' }}
                />
              </Box>
            </ListItemButton>
          )
          return isExpanded ? (
            item
          ) : (
            <Tooltip key={tab.route} title={tab.label} placement="right">
              {item}
            </Tooltip>
          )
        })}
      </List>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isExpanded ? 'flex-start' : 'center',
            gap: isExpanded ? 1.25 : 0,
            height: 48,
            px: isExpanded ? 1.25 : 0,
            borderRadius: 2,
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

  if (isMobile) {
    return (
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
            {tabs.map((tab, index) => (
              <BottomNavigationAction
                key={tab.route}
                value={index}
                icon={tab.icon}
                disableRipple
                onMouseDown={() => handleNav(tab.route, index)}
                onClick={() => handleNav(tab.route, index)}
                sx={{
                  color: selectedIndex === index ? 'black' : 'white',
                  '&.Mui-selected': { color: 'black', bgcolor: 'white !important' },
                }}
              />
            ))}
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
    )
  }

  return desktopSidebar
}
