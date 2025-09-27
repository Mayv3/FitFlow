'use client'

import { useRef, useCallback, useMemo, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import esLocale from '@fullcalendar/core/locales/es'
import {
  Box,
  Button,
  CircularProgress,
  ButtonGroup,
  Stack,
  useMediaQuery,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { FormModal } from '@/components/ui/modals/FormModal'
import { getInputFieldsTurnos, layoutTurnos } from '@/const/inputs/appointments'
import { useUser } from '@/context/UserContext'

import type { EventDropArg } from '@fullcalendar/core'
import type { EventResizeDoneArg } from '@fullcalendar/interaction'

import { useServicesByGym } from '@/hooks/services/useServicesOptions'
import { useAlumnosSimpleByGym } from '@/hooks/alumnos/useAlumnosByGym'
import {
  useAppointments,
  useAddAppointment,
  useEditAppointment,
  useDeleteAppointment,
} from '@/hooks/appointments/useAppointments'

import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { GenericModal } from '@/components/ui/modals/GenericModal'
import { CustomBreadcrumbs } from '@/components/ui/breadcrums/CustomBreadcrumbs'

type AlumnoSimple = { id: number; nombre: string; dni?: string }

function toLocalInputValue(date: Date | string | null) {
  if (!date) return ''
  const d = new Date(date)

  d.setHours(d.getHours() + 3)

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function toLocalISOString(date: Date): string {
  const tzDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return tzDate.toISOString().slice(0, 16)
}



export default function Appointments() {
  const calendarRef = useRef<FullCalendar | null>(null);

  const [openDelete, setOpenDelete] = useState(false)

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

  const toIsoMinute = (d: Date) => d.toISOString().slice(0, 16)

  const handleAddTurno = async (values: any) => {
    await addAppointment.mutateAsync({ ...values, gym_id: gymId })
    setOpen(false)
  }

  const handleEditTurno = async (values: any) => {
    if (!selectedId) return
    console.log(selectedId, values)
    await editAppointment.mutateAsync({ id: selectedId, values })
    setOpen(false)
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
      fin_at: toLocalInputValue(ev.end),
      color: ev.backgroundColor,
    })
    setOpen(true)
  }

  const handleEventDrop = async (info: EventDropArg) => {
    const { event: ev, oldEvent: old } = info
    if (!old.start || !ev.start) {
      info.revert()
      return
    }
    try {
      const oldStart = old.start.getTime()
      const oldEnd = old.end ? old.end.getTime() : oldStart + 60 * 60 * 1000
      const durationMs = Math.max(1, oldEnd - oldStart)
      const newStart = ev.start
      const newEnd = new Date(newStart.getTime() + durationMs)
      await editAppointment.mutateAsync({
        id: ev.id,
        values: {
          inicio_at: toLocalISOString(newStart),
          fin_at: toLocalISOString(newEnd),
        },
        skipInvalidate: true,
      })
    } catch {
      info.revert()
    }
  }

  const handleEventResize = async (info: EventResizeDoneArg) => {
    const ev = info.event
    if (!ev.start) {
      info.revert()
      return
    }
    try {
      await editAppointment.mutateAsync({
        id: ev.id,
        values: {
          inicio_at: toLocalISOString(ev.start),
          fin_at: toLocalISOString(ev.end ?? ev.start),
        },
        skipInvalidate: true,
      })
    } catch {
      info.revert()
    }
  }

  if (isLoading || isFetching) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  const emptyTurno = {
    titulo: '',
    servicio_id: '',
    profesional: '',
    alumno_id: null,
    inicio_at: '',
    fin_at: '',
    color: '#1976d2',
  }

  return (
    <Box sx={{ maxWidth: 'xl', mx: 'auto' }}>
      <CustomBreadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard/receptionist' },
          { label: 'Turnos' },
        ]}
      />
      {isMobile ? (
        <Stack spacing={1.5} mb={2} alignItems="stretch">
          <Button
            variant="contained"
            sx={{ py: 1.5, fontWeight: 700, borderRadius: 1 }}
            onClick={() => {
              setMode('create')
              setInitialValues(emptyTurno)
              setSelectedId(null)
              setOpen(true)
            }}
          >
            Añadir turno
          </Button>

          <Stack direction="row" spacing={1}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => calendarRef.current?.getApi().prev()}
            >
              Anterior
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => calendarRef.current?.getApi().today()}
            >
              Hoy
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => calendarRef.current?.getApi().next()}
            >
              Siguiente
            </Button>
          </Stack>
        </Stack>
      ) : (
        <Box
          mb={2}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          gap={2}
        >
          <ButtonGroup variant="outlined">
            <Button onClick={() => calendarRef.current?.getApi().prev()}>
              Anterior
            </Button>
            <Button onClick={() => calendarRef.current?.getApi().today()}>
              Hoy
            </Button>
            <Button onClick={() => calendarRef.current?.getApi().next()}>
              Siguiente
            </Button>
          </ButtonGroup>

          <Button
            variant="contained"
            onClick={() => {
              setMode('create')
              setInitialValues(emptyTurno)
              setSelectedId(null)
              setOpen(true)
            }}
          >
            Añadir turno
          </Button>
        </Box>
      )}

      <Box
        sx={{
          width: '100%',
          maxWidth: { xs: '100%' },
          height: { xs: '70vh', md: '84vh' },
          mx: 'auto',
          backgroundColor: '#fff',
          borderRadius: 2,
          p: { xs: 1.5, md: 2 },
          boxShadow: 2,
        }}
      >
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          timeZone="America/Argentina/Cordoba"
          locale={esLocale}
          height="100%"
          contentHeight="100%"
          aspectRatio={isMobile ? 0.8 : 1.4}
          selectable
          editable
          longPressDelay={200}
          eventDisplay="block"
          events={data?.rows ?? []}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          dayCellClassNames={() => 'cursor-pointer'}
          headerToolbar={{
            left: '',
            center: 'title',
            right: '',
          }}
          titleFormat={{ year: 'numeric', month: 'long' }}
          dateClick={(info) => {
            setMode('create')
            setInitialValues({
              ...emptyTurno,
              inicio_at: info.dateStr + 'T10:00',
              fin_at: info.dateStr + 'T11:00',
            })
            setSelectedId(null)
            setOpen(true)
          }}
          select={(selectInfo) => {
            const end = new Date(selectInfo.endStr)
            end.setMinutes(end.getMinutes() - 1)
            setMode('create')
            setInitialValues({
              ...emptyTurno,
              inicio_at: selectInfo.startStr + 'T09:00',
              fin_at: end.toISOString().slice(0, 16),
            })
            setSelectedId(null)
            setOpen(true)
          }}
        />
      </Box>

      <FormModal
        open={open}
        title={mode === 'create' ? 'Añadir un turno' : 'Editar turno'}
        fields={fieldsTurnos}
        initialValues={initialValues}
        onClose={() => setOpen(false)}
        onSubmit={mode === 'create' ? handleAddTurno : handleEditTurno}
        confirmText="Guardar"
        cancelText="Cancelar"
        gridColumns={12}
        gridGap={16}
        mode={mode}
        layout={layoutTurnos}
        gymId={gymId}
        extraActions={
          mode === 'edit' && (
            <Button variant="contained" color="error" onClick={() => setOpenDelete(true)}>
              Eliminar
            </Button>
          )
        }
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

      <ReactQueryDevtools initialIsOpen={false} />
    </Box>
  )
}
