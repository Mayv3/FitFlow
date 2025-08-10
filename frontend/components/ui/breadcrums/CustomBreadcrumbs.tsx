'use client';

import { Breadcrumbs, Link, Typography } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { useRouter } from 'next/navigation';
import { CustomBreadcrumbsProps } from '@/models/Breadcrums/Breadcrums';

export function CustomBreadcrumbs({ items }: CustomBreadcrumbsProps) {
  const router = useRouter();

  return (
    <Breadcrumbs
      separator={<NavigateNextIcon fontSize="small" />}
      sx={{ mb: 1, color: 'text.secondary', fontSize: 13 }}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        if (isLast) {
          return (
            <Typography key={index} color="text.primary">
              {item.label}
            </Typography>
          );
        }

        if (item.href) {
          return (
            <Link
              key={index}
              color="inherit"
              sx={{ cursor: 'pointer' }}
              onClick={() => router.push(item.href!)}
              underline="hover"
            >
              {item.label}
            </Link>
          );
        }

        return (
          <Typography key={index} color="inherit">
            {item.label}
          </Typography>
        );
      })}
    </Breadcrumbs>
  );
}
