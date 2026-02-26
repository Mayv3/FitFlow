'use client'

import { useRef, useCallback, useMemo, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import { Box, Button, ButtonGroup, CircularProgress, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'

import { FormModal } from '@/components/ui/modals/FormModal'
import { getInputFieldsTurnos, layoutTurnos } from '@/const/inputs/appointments'
import { useUser } from '@/context/UserContext'
import { useServicesByGym } from '@/hooks/services/useServicesOptions'
import { useAlumnosSimpleByGym } from '@/hooks/alumnos/useAlumnosByGym'
import {
  useAppointments,
  useAddAppointment,
  useEditAppointment,
  useDeleteAppointment,
} from '@/hooks/appointments/useAppointments'
import { GenericModal } from '@/components/ui/modals/GenericModal'
import { CustomBreadcrumbs } from '@/components/ui/breadcrums/CustomBreadcrumbs'
import { notify } from '@/lib/toast'
import { EMPTY_TURNO, generarLinkGoogleCalendar, toLocalInputValue } from '@/utils/appointments/appointmentUtils'
import { AppointmentCalendar } from './AppointmentCalendar'
import { AppointmentFormModal } from './AppointmentFormModal'

type AlumnoSimple = { id: number; nombre: string; dni?: string }

export default function Appointments() {
  const calendarRef = useRef<FullCalendar | null>(null)
  const [openDelete, setOpenDelete] = useState(false)
  const [addToCalendar, setAddToCalendar] = useState(false)

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const { user } = useUser()
  const gymId = user?.gym_id ?? ''

  const { data: servicesData } = useServicesByGym(gymId)
  const serviceOptions = servicesData?.options ?? []

  const { data: alumnosRes } = useAlumnosSimpleByGym(gymId)
  const alumnos = useMemo(
    () => (alumnosRes?.items ?? alumnosRes ?? []) as AlumnoSimple[],
    [alumnosRes]
  )

  const searchFromCache = useCallback(
    (_: string, q: string) => {
      const list = alumnos
      if (!q) return list.map(a => ({ label: `${a.nombre} (${a.dni ?? ''})`, value: a.id }))
      const lower = q.toLowerCase()
      return list
        .filter(a => a.nombre?.toLowerCase().includes(lower) || String(a.dni ?? '').includes(lower))
        .map(a => ({ label: `${a.nombre} (${a.dni ?? ''})`, value: a.id }))
    },
    [alumnos]
  )

  const fieldsTurnos = useMemo(
    () => getInputFieldsTurnos({ serviceOptions, searchFromCache }),
    [serviceOptions, searchFromCache]
  )

  const { data, isLoading, isFetching } = useAppointments(gymId)
  const addAppointment = useAddAppointment(gymId)
  const editAppointment = useEditAppointment(gymId)
  const deleteAppointment = useDeleteAppointment(gymId)

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [initialValues, setInitialValues] = useState<any>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const initialFormValues = useMemo(() => {
    const base = initialValues ?? {}
    return base.origen_pago ? base : { ...base, origen_pago: 'servicio' }
  }, [initialValues])

  const handleSubmitTurno = async (values: any) => {
    const { emails, ...clean } = values
    clean.fin_at = new Date(new Date(clean.inicio_at).getTime() + 3600000).toISOString()

    if (mode === 'create') {
      await addAppointment.mutateAsync({ ...clean, gym_id: gymId })
    } else {
      if (!selectedId) return
      await editAppointment.mutateAsync({ id: selectedId, values: clean })
    }
    setOpen(false)

    if (addToCalendar) {
      const link = generarLinkGoogleCalendar({ ...clean, emails })
      if (link) window.open(link, '_blank')
    }
  }

  const handleEventClick = (clickInfo: any) => {
    const ev = clickInfo.event
    setSelectedId(ev.id)
    setMode('edit')
    setInitialValues({
      titulo: ev.title,
      servicio_id: ev.extendedProps.servicio_id,
      profesional: ev.extendedProps.profesional,
      alumno_id: ev.extendedProps.alumno_id ?? null,
      inicio_at: toLocalInputValue(ev.start),
      color: ev.backgroundColor,
    })
    setOpen(true)
  }

  const handleDateClick = (info: any) => {
    setMode('create')
    setInitialValues({ ...EMPTY_TURNO, inicio_at: info.dateStr + 'T10:00' })
    setSelectedId(null)
    setOpen(true)
  }

  const handleEventDrop = useCallback(async (info: any) => {
    const inicio = info.event.start
    if (!inicio) return
    try {
      await editAppointment.mutateAsync({
        id: info.event.id,
        values: {
          inicio_at: inicio.toISOString(),
          fin_at: new Date(inicio.getTime() + 3600000).toISOString(),
        },
        skipInvalidate: true,
      })
      notify.success('Turno actualizado correctamente')
    } catch {
      info.revert()
      notify.error('Error al actualizar el turno')
    }
  }, [editAppointment])

  if (isLoading || isFetching) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 'xl', mx: 'auto' }}>
      <CustomBreadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard/receptionist' },
          { label: 'Turnos' },
        ]}
      />

      <Box mb={2} display="flex" alignItems="center" justifyContent="space-between" gap={2}>
        <ButtonGroup variant="outlined">
          <Button onClick={() => calendarRef.current?.getApi().prev()}>Anterior</Button>
          <Button onClick={() => calendarRef.current?.getApi().today()}>Hoy</Button>
          <Button onClick={() => calendarRef.current?.getApi().next()}>Siguiente</Button>
        </ButtonGroup>

        <Button
          variant="contained"
          onClick={() => {
            setMode('create')
            setInitialValues(EMPTY_TURNO)
            setSelectedId(null)
            setOpen(true)
          }}
        >
          Añadir turno
        </Button>
      </Box>

      <AppointmentCalendar
        events={data?.rows ?? []}
        isMobile={isMobile}
        calendarRef={calendarRef}
        onEventClick={handleEventClick}
        onDateClick={handleDateClick}
        onEventDrop={handleEventDrop}
      />

      <AppointmentFormModal
        open={open}
        mode={mode}
        fields={fieldsTurnos}
        initialValues={initialFormValues}
        layout={layoutTurnos}
        gymId={gymId}
        onClose={() => setOpen(false)}
        onSubmit={handleSubmitTurno}
        addToCalendar={addToCalendar}
        onAddToCalendarChange={setAddToCalendar}
        onDeleteClick={() => setOpenDelete(true)}
      />

      <GenericModal
        open={openDelete}
        title="Eliminar turno"
        content="¿Estás seguro de que deseas eliminar este turno?"
        onClose={() => setOpenDelete(false)}
        onConfirm={async () => {
          if (selectedId) {
            await deleteAppointment.mutateAsync(selectedId)
            setOpenDelete(false)
            setOpen(false)
          }
        }}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </Box>
  )
}
