"use client"

import { useEffect, useMemo, useState } from "react"
import {
    Box,
    Paper,
    Typography,
    IconButton,
    CircularProgress,
    Stack,
    Chip,
    Divider,
    Tooltip,
} from "@mui/material"
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import HistoryIcon from '@mui/icons-material/History'
import { api } from "@/lib/api"

const GREEN = '#25D366'
const DARK_GREEN = '#128C7E'

const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

interface Mensaje {
    id: number
    nombre: string
    telefono: string
    plan: string
    vencimiento: string
    mensaje: string
    enviado_at: string
}

function dayKey(y: number, m: number, d: number): string {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function startOfDayISO(y: number, m: number, d: number): string {
    return new Date(y, m, d, 0, 0, 0).toISOString()
}

function endOfDayISO(y: number, m: number, d: number): string {
    return new Date(y, m, d + 1, 0, 0, 0).toISOString()
}

export function WhatsappHistory({ gymId }: { gymId: string }) {
    const today = new Date()
    const [year, setYear] = useState(today.getFullYear())
    const [month, setMonth] = useState(today.getMonth())
    const [byDay, setByDay] = useState<Record<string, number>>({})
    const [loading, setLoading] = useState(true)
    const [selectedDay, setSelectedDay] = useState<{ y: number; m: number; d: number } | null>(null)
    const [dayMsgs, setDayMsgs] = useState<Mensaje[] | null>(null)
    const [loadingDay, setLoadingDay] = useState(false)

    useEffect(() => {
        if (!gymId) return
        loadCalendar()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gymId, year, month])

    async function loadCalendar() {
        setLoading(true)
        try {
            const from = new Date(year, month, 1, 0, 0, 0).toISOString()
            const to = new Date(year, month + 1, 1, 0, 0, 0).toISOString()
            const { data } = await api.get(`/api/whatsapp/gyms/${gymId}/mensajes/calendar`, {
                params: { from, to },
            })
            setByDay((prev) => ({ ...prev, ...(data.byDay || {}) }))
        } catch {
            // keep previous data
        } finally {
            setLoading(false)
        }
    }

    async function selectDay(y: number, m: number, d: number) {
        setSelectedDay({ y, m, d })
        setDayMsgs(null)
        setLoadingDay(true)
        try {
            const { data } = await api.get(`/api/whatsapp/gyms/${gymId}/mensajes`, {
                params: {
                    from: startOfDayISO(y, m, d),
                    to: endOfDayISO(y, m, d),
                    limit: 1000,
                },
            })
            setDayMsgs(data || [])
        } catch {
            setDayMsgs([])
        } finally {
            setLoadingDay(false)
        }
    }

    function prevMonth() {
        if (month === 0) { setMonth(11); setYear(y => y - 1) }
        else setMonth(m => m - 1)
    }
    function nextMonth() {
        if (month === 11) { setMonth(0); setYear(y => y + 1) }
        else setMonth(m => m + 1)
    }

    const cells = useMemo(() => {
        const firstDay = new Date(year, month, 1)
        const offset = (firstDay.getDay() + 6) % 7
        const daysInMonth = new Date(year, month + 1, 0).getDate()
        const arr: (number | null)[] = []
        for (let i = 0; i < offset; i++) arr.push(null)
        for (let d = 1; d <= daysInMonth; d++) arr.push(d)
        while (arr.length % 7 !== 0) arr.push(null)
        return arr
    }, [year, month])

    const monthTotal = useMemo(() => {
        let total = 0
        for (const k of Object.keys(byDay)) {
            if (k.startsWith(`${year}-${String(month + 1).padStart(2, '0')}-`)) total += byDay[k]
        }
        return total
    }, [byDay, year, month])

    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth()
    const isSelectedDay = (d: number) =>
        selectedDay && selectedDay.y === year && selectedDay.m === month && selectedDay.d === d

    return (
        <Paper sx={{ p: 3, mt: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <HistoryIcon sx={{ color: DARK_GREEN }} />
                <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
                    Historial de mensajes
                </Typography>
                <Chip
                    size="small"
                    label={`${monthTotal} este mes`}
                    sx={{
                        bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(37,211,102,0.15)' : 'rgba(37,211,102,0.12)',
                        color: (t) => t.palette.mode === 'dark' ? GREEN : DARK_GREEN,
                        fontWeight: 600,
                    }}
                />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: 'stretch' }}>
                {/* Calendario compacto */}
                <Box sx={{ flex: { xs: 'unset', md: '0 0 60%' }, width: { xs: '100%', md: 'auto' }, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <IconButton onClick={prevMonth} size="small"><ChevronLeftIcon fontSize="small" /></IconButton>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {MONTHS[month]} {year}
                        </Typography>
                        <IconButton onClick={nextMonth} size="small" disabled={isCurrentMonth}>
                            <ChevronRightIcon fontSize="small" />
                        </IconButton>
                    </Box>

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                            <CircularProgress size={24} sx={{ color: GREEN }} />
                        </Box>
                    ) : (
                        <>
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.25, mb: 0.25 }}>
                                {WEEKDAYS.map((w, i) => (
                                    <Typography key={i} variant="caption" sx={{
                                        textAlign: 'center',
                                        color: 'text.secondary',
                                        fontWeight: 600,
                                        fontSize: '0.75rem',
                                    }}>
                                        {w}
                                    </Typography>
                                ))}
                            </Box>
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.25 }}>
                                {cells.map((d, i) => {
                                    if (d === null) return <Box key={i} sx={{ aspectRatio: '1 / 1' }} />
                                    const key = dayKey(year, month, d)
                                    const count = byDay[key] || 0
                                    const isToday = d === today.getDate() && isCurrentMonth
                                    const has = count > 0
                                    const selected = isSelectedDay(d)
                                    const cell = (
                                        <Box
                                            onClick={has ? () => selectDay(year, month, d) : undefined}
                                            sx={{
                                                aspectRatio: '1 / 1',
                                                borderRadius: 0.75,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                position: 'relative',
                                                cursor: has ? 'pointer' : 'default',
                                                border: (t) =>
                                                    selected ? `2px solid ${DARK_GREEN}` :
                                                    isToday ? `1.5px solid ${GREEN}` :
                                                    `1px solid ${t.palette.divider}`,
                                                bgcolor: selected
                                                    ? GREEN
                                                    : has
                                                        ? (t) => t.palette.mode === 'dark' ? 'rgba(37,211,102,0.18)' : 'rgba(37,211,102,0.12)'
                                                        : 'transparent',
                                                color: selected
                                                    ? 'white'
                                                    : has
                                                        ? (t) => t.palette.mode === 'dark' ? GREEN : DARK_GREEN
                                                        : 'text.secondary',
                                                fontWeight: has ? 600 : 400,
                                                transition: 'transform 0.1s',
                                                '&:hover': has && !selected ? { transform: 'scale(1.08)' } : {},
                                            }}
                                        >
                                            <Typography sx={{
                                                fontWeight: 'inherit',
                                                color: 'inherit',
                                                lineHeight: 1,
                                                fontSize: '0.85rem',
                                            }}>
                                                {d}
                                            </Typography>
                                            {has && (
                                                <Box sx={{
                                                    position: 'absolute',
                                                    bottom: 2,
                                                    width: 4,
                                                    height: 4,
                                                    borderRadius: '50%',
                                                    bgcolor: selected ? 'white' : GREEN,
                                                }} />
                                            )}
                                        </Box>
                                    )
                                    return has ? (
                                        <Tooltip key={i} title={`${count} mensaje${count === 1 ? '' : 's'}`} arrow>
                                            {cell}
                                        </Tooltip>
                                    ) : <Box key={i}>{cell}</Box>
                                })}
                            </Box>
                            <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: GREEN }} />
                                <Typography variant="caption" color="text.secondary">
                                    Día con envíos
                                </Typography>
                            </Box>
                        </>
                    )}
                </Box>

                <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

                {/* Lista del día seleccionado */}
                <Box sx={{ flex: { xs: 'unset', md: '0 0 calc(40% - 24px)' }, width: { xs: '100%', md: 'auto' }, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                    {!selectedDay ? (
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            py: 6,
                            color: 'text.secondary',
                        }}>
                            <HistoryIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                            <Typography variant="body2" textAlign="center">
                                Seleccioná un día con envíos para ver los mensajes.
                            </Typography>
                        </Box>
                    ) : (
                        <>
                            <Box sx={{ mb: 1.5 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                    {selectedDay.d} de {MONTHS[selectedDay.m]} {selectedDay.y}
                                </Typography>
                                {dayMsgs && (
                                    <Typography variant="caption" color="text.secondary">
                                        {dayMsgs.length} mensaje{dayMsgs.length === 1 ? '' : 's'} enviado{dayMsgs.length === 1 ? '' : 's'}
                                    </Typography>
                                )}
                            </Box>

                            {loadingDay ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                                    <CircularProgress size={28} sx={{ color: GREEN }} />
                                </Box>
                            ) : dayMsgs && dayMsgs.length > 0 ? (
                                {/* Cap ~4 items visibles; a partir del 4to empieza el scroll. Ajustá maxHeight si querés más/menos. */}
                                <Stack spacing={1.2} sx={{ flex: 1, overflowY: 'auto', pr: 1, minHeight: 0, maxHeight: 480 }}>
                                    {dayMsgs.map((m) => (
                                        <Box key={m.id} sx={{
                                            p: 1.5,
                                            borderRadius: 1,
                                            border: (t) => `1px solid ${t.palette.divider}`,
                                            bgcolor: 'background.paper',
                                        }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                    {m.nombre || '—'}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {new Date(m.enviado_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                                </Typography>
                                            </Box>
                                            <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, mb: 1, flexWrap: 'wrap' }} useFlexGap>
                                                {m.telefono && <Chip size="small" label={m.telefono} variant="outlined" />}
                                                {m.plan && <Chip size="small" label={m.plan} variant="outlined" />}
                                                {m.vencimiento && <Chip size="small" label={`vence ${m.vencimiento}`} variant="outlined" />}
                                            </Stack>
                                            <Divider sx={{ my: 0.5 }} />
                                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.primary' }}>
                                                {m.mensaje}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            ) : (
                                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                                    Sin mensajes este día.
                                </Typography>
                            )}
                        </>
                    )}
                </Box>
            </Box>
        </Paper>
    )
}
