"use client"

import { useEffect, useState } from "react"
import {
    Box,
    Paper,
    Typography,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    IconButton,
    CircularProgress,
    Avatar,
    Stack,
} from "@mui/material"
import { alpha, useTheme } from "@mui/material/styles"
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft"
import ChevronRightIcon from "@mui/icons-material/ChevronRight"
import GroupIcon from "@mui/icons-material/Group"
import PersonAddIcon from "@mui/icons-material/PersonAdd"
import PaidIcon from "@mui/icons-material/Paid"
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import CancelIcon from "@mui/icons-material/Cancel"
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    PieChart,
    Pie,
    Cell,
} from "recharts"
import { api } from "@/lib/api"
import { useGyms } from "@/hooks/gyms/useGyms"

const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

interface SeriePunto { month: string; facturacion: number; altas: number; pagos: number }
interface OverviewData {
    month: string
    alumnos: { total: number; activos: number; vencidos: number; altas_mes: number }
    facturacion: { total: number; cantidad: number }
    series: SeriePunto[]
}

const money = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n || 0)

const moneyShort = (v: number) =>
    v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v}`

const shortMonth = (mk: string) => {
    const m = Number(mk.slice(5, 7))
    return (MONTHS[m - 1] || "").slice(0, 3)
}

/** Tooltip redondeado estilo dashboard admin */
function ChartTooltip({ active, payload, label, money: isMoney }: any) {
    if (!active || !payload?.length) return null
    const p = payload[0]
    return (
        <Box sx={{
            px: 1.5, py: 1, borderRadius: 1.5, bgcolor: "background.paper",
            boxShadow: 3, border: (t) => `1px solid ${alpha(t.palette.divider, 0.8)}`, minWidth: 90,
        }}>
            <Typography variant="caption" color="text.secondary" display="block">{label ?? p.name}</Typography>
            <Typography variant="body2" fontWeight={700} sx={{ color: p.payload?.color ?? "text.primary" }}>
                {isMoney ? money(Number(p.value)) : Number(p.value).toLocaleString("es-AR")}
            </Typography>
        </Box>
    )
}

function StatCard({ icon, label, value, color }: {
    icon: React.ReactNode; label: string; value: number | string; color: string
}) {
    return (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flex: "1 1 160px", minWidth: 160 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar sx={{ bgcolor: color, width: 40, height: 40 }}>{icon}</Avatar>
                <Box minWidth={0}>
                    <Typography variant="caption" color="text.secondary" noWrap>{label}</Typography>
                    <Typography variant="h6" fontWeight={700} noWrap>{value}</Typography>
                </Box>
            </Stack>
        </Paper>
    )
}

export function GymStatsSection() {
    const t = useTheme()
    const { data: gyms = [] } = useGyms()
    const today = new Date()
    const [gymId, setGymId] = useState("")
    const [year, setYear] = useState(today.getFullYear())
    const [month, setMonth] = useState(today.getMonth())
    const [data, setData] = useState<OverviewData | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!gymId && gyms.length) setGymId(gyms[0].id)
    }, [gyms, gymId])

    const monthParam = `${year}-${String(month + 1).padStart(2, "0")}`

    useEffect(() => {
        if (!gymId) return
        let cancelled = false
        ;(async () => {
            setLoading(true); setError(null)
            try {
                const { data: d } = await api.get(
                    `/api/stats/dashboard/owner/gyms/${gymId}/overview`,
                    { params: { month: monthParam } }
                )
                if (!cancelled) setData(d)
            } catch (e: any) {
                if (!cancelled) setError(e?.response?.data?.error || e.message)
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()
        return () => { cancelled = true }
    }, [gymId, monthParam])

    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth()
    function prevMonth() {
        if (month === 0) { setMonth(11); setYear((y) => y - 1) }
        else setMonth((m) => m - 1)
    }
    function nextMonth() {
        if (isCurrentMonth) return
        if (month === 11) { setMonth(0); setYear((y) => y + 1) }
        else setMonth((m) => m + 1)
    }

    const gridStroke = alpha(t.palette.text.primary, 0.08)
    const chartPaperSx = {
        p: 2.5,
        borderRadius: 2,
        flex: "1 1 320px",
        minWidth: 300,
        border: `1px solid ${alpha(t.palette.text.primary, 0.08)}`,
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
    } as const

    const donut = data
        ? [
            { name: "Activos", value: data.alumnos.activos, color: "#059669", grad: "url(#gradAct)", css: "linear-gradient(135deg,#34d399,#059669)" },
            { name: "Vencidos", value: data.alumnos.vencidos, color: "#e11d48", grad: "url(#gradVen)", css: "linear-gradient(135deg,#fb7185,#e11d48)" },
        ]
        : []
    const bothPos = data ? data.alumnos.activos > 0 && data.alumnos.vencidos > 0 : false
    const factData = data ? data.series.map((s) => ({ name: shortMonth(s.month), value: s.facturacion })) : []
    const altasData = data ? data.series.map((s) => ({ name: shortMonth(s.month), value: s.altas })) : []

    return (
        <Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }} justifyContent="space-between" mb={2}>
                <FormControl size="small" sx={{ minWidth: 220 }}>
                    <InputLabel>Gimnasio</InputLabel>
                    <Select value={gymId} label="Gimnasio" onChange={(e) => setGymId(e.target.value)}>
                        {gyms.map((g) => (
                            <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <IconButton size="small" onClick={prevMonth}><ChevronLeftIcon /></IconButton>
                    <Typography sx={{ fontWeight: 600, minWidth: 150, textAlign: "center" }}>
                        {MONTHS[month]} {year}
                    </Typography>
                    <IconButton size="small" onClick={nextMonth} disabled={isCurrentMonth}>
                        <ChevronRightIcon />
                    </IconButton>
                </Box>
            </Stack>

            {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

            {loading ? (
                <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
            ) : data ? (
                <>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                        <StatCard icon={<GroupIcon />} label="Alumnos totales" value={data.alumnos.total} color="#16A34A" />
                        <StatCard icon={<CheckCircleIcon />} label="Activos" value={data.alumnos.activos} color="#16a34a" />
                        <StatCard icon={<CancelIcon />} label="Vencidos" value={data.alumnos.vencidos} color="#ef4444" />
                        <StatCard icon={<PersonAddIcon />} label="Altas del mes" value={data.alumnos.altas_mes} color="#3b82f6" />
                        <StatCard icon={<PaidIcon />} label="Facturación del mes" value={money(data.facturacion.total)} color="#7c3aed" />
                        <StatCard icon={<ReceiptLongIcon />} label="Pagos del mes" value={data.facturacion.cantidad} color="#f59e0b" />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
                        Alumnos: estado actual · Altas / Facturación / Pagos: del mes seleccionado.
                    </Typography>

                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 2 }}>
                        {/* Donut activos vs vencidos */}
                        <Paper variant="outlined" sx={chartPaperSx}>
                            <Typography variant="subtitle2" fontWeight={600} color="text.secondary" mb={1}>
                                Alumnos — activos vs vencidos
                            </Typography>
                            <Box sx={{ height: 190 }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <defs>
                                            <linearGradient id="gradAct" x1="0" y1="0" x2="1" y2="1">
                                                <stop offset="0%" stopColor="#34d399" />
                                                <stop offset="100%" stopColor="#059669" />
                                            </linearGradient>
                                            <linearGradient id="gradVen" x1="0" y1="0" x2="1" y2="1">
                                                <stop offset="0%" stopColor="#fb7185" />
                                                <stop offset="100%" stopColor="#e11d48" />
                                            </linearGradient>
                                        </defs>
                                        <Pie
                                            data={donut}
                                            dataKey="value"
                                            nameKey="name"
                                            innerRadius="60%"
                                            outerRadius="88%"
                                            startAngle={90}
                                            endAngle={-270}
                                            paddingAngle={bothPos ? 2 : 0}
                                            stroke="transparent"
                                        >
                                            {donut.map((d) => <Cell key={d.name} fill={d.grad} />)}
                                        </Pie>
                                        <Tooltip content={<ChartTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                            <Box sx={{ display: "flex", justifyContent: "center", gap: 3, mt: 1 }}>
                                {donut.map((d) => (
                                    <Box key={d.name} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <Box sx={{ width: 14, height: 14, borderRadius: "50%", background: d.css }} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" display="block" lineHeight={1.1}>{d.name}</Typography>
                                            <Typography variant="body2" fontWeight={700} lineHeight={1.1}>{d.value.toLocaleString("es-AR")}</Typography>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </Paper>

                        {/* Facturación últimos 6 meses */}
                        <Paper variant="outlined" sx={chartPaperSx}>
                            <Typography variant="subtitle2" fontWeight={600} color="text.secondary" mb={1}>
                                Facturación — últimos 6 meses
                            </Typography>
                            <Box sx={{ height: 230 }}>
                                <ResponsiveContainer>
                                    <BarChart data={factData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap={16}>
                                        <defs>
                                            <linearGradient id="gradFact" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#22C55E" />
                                                <stop offset="100%" stopColor="#16A34A" />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid vertical={false} stroke={gridStroke} />
                                        <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 12 }} />
                                        <YAxis tickLine={false} axisLine={false} width={46} tickMargin={4} tick={{ fontSize: 11 }} tickFormatter={(v: number) => moneyShort(v)} />
                                        <Tooltip cursor={{ fill: alpha(t.palette.primary.main, 0.06) }} content={<ChartTooltip money />} />
                                        <Bar dataKey="value" name="Facturación" fill="url(#gradFact)" radius={[8, 8, 0, 0]} barSize={30} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </Paper>

                        {/* Altas últimos 6 meses */}
                        <Paper variant="outlined" sx={chartPaperSx}>
                            <Typography variant="subtitle2" fontWeight={600} color="text.secondary" mb={1}>
                                Altas — últimos 6 meses
                            </Typography>
                            <Box sx={{ height: 230 }}>
                                <ResponsiveContainer>
                                    <BarChart data={altasData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap={16}>
                                        <defs>
                                            <linearGradient id="gradAltas" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#38BDF8" />
                                                <stop offset="100%" stopColor="#1674FF" />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid vertical={false} stroke={gridStroke} />
                                        <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 12 }} />
                                        <YAxis tickLine={false} axisLine={false} width={28} tickMargin={4} tick={{ fontSize: 11 }} allowDecimals={false} />
                                        <Tooltip cursor={{ fill: alpha(t.palette.primary.main, 0.06) }} content={<ChartTooltip />} />
                                        <Bar dataKey="value" name="Altas" fill="url(#gradAltas)" radius={[8, 8, 0, 0]} barSize={30} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </Paper>
                    </Box>
                </>
            ) : (
                <Typography color="text.secondary" textAlign="center" py={4}>
                    Seleccioná un gimnasio.
                </Typography>
            )}
        </Box>
    )
}
