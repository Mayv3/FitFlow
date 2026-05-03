# FitFlow — Memory de cambios

## Gráfico de torta (Dashboard admin)

### Filtro por mes y año
- El donut de "Alumnos (estado y movimiento)" ahora siempre tiene un mes y año seleccionados.
- No existe opción "General" — siempre se filtra.
- Año: selector `YearSelector` (2026-2030) independiente del de facturación.
- Mes: dropdown con los meses disponibles (no permite seleccionar meses futuros).
- Al cambiar de año, se ajusta el mes máximo si es necesario.

### Lógica de cada categoría (con filtro)

| Categoría | Lógica | Modal al clickear |
|---|---|---|
| **Activos** | `pagos` del mes/alumno_id distintos | Nombre, Fecha, Plan, Monto |
| **Altas** | `fecha_inicio` en el mes | Nombre, Fecha inicio, Plan |
| **Abandonos** | `fecha_de_vencimiento` en el mes **y** `<= hoy` (ya pasó) | Nombre, Vencimiento, Plan actual |

- "Inactivos" eliminado del donut permanentemente.
- "Bajas" renombrado a "Abandonos".
- Tooltips con nombre de mes completo (Enero, Febrero, etc.).
- Scrollbar custom (fina, oscura, bordes redondeados) en todos los modales.
- Header de modales con color primary del gimnasio.
- Planes con `text-overflow: ellipsis` (max 110px).

### Backend — funciones agregadas

- `countActiveMembersByMonthPayment` — cuenta alumnos que pagaron en un mes/año
- `getActiveMembersPaymentDetails` — detalle de pagos con nombre de alumno y plan
- `countAbandonosByMonth` / `getAbandonosDetails` — alumnos con vencimiento en el mes y ya expirado
- `countAltasByMonth` / `getAltasDetails` — alumnos con `fecha_inicio` en el mes
- `countMonthRenewals` — renovaciones del mes actual (para el KPI de miembros)

### Rutas API nuevas

- `GET /api/stats/dashboard/activos-mes?year=&month=`
- `GET /api/stats/dashboard/abandonos-mes?year=&month=`
- `GET /api/stats/dashboard/altas-mes?year=&month=`

### Hook de frontend — `useGymThemeSettings`

- Ahora también expone `primaryColor` desde `gym_settings` en sessionStorage.

## KPI de Miembros

### Agregado: "Renovaciones del mes"
- Cuenta alumnos distintos que pagaron en el mes actual.
- Se agregó a `getGymStatsService` en backend.
- Tipo `GymStats` actualizado con `monthRenewals` y `renewalsPct`.
- Grilla de KPIs pasó de 3 a 4 columnas en desktop.
- Los 4 KPIs actuales: Miembros activos, Asistencias de hoy, Alumnos con plan, Renovaciones del mes.
