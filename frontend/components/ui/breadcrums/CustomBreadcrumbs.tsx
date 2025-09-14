'use client';

import { Breadcrumbs, Link, Typography } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { useRouter } from 'next/navigation';
import { CustomBreadcrumbsProps } from '@/models/Breadcrums/Breadcrums';
import { ADMINISTRADOR } from '@/const/roles/roles';
import { useEffect, useState } from 'react';

export function CustomBreadcrumbs({ items }: CustomBreadcrumbsProps) {
  const router = useRouter();
  const [rol, setRol] = useState<number | null>(null);

  useEffect(() => {
    const rolCookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('rol='))
      ?.split('=')[1];
    setRol(rolCookie ? Number(rolCookie) : null);
  }, []);

  return (
    <Breadcrumbs
      separator={<NavigateNextIcon fontSize="small" />}
      sx={{ mb: 1, color: 'text.secondary', fontSize: 13 }}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        let href = item.href;
        if (item.label === 'Dashboard') {
          href =
            rol === ADMINISTRADOR
              ? '/dashboard/administrator/stats'
              : '/dashboard/receptionist/members';
        }

        if (isLast || !href) {
          return (
            <Typography key={index} color={isLast ? 'text.primary' : 'inherit'}>
              {item.label}
            </Typography>
          );
        }

        return (
          <Link
            key={index}
            color="inherit"
            sx={{ cursor: 'pointer' }}
            onClick={() => router.push(href!)}
            underline="hover"
          >
            {item.label}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
}
