'use client'

import Image from 'next/image'
import { Box, Button, Checkbox, Tooltip } from '@mui/material'
import { FormModal } from '@/components/ui/modals/FormModal'

interface AppointmentFormModalProps {
  open: boolean
  mode: 'create' | 'edit'
  fields: any[]
  initialValues: any
  layout: any
  gymId: string
  onClose: () => void
  onSubmit: (values: any) => Promise<void>
  addToCalendar: boolean
  onAddToCalendarChange: (val: boolean) => void
  onDeleteClick: () => void
}

export function AppointmentFormModal({
  open,
  mode,
  fields,
  initialValues,
  layout,
  gymId,
  onClose,
  onSubmit,
  addToCalendar,
  onAddToCalendarChange,
  onDeleteClick,
}: AppointmentFormModalProps) {
  return (
    <FormModal
      open={open}
      title={mode === 'create' ? 'Añadir un turno' : 'Editar turno'}
      fields={fields}
      initialValues={initialValues}
      onClose={onClose}
      onSubmit={onSubmit}
      confirmText="Guardar"
      cancelText="Cancelar"
      gridColumns={12}
      gridGap={16}
      mode={mode}
      layout={layout}
      gymId={gymId}
      extraActions={
        <Box display="flex" alignItems="center" gap={2}>
          {mode === 'create' && (
            <Box display="flex" alignItems="center" gap={1}>
              <Box component="span" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                Añadir a Google Calendar
              </Box>
              <Tooltip title="Agregar a Google Calendar">
                <Checkbox
                  checked={addToCalendar}
                  onChange={(e) => onAddToCalendarChange(e.target.checked)}
                  icon={
                    <Image
                      src="/images/google-calendar.png"
                      alt="Google Calendar"
                      width={46}
                      height={46}
                      style={{ opacity: 0.5, transition: '0.25s', filter: 'grayscale(40%)' }}
                    />
                  }
                  checkedIcon={
                    <Image
                      src="/images/google-calendar.png"
                      alt="Google Calendar"
                      width={46}
                      height={46}
                      style={{ opacity: 1, transform: 'scale(1.1)', transition: '0.25s', filter: 'none' }}
                    />
                  }
                  sx={{
                    '& .MuiSvgIcon-root': { fontSize: 0 },
                    p: 0.3,
                    cursor: 'pointer',
                    '&:hover img': { transform: 'scale(1.1)', opacity: 1 },
                  }}
                />
              </Tooltip>
            </Box>
          )}

          {mode === 'edit' && (
            <Button variant="contained" color="error" onClick={onDeleteClick}>
              Eliminar
            </Button>
          )}
        </Box>
      }
    />
  )
}
