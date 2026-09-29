"use client"

import { useEffect, useMemo, useState } from "react"
import {
    Box,
    Paper,
    Typography,
    MenuItem,
    Select,
    IconButton,
    CircularProgress,
    Avatar,
    Stack,
    Checkbox,
    Button,
} from "@mui/material"
import { alpha, useTheme, type Theme } from "@mui/material/styles"
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft"
import ChevronRightIcon from "@mui/icons-material/ChevronRight"
import GroupIcon from "@mui/icons-material/Group"
import PersonAddIcon from "@mui/icons-material/PersonAdd"
import PaidIcon from "@mui/icons-material/Paid"
import PriceCheckIcon from "@mui/icons-material/PriceCheck"
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
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

/* Colores de la marca Fitness Flow. */
const BRAND = "#063A2B"
const MINT = "#10C987"
const RED = "#E5484D"
const CARD_RADIUS = "14px"

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

/** Montos cortos para el eje: $4,5 M · $850 k · $900 */
const moneyShort = (v: number) => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toLocaleString("es-AR", { maximumFractionDigits: 1 })} M`
    if (v >= 1000) return `$${Math.round(v / 1000)} k`
    return `$${v}`
}

const shortMonth = (mk: string) => {
    const m = Number(mk.slice(5, 7))
    return (MONTHS[m - 1] || "").slice(0, 3)
}

/** Acento de marca legible sobre el fondo actual. */
const accent = (t: Theme) => (t.palette.mode === "dark" ? MINT : BRAND)

/** Tooltip de los gráficos */
function ChartTooltip({ active, payload, label, money: isMoney }: ChartTooltipProps & { money?: boolean }) {
    if (!active || !payload?.length) return null
    const p = payload[0]
    return (
        <Box sx={{
            px: 1.5, py: 1, borderRadius: "10px", bgcolor: "background.paper",
            boxShadow: 3, border: (t) => `1px solid ${alpha(t.palette.divider, 0.8)}`, minWidth: 90,
        }}>
            <Typography variant="caption" color="text.secondary" display="block">{label ?? p.name}</Typography>
            <Typography variant="body2" fontWeight={700}>
                {isMoney ? money(Number(p.value)) : Number(p.value).toLocaleString("es-AR")}
            </Typography>
        </Box>
    )
}

/** Título chico de cada bloque de la sección */
function BlockTitle({ children, hint }: { children: React.ReactNode; hint?: React.ReactNode }) {
    return (
        <Box sx={{ mb: 1.5 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "1rem" }}>{children}</Typography>
            {hint && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{hint}</Typography>}
        </Box>
    )
}

/** Tarjeta de un dato del resumen */
function KpiCard({
    icon,
    label,
    value,
    detail,
    children,
}: {
    icon: React.ReactNode
    label: string
    value: React.ReactNode
    detail?: React.ReactNode
    children?: React.ReactNode
}) {
    return (
        <Paper variant="outlined" sx={{ borderRadius: CARD_RADIUS, p: 2, display: "flex", flexDirection: "column", gap: 1.25, minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center">
                <Box
                    sx={(t) => ({
                        width: 30, height: 30, borderRadius: "9px", display: "grid", placeItems: "center", flexShrink: 0,
                        bgcolor: alpha(MINT, 0.14), color: accent(t), "& svg": { fontSize: "1.05rem" },
                    })}
                >
                    {icon}
                </Box>
                <Typography variant="body2" color="text.secondary" fontWeight={600} noWrap>{label}</Typography>
            </Stack>
            <Box>
                <Typography sx={{ fontSize: { xs: "1.5rem", md: "1.75rem" }, fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
                    {value}
                </Typography>
                {detail && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{detail}</Typography>}
            </Box>
            {children}
        </Paper>
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
    const tickColor = t.palette.text.secondary
    const barOn = accent(t)
    const barOff = alpha(MINT, t.palette.mode === "dark" ? 0.35 : 0.45)

    const factData = data ? data.series.map((s) => ({ name: shortMonth(s.month), value: s.facturacion, on: s.month === monthParam })) : []
    const altasData = data ? data.series.map((s) => ({ name: shortMonth(s.month), value: s.altas, on: s.month === monthParam })) : []

    const total = data?.alumnos.total ?? 0
    const pctActivos = data && total > 0 ? Math.round((data.alumnos.activos / total) * 100) : 0
    const precios = data?.planes.items.map((p) => p.precio) ?? []
    const minPrecio = precios.length ? Math.min(...precios) : 0
    const maxPrecio = precios.length ? Math.max(...precios) : 0
    const nombreMes = MONTHS[month].toLowerCase()

    const chartCardSx = { borderRadius: CARD_RADIUS, p: 2, minWidth: 0 } as const

    return (
        <Box>
            {/* Gimnasio y mes */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} justifyContent="space-between" mb={2.5}>
                <Select
                    size="small"
                    value={gymId}
                    onChange={(e) => setGymId(e.target.value)}
                    displayEmpty
                    inputProps={{ "aria-label": "Gimnasio" }}
                    renderValue={(id) => {
                        const g = gyms.find((x) => x.id === id)
                        if (!g) return <Typography color="text.secondary">Elegí un gimnasio</Typography>
                        return (
                            <Stack direction="row" spacing={1.25} alignItems="center">
                                <Avatar
                                    src={g.logo_url || undefined}
                                    sx={{ width: 26, height: 26, fontSize: "0.8rem", fontWeight: 700, bgcolor: alpha(MINT, 0.16), color: accent(t) }}
                                >
                                    {g.name[0]?.toUpperCase()}
                                </Avatar>
                                <Typography fontWeight={700} noWrap>{g.name}</Typography>
                            </Stack>
                        )
                    }}
                    sx={{
                        minWidth: { sm: 280 },
                        borderRadius: 999,
                        bgcolor: "action.hover",
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "transparent" },
                        "& .MuiSelect-select": { py: 0.9, pl: 1 },
                    }}
                >
                    {gyms.map((g) => (
                        <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
                    ))}
                </Select>

                <Stack
                    direction="row"
                    alignItems="center"
                    sx={{ alignSelf: { xs: "stretch", sm: "auto" }, justifyContent: "space-between", border: 1, borderColor: "divider", borderRadius: 999, p: 0.5 }}
                >
                    <IconButton size="small" onClick={prevMonth} aria-label="Mes anterior">
                        <ChevronLeftIcon fontSize="small" />
                    </IconButton>
                    <Typography sx={{ fontWeight: 700, minWidth: 150, textAlign: "center" }}>
                        {MONTHS[month]} {year}
                    </Typography>
                    <IconButton size="small" onClick={nextMonth} disabled={isCurrentMonth} aria-label="Mes siguiente">
                        <ChevronRightIcon fontSize="small" />
                    </IconButton>
                </Stack>
            </Stack>

            {error && (
                <Box sx={{ mb: 2, px: 2, py: 1.25, borderRadius: CARD_RADIUS, bgcolor: alpha(RED, 0.1), color: t.palette.mode === "dark" ? "#FF8A7A" : "#A1281B", fontWeight: 600 }}>
                    {error}
                </Box>
            )}

            {loading ? (
                <Box display="flex" justifyContent="center" py={6}><CircularProgress sx={{ color: MINT }} /></Box>
            ) : data ? (
                <Stack spacing={3}>
                    {/* 1. Resumen del mes */}
                    <Box>
                        <BlockTitle>Resumen de {nombreMes}</BlockTitle>
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" }, gap: 1.5 }}>
                            <KpiCard
                                icon={<GroupIcon />}
                                label="Alumnos activos"
                                value={data.alumnos.activos.toLocaleString("es-AR")}
                                detail={`de ${total.toLocaleString("es-AR")} alumnos en total`}
                            >
                                <Box>
                                    <Box
                                        role="img"
                                        aria-label={`${pctActivos}% activos, ${100 - pctActivos}% vencidos`}
                                        sx={{ display: "flex", height: 8, borderRadius: 999, overflow: "hidden", bgcolor: "action.hover" }}
                                    >
                                        <Box sx={{ width: `${pctActivos}%`, bgcolor: MINT }} />
                                        <Box sx={{ width: `${total > 0 ? 100 - pctActivos : 0}%`, bgcolor: RED, opacity: 0.85 }} />
                                    </Box>
                                    <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.75, fontSize: "0.8rem", color: "text.secondary" }}>
                                        <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                                            <Box component="span" sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: MINT }} />
                                            {pctActivos}% activos
                                        </Box>
                                        <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                                            <Box component="span" sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: RED }} />
                                            {data.alumnos.vencidos.toLocaleString("es-AR")} vencidos
                                        </Box>
                                    </Stack>
                                </Box>
                            </KpiCard>

                            <KpiCard
                                icon={<PaidIcon />}
                                label="Facturación"
                                value={money(data.facturacion.total)}
                                detail={`${data.facturacion.cantidad.toLocaleString("es-AR")} pagos registrados`}
                            />

                            <KpiCard
                                icon={<PersonAddIcon />}
                                label="Altas"
                                value={data.alumnos.altas_mes.toLocaleString("es-AR")}
                                detail={`alumnos nuevos en ${nombreMes}`}
                            />

                            <KpiCard
                                icon={<PriceCheckIcon />}
                                label="Precio promedio de planes"
                                value={money(livePrecioPromedio)}
                                detail={
                                    data.planes.items.length
                                        ? `con ${checkedPlanIds.size} de ${data.planes.items.length} planes`
                                        : "sin planes cargados"
                                }
                            />
                        </Box>
                    </Box>

                    {/* 2. Evolución */}
                    <Box>
                        <BlockTitle hint="Últimos 6 meses. El mes elegido aparece resaltado.">Evolución</BlockTitle>
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "3fr 2fr" }, gap: 1.5 }}>
                            <Paper variant="outlined" sx={chartCardSx}>
                                <Typography variant="body2" fontWeight={700} mb={1}>Facturación</Typography>
                                <Box sx={{ height: 200 }}>
                                    <ResponsiveContainer>
                                        <BarChart data={factData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barCategoryGap="28%">
                                            <CartesianGrid vertical={false} stroke={gridStroke} />
                                            <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 12, fill: tickColor }} />
                                            <YAxis tickLine={false} axisLine={false} width={58} tickMargin={4} tick={{ fontSize: 11, fill: tickColor }} tickFormatter={(v: number) => moneyShort(v)} />
                                            <Tooltip cursor={{ fill: alpha(MINT, 0.08) }} content={<ChartTooltip money />} />
                                            <Bar dataKey="value" name="Facturación" radius={[8, 8, 0, 0]} maxBarSize={42}>
                                                {factData.map((d) => <Cell key={d.name} fill={d.on ? barOn : barOff} />)}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Paper>

                            <Paper variant="outlined" sx={chartCardSx}>
                                <Typography variant="body2" fontWeight={700} mb={1}>Altas</Typography>
                                <Box sx={{ height: 200 }}>
                                    <ResponsiveContainer>
                                        <BarChart data={altasData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barCategoryGap="28%">
                                            <CartesianGrid vertical={false} stroke={gridStroke} />
                                            <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 12, fill: tickColor }} />
                                            <YAxis tickLine={false} axisLine={false} width={28} tickMargin={4} tick={{ fontSize: 11, fill: tickColor }} allowDecimals={false} />
                                            <Tooltip cursor={{ fill: alpha(MINT, 0.08) }} content={<ChartTooltip />} />
                                            <Bar dataKey="value" name="Altas" radius={[8, 8, 0, 0]} maxBarSize={36}>
                                                {altasData.map((d) => <Cell key={d.name} fill={d.on ? barOn : barOff} />)}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Paper>
                        </Box>
                    </Box>

                    {/* 3. Planes que cuentan para el precio promedio */}
                    <Box>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "flex-start" }} justifyContent="space-between">
                            <BlockTitle hint="Destildá promociones o planes especiales para que no cambien el precio promedio.">
                                Planes en el precio promedio
                            </BlockTitle>
                            {data.planes.items.length > 0 && (
                                <Stack direction="row" spacing={1} sx={{ flexShrink: 0, mb: { xs: 1.5, sm: 0 } }}>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        color="inherit"
                                        onClick={() => setCheckedPlanIds(new Set(data.planes.items.map((p) => p.id)))}
                                        sx={{ borderRadius: 999, borderColor: "divider", px: 1.5 }}
                                    >
                                        Incluir todos
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        color="inherit"
                                        onClick={() => {
                                            const excluded = new Set<number>(data.planes.excluded_ids)
                                            setCheckedPlanIds(new Set(data.planes.items.map((p) => p.id).filter((id) => !excluded.has(id))))
                                        }}
                                        sx={{ borderRadius: 999, borderColor: "divider", px: 1.5 }}
                                    >
                                        Restablecer
                                    </Button>
                                </Stack>
                            )}
                        </Stack>

                        {data.planes.items.length === 0 ? (
                            <Paper variant="outlined" sx={{ borderRadius: CARD_RADIUS, p: 3, textAlign: "center" }}>
                                <Typography color="text.secondary">Este gimnasio todavía no tiene planes cargados.</Typography>
                            </Paper>
                        ) : (
                            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 1.5 }}>
                                {data.planes.items.map((p) => {
                                    const checked = checkedPlanIds.has(p.id)
                                    const distintos = minPrecio !== maxPrecio
                                    const tag = distintos && p.precio === maxPrecio ? "Más caro" : distintos && p.precio === minPrecio ? "Más barato" : null
                                    return (
                                        <Paper
                                            key={p.id}
                                            component="label"
                                            variant="outlined"
                                            sx={{
                                                borderRadius: CARD_RADIUS,
                                                p: 1.5,
                                                pr: 2,
                                                display: "flex",
                                                alignItems: "flex-start",
                                                gap: 0.5,
                                                cursor: "pointer",
                                                transition: "border-color .15s ease, background-color .15s ease, opacity .15s ease",
                                                borderColor: checked ? alpha(MINT, 0.6) : "divider",
                                                bgcolor: checked ? alpha(MINT, 0.06) : "transparent",
                                                opacity: checked ? 1 : 0.6,
                                                "&:hover": { borderColor: MINT },
                                                "&:focus-within": { outline: `2px solid ${accent(t)}`, outlineOffset: 2 },
                                            }}
                                        >
                                            <Checkbox
                                                size="small"
                                                checked={checked}
                                                onChange={() => togglePlan(p.id)}
                                                sx={{ p: 0.5, color: "text.secondary", "&.Mui-checked": { color: accent(t) } }}
                                            />
                                            <Box sx={{ minWidth: 0, pt: 0.35 }}>
                                                <Typography fontWeight={700} sx={{ lineHeight: 1.3 }}>{p.nombre}</Typography>
                                                <Typography
                                                    sx={{
                                                        mt: 0.25,
                                                        fontWeight: 600,
                                                        fontVariantNumeric: "tabular-nums",
                                                        textDecoration: checked ? "none" : "line-through",
                                                        color: checked ? "text.primary" : "text.secondary",
                                                    }}
                                                >
                                                    {money(p.precio)}
                                                </Typography>
                                                {tag && (
                                                    <Box
                                                        component="span"
                                                        sx={{
                                                            display: "inline-block",
                                                            mt: 0.75,
                                                            px: 1,
                                                            py: 0.2,
                                                            borderRadius: 999,
                                                            fontSize: "0.72rem",
                                                            fontWeight: 700,
                                                            bgcolor: "action.hover",
                                                            color: "text.secondary",
                                                        }}
                                                    >
                                                        {tag}
                                                    </Box>
                                                )}
                                            </Box>
                                        </Paper>
                                    )
                                })}
                            </Box>
                        )}
                    </Box>
                </Stack>
            ) : (
                <Typography color="text.secondary" textAlign="center" py={4}>
                    {gyms.length ? "Elegí un gimnasio para ver sus estadísticas." : "Todavía no hay gimnasios."}
                </Typography>
            )}
        </Box>
    )
}
