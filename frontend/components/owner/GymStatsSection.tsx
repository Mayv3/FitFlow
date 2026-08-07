"use client"

import { useEffect, useMemo, useState } from "react"
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
    Checkbox,
    Chip,
    Button,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    TableContainer,
} from "@mui/material"
import { alpha, useTheme } from "@mui/material/styles"
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft"
import ChevronRightIcon from "@mui/icons-material/ChevronRight"
import GroupIcon from "@mui/icons-material/Group"
import PersonAddIcon from "@mui/icons-material/PersonAdd"
import PaidIcon from "@mui/icons-material/Paid"
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong"
import PriceCheckIcon from "@mui/icons-material/PriceCheck"
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
import { getApiErrorMessage, getErrorMessage } from "@/utils/errors/apiError"
import type { ChartTooltipProps } from "@/models/Charts/ChartTooltip"

const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

interface SeriePunto { month: string; facturacion: number; altas: number; pagos: number }
interface PlanPrecio { id: number; nombre: string; precio: number }
interface OverviewData {
    month: string
    alumnos: { total: number; activos: number; vencidos: number; altas_mes: number }
    facturacion: { total: number; cantidad: number }
    planes: { total: number; items: PlanPrecio[]; excluded_ids: number[]; precio_promedio: number }
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
function ChartTooltip({ active, payload, label, money: isMoney }: ChartTooltipProps & { money?: boolean }) {
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

/** Tabla horizontal de métricas: una columna por dato */
function StatsTable({ items }: {
    items: { icon: React.ReactNode; label: string; value: number | string; color: string }[]
}) {
    return (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, overflowX: "auto" }}>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        {items.map((it) => (
                            <TableCell key={it.label} align="center" sx={{ fontWeight: 700, fontSize: "0.72rem", whiteSpace: "nowrap" }}>
                                <Stack direction="row" spacing={0.75} alignItems="center" justifyContent="center">
                                    <Avatar variant="rounded" sx={{ bgcolor: `${it.color}1A`, color: it.color, width: 22, height: 22 }}>
                                        {it.icon}
                                    </Avatar>
                                    <span>{it.label}</span>
                                </Stack>
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    <TableRow sx={{ "& td": { border: 0 } }}>
                        {items.map((it) => (
                            <TableCell key={it.label} align="center" sx={{ py: 0.75 }}>
                                <Typography variant="body2" fontWeight={700} noWrap>{it.value}</Typography>
                            </TableCell>
                        ))}
                    </TableRow>
                </TableBody>
            </Table>
        </TableContainer>
    )
}

export function GymStatsSection() {
    const t = useTheme()
    const { data: gyms = [] } = useGyms()
    const today = new Date()
    const [gymIdElegido, setGymId] = useState("")
    const [year, setYear] = useState(today.getFullYear())
    const [month, setMonth] = useState(today.getMonth())
    const [data, setData] = useState<OverviewData | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [checkedPlanIds, setCheckedPlanIds] = useState<Set<number>>(new Set())

    // Default derivado durante el render: el primer gimnasio hasta que el usuario
    // elija otro. Antes esto era un useEffect que disparaba un render extra.
    const gymId = gymIdElegido || gyms[0]?.id || ""

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
                if (!cancelled) {
                    setData(d)
                    const excluded = new Set<number>(d?.planes?.excluded_ids ?? [])
                    const initial = new Set<number>(
                        (d?.planes?.items ?? [])
                            .map((p: PlanPrecio) => p.id)
                            .filter((id: number) => !excluded.has(id))
                    )
                    setCheckedPlanIds(initial)
                }
            } catch (e: unknown) {
                if (!cancelled) setError(getApiErrorMessage(e) ?? getErrorMessage(e) ?? null)
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()
        return () => { cancelled = true }
    }, [gymId, monthParam])

    const togglePlan = (id: number) => {
        setCheckedPlanIds((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const livePrecioPromedio = useMemo(() => {
        const items = data?.planes.items ?? []
        const checked = items.filter((p) => checkedPlanIds.has(p.id))
        if (!checked.length) return 0
        return checked.reduce((sum, p) => sum + p.precio, 0) / checked.length
    }, [data, checkedPlanIds])

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
        p: 1.5,
        borderRadius: 2,
        flex: "1 1 280px",
        minWidth: 260,
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
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} justifyContent="space-between" mb={1.5}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Gimnasio</InputLabel>
                    <Select value={gymId} label="Gimnasio" onChange={(e) => setGymId(e.target.value)}>
                        {gyms.map((g) => (
                            <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <IconButton size="small" onClick={prevMonth}><ChevronLeftIcon fontSize="small" /></IconButton>
                    <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 130, textAlign: "center" }}>
                        {MONTHS[month]} {year}
                    </Typography>
                    <IconButton size="small" onClick={nextMonth} disabled={isCurrentMonth}>
                        <ChevronRightIcon fontSize="small" />
                    </IconButton>
                </Box>
            </Stack>

            {error && <Typography color="error" sx={{ mb: 1.5 }}>{error}</Typography>}

            {loading ? (
                <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
            ) : data ? (
                <>
                    <StatsTable
                        items={[
                            { icon: <GroupIcon fontSize="small" />, label: "Alumnos totales", value: data.alumnos.total, color: "#16A34A" },
                            { icon: <CheckCircleIcon fontSize="small" />, label: "Activos", value: data.alumnos.activos, color: "#16a34a" },
                            { icon: <CancelIcon fontSize="small" />, label: "Vencidos", value: data.alumnos.vencidos, color: "#ef4444" },
                            { icon: <PersonAddIcon fontSize="small" />, label: "Altas del mes", value: data.alumnos.altas_mes, color: "#3b82f6" },
                            { icon: <PaidIcon fontSize="small" />, label: "Facturación del mes", value: money(data.facturacion.total), color: "#7c3aed" },
                            { icon: <ReceiptLongIcon fontSize="small" />, label: "Pagos del mes", value: data.facturacion.cantidad, color: "#f59e0b" },
                            { icon: <PriceCheckIcon fontSize="small" />, label: "Precio promedio planes", value: money(livePrecioPromedio), color: "#0891b2" },
                        ]}
                    />

                    {/* Planificaciones — tabla horizontal, tildar/destildar para revisar el promedio */}
                    <Paper variant="outlined" sx={{ borderRadius: 2, mt: 1.5, overflow: "hidden" }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 1.5, py: 0.75, borderBottom: 1, borderColor: "divider" }}>
                            <Typography variant="caption" fontWeight={700} sx={{ flex: 1 }}>
                                Planificaciones — promedio ({checkedPlanIds.size}/{data.planes.items.length} incluidas): {" "}
                                <Box component="span" sx={{ color: "#0891b2", fontWeight: 700 }}>{money(livePrecioPromedio)}</Box>
                            </Typography>
                            <Button
                                size="small"
                                sx={{ minWidth: 0, fontSize: "0.7rem" }}
                                onClick={() => setCheckedPlanIds(new Set(data.planes.items.map((p) => p.id)))}
                            >
                                Tildar todos
                            </Button>
                            <Button
                                size="small"
                                sx={{ minWidth: 0, fontSize: "0.7rem" }}
                                onClick={() => {
                                    const excluded = new Set<number>(data.planes.excluded_ids)
                                    setCheckedPlanIds(new Set(data.planes.items.map((p) => p.id).filter((id) => !excluded.has(id))))
                                }}
                            >
                                Restablecer
                            </Button>
                        </Stack>

                        {data.planes.items.length === 0 ? (
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", p: 1.5 }}>
                                Este gimnasio no tiene planificaciones cargadas.
                            </Typography>
                        ) : (
                            <TableContainer sx={{ overflowX: "auto" }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem", whiteSpace: "nowrap" }}>Plan</TableCell>
                                            {data.planes.items.map((p) => (
                                                <TableCell key={p.id} align="center" sx={{ fontWeight: 700, fontSize: "0.72rem", whiteSpace: "nowrap" }}>
                                                    {p.nombre}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell sx={{ fontSize: "0.72rem" }}>Incluir</TableCell>
                                            {data.planes.items.map((p) => (
                                                <TableCell key={p.id} align="center" sx={{ py: 0.25 }}>
                                                    <Checkbox
                                                        size="small"
                                                        checked={checkedPlanIds.has(p.id)}
                                                        onChange={() => togglePlan(p.id)}
                                                    />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                        <TableRow sx={{ "& td": { border: 0 } }}>
                                            <TableCell sx={{ fontSize: "0.72rem" }}>Precio</TableCell>
                                            {data.planes.items.map((p) => {
                                                const checked = checkedPlanIds.has(p.id)
                                                return (
                                                    <TableCell key={p.id} align="center" sx={{ py: 0.5 }}>
                                                        <Typography
                                                            variant="body2"
                                                            fontWeight={600}
                                                            sx={{
                                                                textDecoration: checked ? "none" : "line-through",
                                                                color: checked ? "text.primary" : "text.disabled",
                                                            }}
                                                            noWrap
                                                        >
                                                            {money(p.precio)}
                                                        </Typography>
                                                    </TableCell>
                                                )
                                            })}
                                        </TableRow>
                                        <TableRow sx={{ "& td": { border: 0 } }}>
                                            <TableCell sx={{ fontSize: "0.72rem" }}>Nota</TableCell>
                                            {data.planes.items.map((p) => {
                                                const isMin = p.precio === Math.min(...data.planes.items.map((x) => x.precio))
                                                const isMax = p.precio === Math.max(...data.planes.items.map((x) => x.precio))
                                                return (
                                                    <TableCell key={p.id} align="center" sx={{ py: 0.25 }}>
                                                        {isMax && <Chip label="+ caro" size="small" color="error" variant="outlined" sx={{ height: 18, fontSize: "0.65rem" }} />}
                                                        {isMin && !isMax && <Chip label="+ barato" size="small" color="info" variant="outlined" sx={{ height: 18, fontSize: "0.65rem" }} />}
                                                    </TableCell>
                                                )
                                            })}
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Paper>

                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mt: 1.5 }}>
                        {/* Donut activos vs vencidos */}
                        <Paper variant="outlined" sx={chartPaperSx}>
                            <Typography variant="caption" fontWeight={600} color="text.secondary" component="div" mb={0.5}>
                                Alumnos — activos vs vencidos
                            </Typography>
                            <Box sx={{ height: 130 }}>
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
                            <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 0.5 }}>
                                {donut.map((d) => (
                                    <Box key={d.name} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                        <Box sx={{ width: 10, height: 10, borderRadius: "50%", background: d.css }} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" display="block" lineHeight={1.1} sx={{ fontSize: "0.65rem" }}>{d.name}</Typography>
                                            <Typography variant="body2" fontWeight={700} lineHeight={1.1}>{d.value.toLocaleString("es-AR")}</Typography>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </Paper>

                        {/* Facturación últimos 6 meses */}
                        <Paper variant="outlined" sx={chartPaperSx}>
                            <Typography variant="caption" fontWeight={600} color="text.secondary" component="div" mb={0.5}>
                                Facturación — últimos 6 meses
                            </Typography>
                            <Box sx={{ height: 170 }}>
                                <ResponsiveContainer>
                                    <BarChart data={factData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap={16}>
                                        <defs>
                                            <linearGradient id="gradFact" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#22C55E" />
                                                <stop offset="100%" stopColor="#16A34A" />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid vertical={false} stroke={gridStroke} />
                                        <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 11 }} />
                                        <YAxis tickLine={false} axisLine={false} width={40} tickMargin={4} tick={{ fontSize: 10 }} tickFormatter={(v: number) => moneyShort(v)} />
                                        <Tooltip cursor={{ fill: alpha(t.palette.primary.main, 0.06) }} content={<ChartTooltip money />} />
                                        <Bar dataKey="value" name="Facturación" fill="url(#gradFact)" radius={[6, 6, 0, 0]} barSize={22} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </Paper>

                        {/* Altas últimos 6 meses */}
                        <Paper variant="outlined" sx={chartPaperSx}>
                            <Typography variant="caption" fontWeight={600} color="text.secondary" component="div" mb={0.5}>
                                Altas — últimos 6 meses
                            </Typography>
                            <Box sx={{ height: 170 }}>
                                <ResponsiveContainer>
                                    <BarChart data={altasData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap={16}>
                                        <defs>
                                            <linearGradient id="gradAltas" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#38BDF8" />
                                                <stop offset="100%" stopColor="#1674FF" />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid vertical={false} stroke={gridStroke} />
                                        <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 11 }} />
                                        <YAxis tickLine={false} axisLine={false} width={24} tickMargin={4} tick={{ fontSize: 10 }} allowDecimals={false} />
                                        <Tooltip cursor={{ fill: alpha(t.palette.primary.main, 0.06) }} content={<ChartTooltip />} />
                                        <Bar dataKey="value" name="Altas" fill="url(#gradAltas)" radius={[6, 6, 0, 0]} barSize={22} />
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
