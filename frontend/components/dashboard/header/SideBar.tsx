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
import { useEffect, useState } from 'react';

type TabItem = {
  label: string;
  icon: React.ReactNode;
  route: string;
};

type HeaderComponentProps = {
  tabs: TabItem[];
};

export const SideBar = ({ tabs }: HeaderComponentProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

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
        width: 320,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'fixed',
        p: 2,
        zIndex:'1000'
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

      <Box>
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
      <BottomNavigation
        showLabels={false}
        value={selectedIndex}
        onChange={(_, newIndex) => {
          const item = newIndex === 999
            ? { route: '/perfil' }
            : tabs[newIndex];
          handleNavigate(newIndex, item.route);
        }}
        sx={{
          bgcolor: 'primary.main',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
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

          }}
        />
      </BottomNavigation>
    </Paper>
  );

  return isMobile ? mobileNav : desktopSidebar;
};
