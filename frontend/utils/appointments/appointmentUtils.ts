export function toLocalInputValue(date: Date | string | null): string {
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

export function toLocalISOString(date: Date): string {
  const tzDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return tzDate.toISOString().slice(0, 16)
}

export function generarLinkGoogleCalendar(turno: any): string {
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

  if (turno.emails && Array.isArray(turno.emails) && turno.emails.length > 0) {
    params.append('add', turno.emails.join(','))
  }

  return `${base}&${params.toString()}`
}

export const EMPTY_TURNO = {
  titulo: '',
  servicio_id: '',
  profesional: '',
  alumno_id: null,
  inicio_at: '',
  color: '#1976d2',
}
