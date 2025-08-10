'use client';

import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useLogout } from '@/hooks/logout/useLogout';
import LogoutIcon from '@mui/icons-material/Logout';

type TabItem = {
  label: string;
  icon: React.ReactNode;
  route: string;
};

type HeaderComponentProps = {
  tabs: TabItem[];
};

export const SideBar = ({ tabs }: HeaderComponentProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const logout = useLogout();

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
    }
  }, []);

  useEffect(() => {
    const index = tabs.findIndex((tab) => tab.route === pathname);
    if (index !== -1) setSelectedIndex(index);
    else if (pathname === '/perfil') setSelectedIndex(999);
  }, [pathname, tabs]);

  const handleNavigate = (index: number, route: string) => {
    setSelectedIndex(index);
    router.push(route);
  };

  const desktopSidebar = (
    <Box
      sx={{
        bgcolor: 'primary.main',
        minHeight: '100vh',
        width: '20%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'fixed',
        p: 2,
        zIndex: '1000'
      }}
    >
      <List
        sx={{ color: 'white' }}
        subheader={
          <ListSubheader
            component="div"
            sx={{ bgcolor: 'transparent', color: 'white' }}
          >
            Icon - Nombre del gimnasio
          </ListSubheader>
        }
      >
        {tabs.map((tab, index) => {
          const isSelected = selectedIndex === index;
          return (
            <ListItemButton
              key={tab.label}
              onClick={() => handleNavigate(index, tab.route)}
              sx={{
                borderRadius: 2,
                mb: 1,
                bgcolor: isSelected ? '#fff' : 'transparent',
                '&:hover': {
                  bgcolor: isSelected ? '#fff' : 'rgba(255,255,255,0.1)',
                },
                height: 48,
              }}
            >
              <ListItemIcon
                sx={{
                  color: isSelected ? 'black' : 'white',
                  minWidth: 36,
                }}
              >
                {tab.icon}
              </ListItemIcon>
              <ListItemText
                primary={tab.label}
                primaryTypographyProps={{
                  color: isSelected ? 'black' : 'white',
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Box sx={{ display: 'flex' }}>
        <ListItemButton
          onClick={() => handleNavigate(999, '/perfil')}
          sx={{
            borderRadius: 2,
            mt: 1,
            height: '48',
            bgcolor: selectedIndex === 999 ? '#fff' : 'transparent',
            '&:hover': {
              bgcolor: selectedIndex === 999 ? '#fff' : 'rgba(255,255,255,0.1)',
            },
          }}
        >
          <ListItemIcon
            sx={{
              color: selectedIndex === 999 ? 'black' : 'white',
              minWidth: 36,
            }}
          >
            <AccountCircleIcon fontSize="medium" />
          </ListItemIcon>
          <ListItemText
            primary="Nombre del usuario"
            primaryTypographyProps={{
              color: selectedIndex === 999 ? 'black' : 'white',
            }}
          />
        </ListItemButton>
        <ListItemButton
          onClick={logout}
          sx={{
            borderRadius: 2,
            mt: 1,
            height: 48,
            justifyContent: 'center',
            '&:hover': {
              bgcolor: selectedIndex === 999 ? '#fff' : 'rgba(255,255,255,0.1)',
            },
          }}
        >
          <LogoutIcon sx={{ color: 'white' }} fontSize="medium" />
        </ListItemButton>
      </Box>
    </Box>
  );

  const mobileNav = (
    <Paper
      sx={{
        position: 'fixed',
        bgcolor: 'primary.main',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
      }}
      elevation={8}
    >
      <Box
        ref={scrollRef}
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
          onChange={(_, newIndex) => {
            if (newIndex === 999) {
              handleNavigate(999, '/perfil');
            } else if (newIndex === 21) {
              setSelectedIndex(21);
              logout();
            } else {
              const tab = tabs[newIndex];
              if (tab) {
                handleNavigate(newIndex, tab.route);
              }
            }
          }}
          sx={{
            bgcolor: 'primary.main',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            display: 'inline-flex',
          }}
        >
          {tabs.map((tab, index) => (
            <BottomNavigationAction
              key={index}
              icon={tab.icon}
              value={index}
              sx={{
                color: selectedIndex === index ? 'black' : 'white',
                '&.Mui-selected': {
                  color: 'black',
                  bgcolor: 'white'
                },
              }}
            />
          ))}
          <BottomNavigationAction
            icon={<AccountCircleIcon />}
            value={999}
            sx={{
              color: 'white',
              '&.Mui-selected': {
                color: 'black',
                bgcolor: 'white'
              },
            }}
          />
          <BottomNavigationAction
            onClick={() => {
              setSelectedIndex(21);
              logout();
            }}
            icon={<LogoutIcon />}
            value={21}
            sx={{
              color: 'white',
              '&.Mui-selected': {
                color: 'black',
                bgcolor: 'white'
              },
            }}
          />
        </BottomNavigation>
      </Box>

    </Paper>
  );

  return isMobile ? mobileNav : desktopSidebar;
};
