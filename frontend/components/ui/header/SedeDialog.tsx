'use client'

import { useState } from 'react'
import { Avatar, Box, ButtonBase, Chip, Dialog, DialogContent, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { FlushDialogActions } from '@/components/ui/modals/FlushDialogActions'
import { Gym } from '@/models/Gym/Gym'

type SedeDialogProps = {
  open: boolean
  onClose: () => void
  sedes: Gym[]
  activeId: string | null
  /** id de la sede a la que se está cambiando, mientras dura el cambio. */
  cambiandoA: string | null
  onSelect: (gymId: string) => void
}

export function SedeDialog({ open, onClose, sedes, activeId, cambiandoA, onSelect }: SedeDialogProps) {
  // Se elige y recién después se confirma: cambiar de sede recarga todo el panel.
  const [elegidaId, setElegidaId] = useState<string | null>(null)
  const ocupado = cambiandoA !== null
  const seleccionId = elegidaId ?? activeId
  const elegida = sedes.find((s) => s.id === elegidaId && s.id !== activeId)

  const cerrar = () => {
    if (ocupado) return
    setElegidaId(null)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={cerrar}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
    >
      <DialogContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={700}>
          Cambiar de sede
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2.5 }}>
          Vas a ver los alumnos, pagos y asistencias de la sede que elijas.
        </Typography>

        <Box role="radiogroup" aria-label="Sedes" sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {sedes.map((sede) => {
            const actual = sede.id === activeId
            const seleccionada = sede.id === seleccionId
            return (
              <ButtonBase
                key={sede.id}
                role="radio"
                aria-checked={seleccionada}
                disabled={ocupado}
                onClick={() => setElegidaId(sede.id)}
                sx={(theme) => ({
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  gap: 1.5,
                  p: 1.5,
                  textAlign: 'left',
                  borderRadius: 2,
                  border: '1.5px solid',
                  borderColor: seleccionada ? 'primary.main' : 'divider',
                  bgcolor: seleccionada ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                  transition: 'border-color .15s ease, background-color .15s ease',
                  '&:hover': {
                    borderColor: seleccionada ? 'primary.main' : 'text.disabled',
                  },
                  '&.Mui-focusVisible': {
                    outline: `2px solid ${theme.palette.primary.main}`,
                    outlineOffset: 2,
                  },
                  '&.Mui-disabled': { opacity: 0.6 },
                })}
              >
                <Avatar src={sede.logo_url || undefined} alt="" sx={{ width: 44, height: 44 }}>
                  {sede.name.charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography fontWeight={600} noWrap>
                    {sede.name}
                  </Typography>
                  {actual && (
                    <Chip
                      label="Estás acá"
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600, mt: 0.25 }}
                    />
                  )}
                </Box>
                {seleccionada ? (
                  <CheckCircleIcon color="primary" />
                ) : (
                  <RadioButtonUncheckedIcon sx={{ color: 'text.disabled' }} />
                )}
              </ButtonBase>
            )
          })}
        </Box>
      </DialogContent>

      <FlushDialogActions
        actions={[
          { label: 'Cancelar', onClick: cerrar, tone: 'neutral', disabled: ocupado },
          {
            label: elegida ? `Ir a ${elegida.name}` : 'Cambiar',
            onClick: () => elegida && onSelect(elegida.id),
            tone: 'confirm',
            disabled: !elegida,
            loading: ocupado,
          },
        ]}
      />
    </Dialog>
  )
}
