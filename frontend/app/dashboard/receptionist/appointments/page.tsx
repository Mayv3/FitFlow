'use client'

import { useState, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import { EventInput } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import esLocale from '@fullcalendar/core/locales/es'
import { Box, Button } from '@mui/material'
import { FormModal } from '@/components/ui/modals/FormModal'
import { getInputFieldsTurnos, layoutTurnos } from '@/const/inputs/appointments'
import { useUser } from '@/context/UserContext'

// --- Modelo mínimo ---
type Turno = EventInput & {
  id: string
  servicio: string
  profesional: string
  miembro: string
}

// --- Componente principal ---
export default function Page() {
  const calendarRef = useRef<FullCalendar | null>(null)
  const { user } = useUser()
  const gymId = user?.gym_id ?? ''

  const [events, setEvents] = useState<Turno[]>([
    {
      id: '1',
      title: 'Evaluación inicial',
      servicio: 'Evaluación',
      profesional: 'Lic. Ana Gómez',
      miembro: 'Juan Pérez',
      start: '2025-08-01T10:00',
      end: '2025-08-03T11:00',
    },
  ])

  // estado del modal
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [initialValues, setInitialValues] = useState<any>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleAddTurno = (values: any) => {
    const newId = String(Date.now())
    setEvents((prev) => [
      ...prev,
      {
        id: newId,
        title: values.titulo,
        servicio: values.servicio,
        profesional: values.profesional,
        miembro: values.miembro,
        start: values.inicio_at,
        end: values.fin_at,
      },
    ])
    setOpen(false)
  }

  const handleEditTurno = (values: any) => {
    if (!selectedId) return
    setEvents((prev) =>
      prev.map((e) =>
        e.id === selectedId
          ? {
            ...e,
            title: values.titulo,
            servicio: values.servicio,
            profesional: values.profesional,
            miembro: values.miembro,
            start: values.inicio_at,
            end: values.fin_at,
          }
          : e
      )
    )
    setOpen(false)
  }

  // --- Click en un evento -> abrir en modo edición
  const handleEventClick = (clickInfo: any) => {
    const ev = clickInfo.event
    setSelectedId(ev.id)
    setMode('edit')
    setInitialValues({
      titulo: ev.title,
      servicio: ev.extendedProps.servicio,
      profesional: ev.extendedProps.profesional,
      miembro: ev.extendedProps.miembro,
      inicio_at: ev.startStr,
      fin_at: ev.endStr,
    })
    setOpen(true)
  }

  // --- Click en un día -> abrir en modo creación
  const handleSelect = (selectInfo: any) => {
    setMode('create')
    setInitialValues({
      titulo: '',
      servicio: '',
      profesional: '',
      miembro: '',
      inicio_at: selectInfo.startStr,
      fin_at: selectInfo.endStr,
    })
    setSelectedId(null)
    setOpen(true)
  }

  // --- Drag & drop / resize
  const handleEventDrop = (dropInfo: any) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === dropInfo.event.id
          ? { ...e, start: dropInfo.event.startStr, end: dropInfo.event.endStr }
          : e
      )
    )
  }

  const handleEventResize = (resizeInfo: any) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === resizeInfo.event.id
          ? { ...e, start: resizeInfo.event.startStr, end: resizeInfo.event.endStr }
          : e
      )
    )
  }

  return (
    <Box p={2}>
      <Button
        variant="contained"
        sx={{ mb: 2 }}
        onClick={() => {
          setMode('create')
          setInitialValues(null)
          setSelectedId(null)
          setOpen(true)
        }}
      >
        Añadir turno
      </Button>
      <Box
        sx={{
          width: '100%',
          maxWidth: 1600,
          height: '84vh',
          margin: '0 auto',    // centrado
          backgroundColor: '#fff',
          borderRadius: 2,
          p: 2,
          boxShadow: 2,
        }}
      >

        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale={esLocale}
          height="100%"
          selectable={true}       // 👈 necesario para que funcione el "arrastrar"
          selectMirror={true}
          editable={true}
          events={events}

          // Caso 1: click en un día
          dateClick={(info) => {
            setMode('create')
            setInitialValues({
              titulo: '',
              servicio: '',
              profesional: '',
              miembro: '',
              inicio_at: info.dateStr + 'T10:00', // default 10:00
              fin_at: info.dateStr + 'T11:00',
            })
            setSelectedId(null)
            setOpen(true)
          }}

          // Caso 2: arrastrar varios días
          select={(selectInfo) => {
            // corrige endStr porque viene exclusivo
            const endDate = new Date(selectInfo.endStr)
            endDate.setDate(endDate.getDate() - 1) // le resto 1 día

            setMode('create')
            setInitialValues({
              titulo: '',
              servicio: '',
              profesional: '',
              miembro: '',
              inicio_at: selectInfo.startStr + 'T09:00',
              fin_at: endDate.toISOString().slice(0, 16), // formato válido para datetime-local
            })
            setSelectedId(null)
            setOpen(true)
          }}

          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          dayCellClassNames={() => 'cursor-pointer'}
          headerToolbar={{
            left: '',
            center: 'title',
            right: '',
          }}
        />

      </Box>



      <FormModal
        open={open}
        title={mode === 'create' ? 'Añadir un turno' : 'Editar turno'}
        fields={getInputFieldsTurnos()}
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
      />
    </Box>
  )
}
