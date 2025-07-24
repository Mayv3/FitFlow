'use client'
import React from 'react'
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material'

export type Action = {
  label: string
  icon: React.ReactNode
  onClick: () => void
  color?: 
    | 'inherit'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'error'
    | 'info'
    | 'warning'
  variant?: 'text' | 'outlined' | 'contained'
}

interface ActionButtonsProps {
  actions: Action[]
  spacing?: number
  direction?: 'row' | 'column'
}

export function ActionButtons({
  actions,
  spacing = 1,
  direction = 'row',
}: ActionButtonsProps) {
  const theme = useTheme()
  const isXs = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Box
      display="flex"
      flexDirection={direction}
      flexWrap="wrap"
      gap={spacing}
    >
      {actions.map((act) =>
        isXs ? (
          <Tooltip key={act.label} title={act.label}>
            <IconButton
              onClick={act.onClick}
              color={act.color ?? 'primary'}
            >
              {act.icon}
            </IconButton>
          </Tooltip>
        ) : (
          <Button
            key={act.label}
            startIcon={act.icon}
            onClick={act.onClick}
            color={act.color ?? 'primary'}
            variant={act.variant ?? 'text'}
          >
            {act.label}
          </Button>
        )
      )}
    </Box>
  )
}
