"use client"

import { useEffect, useMemo, useState } from "react"
import {
    Box,
    Typography,
    Chip,
    Avatar,
    Button,
} from "@mui/material"
import RefreshIcon from "@mui/icons-material/Refresh"
import { api } from "@/lib/api"
import { CommsCalendar, DayRef } from "./CommsCalendar"

export type Mode = "email" | "whatsapp"

const ACCENT: Record<Mode, { main: string; dark: string }> = {
    email: { main: "#7c3aed", dark: "#5b21b6" },
    whatsapp: { main: "#25D366", dark: "#128C7E" },
}

interface CommRow {
    id: string | number
    date: string            // ISO timestamp (created_at / enviado_at)
    gym_id: string
    gym_nombre: string
    gym_logo: string | null
    estado: string | null
    // email
    asunto?: string | null
    email_destino?: string | null
    plan_nombre?: string | null
    error_msg?: string | null
    // whatsapp
    nombre?: string | null
    telefono?: string | null
    plan?: string | null
    mensaje?: string | null
}

interface GymGroup {
    gym_id: string
    gym_nombre: string
    gym_logo: string | null
    items: CommRow[]
}

function pad(n: number) { return String(n).padStart(2, "0") }
function dayKeyOf(iso: string) {
    const d = new Date(iso)
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
export function CommsHistory({ channel }: { channel: Mode }) {
    const today = new Date()
    const mode = channel
    const [year, setYear] = useState(today.getFullYear())
    const [month, setMonth] = useState(today.getMonth())
    const [selectedDay, setSelectedDay] = useState<DayRef | null>(null)

    const [emailRows, setEmailRows] = useState<CommRow[] | null>(null)
    const [waRows, setWaRows] = useState<CommRow[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function fetchEmails() {
        setLoading(true); setError(null)
        try {
            const { data: payload } = await api.get("/api/emails/logs", { params: { limit: 2000 } })
            const groups = payload.data || []
            const rows: CommRow[] = []
            for (const g of groups) {
                for (const e of g.emails || []) {
                    rows.push({
                        id: e.id,
                        date: e.created_at,
                        gym_id: g.gym_id,
                        gym_nombre: g.gym_nombre,
                        gym_logo: g.gym_logo,
                        estado: e.estado,
                        asunto: e.asunto,
                        email_destino: e.email_destino,
                        plan_nombre: e.plan_nombre,
                        error_msg: e.error_msg,
                    })
                }
            }
            setEmailRows(rows)
        } catch (e: any) {
            setError(e?.response?.data?.error || e.message)
        } finally { setLoading(false) }
    }

    async function fetchWa() {
        setLoading(true); setError(null)
        try {
            const { data: payload } = await api.get("/api/whatsapp/owner/mensajes", {
                params: { limit: 10000 },
            })
            const rows: CommRow[] = (payload.data || []).map((r: any) => ({
                id: r.id,
                date: r.enviado_at,
                gym_id: r.gym_id,
                gym_nombre: r.gym_nombre,
                gym_logo: r.gym_logo,
                estado: r.estado,
                nombre: r.nombre,
                telefono: r.telefono,
                plan: r.plan,
                mensaje: r.mensaje,
            }))
            setWaRows(rows)
        } catch (e: any) {
            setError(e?.response?.data?.error || e.message)
        } finally { setLoading(false) }
    }

    // Carga todo el historial del canal una vez (canal fijo por sección)
    useEffect(() => {
        if (mode === "email") fetchEmails()
        else fetchWa()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const rows = mode === "email" ? (emailRows || []) : waRows
    const total = rows.length

    const byDay = useMemo(() => {
        const map: Record<string, number> = {}
        for (const r of rows) {
            const key = dayKeyOf(r.date)
            map[key] = (map[key] || 0) + 1
        }
        return map
    }, [rows])

    const dayGroups: GymGroup[] = useMemo(() => {
        if (!selectedDay) return []
        const key = `${selectedDay.y}-${pad(selectedDay.m + 1)}-${pad(selectedDay.d)}`
        const items = rows.filter((r) => dayKeyOf(r.date) === key)
        const byGym = new Map<string, GymGroup>()
        for (const it of items) {
            let g = byGym.get(it.gym_id)
            if (!g) {
                g = { gym_id: it.gym_id, gym_nombre: it.gym_nombre, gym_logo: it.gym_logo, items: [] }
                byGym.set(it.gym_id, g)
            }
            g.items.push(it)
        }
        return Array.from(byGym.values()).sort((a, b) => b.items.length - a.items.length)
    }, [rows, selectedDay])

    const dayTotal = useMemo(() => dayGroups.reduce((a, g) => a + g.items.length, 0), [dayGroups])

    const accent = ACCENT[mode]
    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth()

    function prevMonth() {
        setSelectedDay(null)
        if (month === 0) { setMonth(11); setYear((y) => y - 1) }
        else setMonth((m) => m - 1)
    }
    function nextMonth() {
        if (isCurrentMonth) return
        setSelectedDay(null)
        if (month === 11) { setMonth(0); setYear((y) => y + 1) }
        else setMonth((m) => m + 1)
    }
    function refresh() {
        setSelectedDay(null)
        if (mode === "email") { setEmailRows(null); fetchEmails() }
        else { setWaRows([]); fetchWa() }
    }

    const unit = mode === "email"
        ? (n: number) => `${n} email${n === 1 ? "" : "s"}`
        : (n: number) => `${n} mensaje${n === 1 ? "" : "s"}`

    return (
        <Box>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                    Total:{" "}
                    <Box component="span" sx={{ fontWeight: 700, color: accent.main }}>{total}</Box>{" "}
                    {mode === "email" ? "emails" : "mensajes"}
                </Typography>
                <Button size="small" startIcon={<RefreshIcon />} onClick={refresh} disabled={loading}>
                    Actualizar
                </Button>
            </Box>

            {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

            <CommsCalendar
                accent={accent.main}
                accentDark={accent.dark}
                year={year}
                month={month}
                onPrev={prevMonth}
                onNext={nextMonth}
                byDay={byDay}
                loadingCalendar={loading && !selectedDay}
                selectedDay={selectedDay}
                onSelectDay={(y, m, d) => setSelectedDay({ y, m, d })}
                unit={unit}
                legendText={mode === "email" ? "Día con emails" : "Día con mensajes"}
                placeholderText="Seleccioná un día con envíos para ver el detalle por gimnasio."
                renderDay={
                    <>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                            {dayTotal} {mode === "email" ? "email" : "mensaje"}{dayTotal === 1 ? "" : "s"} · {dayGroups.length} gimnasio{dayGroups.length === 1 ? "" : "s"}
                        </Typography>
                        <Box sx={{ flex: 1, overflowY: "auto", pr: 0.5, maxHeight: { xs: 320, md: 340 } }}>
                            {dayGroups.map((g) => (
                                <Box key={g.gym_id} sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1, borderBottom: (t) => `1px solid ${t.palette.divider}` }}>
                                    <Avatar src={g.gym_logo || undefined} sx={{ bgcolor: accent.main, width: 30, height: 30, fontSize: "0.85rem" }}>
                                        {g.gym_nombre[0]?.toUpperCase()}
                                    </Avatar>
                                    <Typography fontWeight={600} sx={{ flex: 1 }} noWrap>{g.gym_nombre}</Typography>
                                    <Chip size="small" label={g.items.length} sx={{ bgcolor: accent.main, color: "#fff", fontWeight: 600 }} />
                                </Box>
                            ))}
                            {dayGroups.length === 0 && !loading && (
                                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                                    Sin envíos este día.
                                </Typography>
                            )}
                        </Box>
                    </>
                }
            />
        </Box>
    )
}
