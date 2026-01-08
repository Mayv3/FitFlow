'use client'

import { Box, Skeleton, Divider } from '@mui/material'
import { useTheme, alpha } from '@mui/material/styles'

export const SidebarSkeleton = () => {
  const theme = useTheme()

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.primary.main,
        minHeight: '100vh',
        width: 80,
        position: 'fixed',
        p: 2,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* Logo */}
      <Box sx={{ mb: 2 }}>
        <Skeleton
          variant="circular"
          width={36}
          height={36}
          sx={{
            bgcolor: alpha(theme.palette.common.white, 0.45),
          }}
        />
      </Box>

      <Divider
        sx={{
          borderColor: alpha(theme.palette.common.white, 0.35),
          mb: 2,
        }}
      />

      {/* Menu items */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton
            key={i}
            variant="rounded"
            height={40}
            sx={{
              bgcolor: alpha(theme.palette.common.white, 0.45),
            }}
          />
        ))}
      </Box>

      {/* Bottom */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Skeleton
          variant="rounded"
          height={40}
          sx={{
            bgcolor: alpha(theme.palette.common.white, 0.45),
          }}
        />
        <Skeleton
          variant="rounded"
          height={40}
          sx={{
            bgcolor: alpha(theme.palette.common.white, 0.45),
          }}
        />
      </Box>
    </Box>
  )
}
