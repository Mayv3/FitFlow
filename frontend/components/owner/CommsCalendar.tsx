"use client"

import { useMemo } from "react"
import {
    Box,
    Typography,
    IconButton,
    CircularProgress,
    Tooltip,
    Divider,
} from "@mui/material"
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft"
import ChevronRightIcon from "@mui/icons-material/ChevronRight"
import EventBusyIcon from "@mui/icons-material/EventBusy"

const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]
const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"]

export interface DayRef { y: number; m: number; d: number }

function dayKey(y: number, m: number, d: number): string {
    return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
}

interface CommsCalendarProps {
    accent: string
    accentDark: string
    year: number
    month: number
    onPrev: () => void
    onNext: () => void
    byDay: Record<string, number>
    loadingCalendar: boolean
    selectedDay: DayRef | null
    onSelectDay: (y: number, m: number, d: number) => void
    unit: (n: number) => string
    legendText: string
    placeholderText: string
    renderDay: React.ReactNode
}

export function CommsCalendar({
    accent,
    accentDark,
    year,
    month,
    onPrev,
    onNext,
    byDay,
    loadingCalendar,
    selectedDay,
    onSelectDay,
    unit,
    legendText,
    placeholderText,
    renderDay,
}: CommsCalendarProps) {
    const today = new Date()

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
        const prefix = `${year}-${String(month + 1).padStart(2, "0")}-`
        for (const k of Object.keys(byDay)) {
            if (k.startsWith(prefix)) total += byDay[k]
        }
        return total
    }, [byDay, year, month])

    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth()
    const isSelectedDay = (d: number) =>
        selectedDay && selectedDay.y === year && selectedDay.m === month && selectedDay.d === d

    return (
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2, alignItems: "stretch" }}>
            {/* Calendario */}
            <Box sx={{ flex: { xs: "unset", md: "0 0 240px" }, width: { xs: "100%", md: 240 }, minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                    <IconButton onClick={onPrev} size="small"><ChevronLeftIcon fontSize="small" /></IconButton>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {MONTHS[month]} {year}
                        {monthTotal > 0 && (
                            <Typography component="span" variant="caption" sx={{ ml: 1, color: accentDark, fontWeight: 600 }}>
                                · {unit(monthTotal)}
                            </Typography>
                        )}
                    </Typography>
                    <IconButton onClick={onNext} size="small" disabled={isCurrentMonth}>
                        <ChevronRightIcon fontSize="small" />
                    </IconButton>
                </Box>

                {loadingCalendar ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                        <CircularProgress size={24} sx={{ color: accent }} />
                    </Box>
                ) : (
                    <>
                        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.25, mb: 0.25 }}>
                            {WEEKDAYS.map((w, i) => (
                                <Typography key={i} variant="caption" sx={{
                                    textAlign: "center",
                                    color: "text.secondary",
                                    fontWeight: 600,
                                    fontSize: "0.75rem",
                                }}>
                                    {w}
                                </Typography>
                            ))}
                        </Box>
                        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.25 }}>
                            {cells.map((d, i) => {
                                if (d === null) return <Box key={i} sx={{ aspectRatio: "1 / 1" }} />
                                const key = dayKey(year, month, d)
                                const count = byDay[key] || 0
                                const isToday = d === today.getDate() && isCurrentMonth
                                const has = count > 0
                                const selected = isSelectedDay(d)
                                const cell = (
                                    <Box
                                        onClick={has ? () => onSelectDay(year, month, d) : undefined}
                                        sx={{
                                            aspectRatio: "1 / 1",
                                            borderRadius: 0.75,
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            position: "relative",
                                            cursor: has ? "pointer" : "default",
                                            border: (t) =>
                                                selected ? `2px solid ${accentDark}` :
                                                isToday ? `1.5px solid ${accent}` :
                                                `1px solid ${t.palette.divider}`,
                                            bgcolor: selected
                                                ? accent
                                                : has
                                                    ? (t) => t.palette.mode === "dark" ? `${accent}2e` : `${accent}1f`
                                                    : "transparent",
                                            color: selected
                                                ? "white"
                                                : has
                                                    ? (t) => t.palette.mode === "dark" ? accent : accentDark
                                                    : "text.secondary",
                                            fontWeight: has ? 600 : 400,
                                            transition: "transform 0.1s",
                                            "&:hover": has && !selected ? { transform: "scale(1.08)" } : {},
                                        }}
                                    >
                                        <Typography sx={{ fontWeight: "inherit", color: "inherit", lineHeight: 1, fontSize: "0.85rem" }}>
                                            {d}
                                        </Typography>
                                        {has && (
                                            <Box sx={{
                                                position: "absolute",
                                                bottom: 2,
                                                width: 4,
                                                height: 4,
                                                borderRadius: "50%",
                                                bgcolor: selected ? "white" : accent,
                                            }} />
                                        )}
                                    </Box>
                                )
                                return has ? (
                                    <Tooltip key={i} title={unit(count)} arrow>{cell}</Tooltip>
                                ) : <Box key={i}>{cell}</Box>
                            })}
                        </Box>
                        <Box sx={{ mt: 1.5, display: "flex", alignItems: "center", gap: 1, justifyContent: "center" }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: accent }} />
                            <Typography variant="caption" color="text.secondary">{legendText}</Typography>
                        </Box>
                    </>
                )}
            </Box>

            <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", md: "block" } }} />

            {/* Detalle del día */}
            <Box sx={{ flex: { xs: "unset", md: 1 }, width: { xs: "100%", md: "auto" }, minWidth: 0, display: "flex", flexDirection: "column" }}>
                {!selectedDay ? (
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 4, color: "text.secondary" }}>
                        <EventBusyIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                        <Typography variant="body2" textAlign="center">{placeholderText}</Typography>
                    </Box>
                ) : (
                    <>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
                            {selectedDay.d} de {MONTHS[selectedDay.m]} {selectedDay.y}
                        </Typography>
                        {renderDay}
                    </>
                )}
            </Box>
        </Box>
    )
}
