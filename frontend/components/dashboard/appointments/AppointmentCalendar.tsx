'use client'

import React from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import esLocale from '@fullcalendar/core/locales/es'
import { Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'

interface AppointmentCalendarProps {
  events: any[]
  isMobile: boolean
  calendarRef: React.RefObject<FullCalendar>
  onEventClick: (info: any) => void
  onDateClick: (info: any) => void
  onEventDrop: (info: any) => Promise<void>
}

export function AppointmentCalendar({
  events,
  isMobile,
  calendarRef,
  onEventClick,
  onDateClick,
  onEventDrop,
}: AppointmentCalendarProps) {
  const theme = useTheme()

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: { xs: '100%' },
        height: { xs: '70vh', md: '84vh' },
        mx: 'auto',
        backgroundColor: theme.palette.background.paper,
        borderRadius: 2,
        p: { xs: 1.5, md: 2 },
        boxShadow: 2,
        '& .fc': {
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        },
        '& .fc-toolbar-title': {
          color: theme.palette.text.primary,
        },
        '& .fc-button': {
          backgroundColor: theme.palette.primary.main,
          borderColor: theme.palette.primary.main,
          color: '#fff',
          '&:hover': {
            backgroundColor: theme.palette.primary.dark,
          },
        },
        '& .fc-button-active': {
          backgroundColor: theme.palette.primary.dark,
        },
        '& .fc-col-header-cell': {
          backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f5f5f5',
          color: theme.palette.text.primary,
        },
        '& .fc-daygrid-day': {
          backgroundColor: theme.palette.background.default,
          color: theme.palette.text.primary,
        },
        '& .fc-daygrid-day-number': {
          color: theme.palette.text.primary,
        },
        '& .fc-daygrid-day.fc-day-today': {
          backgroundColor: theme.palette.mode === 'dark' ? '#1a3a2a' : '#e8f5e9',
        },
        '& .fc-event': {
          borderColor: theme.palette.primary.main,
          backgroundColor: theme.palette.primary.main,
        },
        '& .fc-daygrid-event': {
          backgroundColor: theme.palette.primary.main,
          borderColor: theme.palette.primary.main,
          color: '#fff',
        },
        '& .fc-scrollgrid': {
          borderColor: theme.palette.divider,
        },
        '& .fc-scrollgrid td, & .fc-scrollgrid th': {
          borderColor: theme.palette.divider,
        },
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
        events={events}
        eventClick={onEventClick}
        dayCellClassNames={() => 'cursor-pointer'}
        headerToolbar={{ left: '', center: 'title', right: '' }}
        titleFormat={{ year: 'numeric', month: 'long' }}
        dateClick={onDateClick}
        eventDrop={onEventDrop}
      />
    </Box>
  )
}
