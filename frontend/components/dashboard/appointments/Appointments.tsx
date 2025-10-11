'use client'

import { useRef, useCallback, useMemo, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import esLocale from '@fullcalendar/core/locales/es'
import Image from 'next/image'

import {
  Box,
  Button,
  CircularProgress,
  ButtonGroup,
  Stack,
  useMediaQuery,
  Tooltip,
  Checkbox,
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

// ---------------------- Helper Functions ----------------------

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

function generarLinkGoogleCalendar(turno: any) {
  if (!turno?.inicio_at || !turno?.titulo) return ''
  const inicio = new Date(turno.inicio_at)
  if (isNaN(inicio.getTime())) return ''
  const fin = new Date(inicio.getTime() + 60 * 60 * 1000)

  const formatDate = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, '')

  const base = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
  const params = new URLSearchParams({
    text: turno.titulo,
    dates: `${formatDate(inicio)}/${formatDate(fin)}`,
    details: `Profesional: ${turno.profesional || ''}`,
  })

  // ✅ Si hay correos, los agregamos al link (separados por coma)
  if (turno.emails && Array.isArray(turno.emails) && turno.emails.length > 0) {
    params.append('add', turno.emails.join(','))
  }

  return `${base}&${params.toString()}`
}

// ---------------------- Componente Principal ----------------------

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
      if (!q)
        return list.map(a => ({ label: `${a.nombre} (${a.dni ?? ''})`, value: a.id }))
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
  const [formValues, setFormValues] = useState<any>({})

  const handleAddTurno = async (values: any) => {
    const { emails, ...valuesLimpios } = values

    const inicio = new Date(valuesLimpios.inicio_at)
    const fin = new Date(inicio.getTime() + 60 * 60 * 1000)
    valuesLimpios.fin_at = fin.toISOString()

    await addAppointment.mutateAsync({ ...valuesLimpios, gym_id: gymId })
    setOpen(false)

    if (addToCalendar) {
      const link = generarLinkGoogleCalendar({ ...valuesLimpios, emails })
      if (link) window.open(link, '_blank')
    }
  }

  const handleEditTurno = async (values: any) => {
    if (!selectedId) return
    const { emails, ...valuesLimpios } = values

    const inicio = new Date(valuesLimpios.inicio_at)
    const fin = new Date(inicio.getTime() + 60 * 60 * 1000)
    valuesLimpios.fin_at = fin.toISOString()

    await editAppointment.mutateAsync({ id: selectedId, values: valuesLimpios })
    setOpen(false)

    if (addToCalendar) {
      const link = generarLinkGoogleCalendar({ ...valuesLimpios, emails })
      if (link) window.open(link, '_blank')
    }
  }

  // ---------- Click sobre evento ----------
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

  // ---------- Loader ----------
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

      {/* Toolbar superior */}
      <Box
        mb={2}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        gap={2}
      >
        <ButtonGroup variant="outlined">
          <Button onClick={() => calendarRef.current?.getApi().prev()}>Anterior</Button>
          <Button onClick={() => calendarRef.current?.getApi().today()}>Hoy</Button>
          <Button onClick={() => calendarRef.current?.getApi().next()}>Siguiente</Button>
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

      {/* Calendario */}
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
          eventDisplay="block"
          events={data?.rows ?? []}
          eventClick={handleEventClick}
          dayCellClassNames={() => 'cursor-pointer'}
          headerToolbar={{ left: '', center: 'title', right: '' }}
          titleFormat={{ year: 'numeric', month: 'long' }}
          dateClick={(info) => {
            setMode('create')
            setInitialValues({
              ...emptyTurno,
              inicio_at: info.dateStr + 'T10:00',
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
        onValuesChange={setFormValues}
        extraActions={
          <Box display="flex" alignItems="center" gap={2}>
            {mode === 'create' && (
              <Tooltip title="Agregar a Google Calendar">
                <Checkbox
                  checked={addToCalendar}
                  onChange={(e) => setAddToCalendar(e.target.checked)}
                  icon={
                    <Image
                      src="/images/google-calendar.png"
                      alt="Google Calendar"
                      width={46}
                      height={46}
                      style={{
                        opacity: 0.5,
                        transition: '0.25s',
                        filter: 'grayscale(40%)',
                      }}
                    />
                  }
                  checkedIcon={
                    <Image
                      src="/images/google-calendar.png"
                      alt="Google Calendar"
                      width={46}
                      height={46}
                      style={{
                        opacity: 1,
                        transform: 'scale(1.1)',
                        transition: '0.25s',
                        filter: 'none',
                      }}
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
            )}

            {mode === 'edit' && (
              <Button
                variant="contained"
                color="error"
                onClick={() => setOpenDelete(true)}
              >
                Eliminar
              </Button>
            )}
          </Box>
        }
      />
      {/* Modal de eliminación */}
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
