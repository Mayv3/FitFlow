# FitFlow — Memory de cambios

## RLS (Row Level Security)

### ✅ Completadas (RLS habilitado)

| Tabla | Estado | Notas |
|---|---|---|
| `asistencias` | ✅ RLS + policy | Policy usa `user_metadata.gym_id`. Recién activado. |
| `alumnos` | ✅ RLS + policies | SELECT/INSERT/UPDATE por gym, pero usa `user_metadata` (editable por usuario) |
| `pagos` | ✅ RLS + policies | Por gym mediante subquery a `users` |
| `planes_precios` | ✅ RLS + policies | Por gym mediante subquery a `users` |
| `productos` | ✅ RLS + policies | Policies permisivas (`USING true` para DELETE/UPDATE — **riesgo**) |
| `servicios` | ✅ RLS + policies | Por gym mediante subquery a `users` |
| `turnos` | ✅ RLS + policies | Usa `user_metadata.gym_id` (**vulnerable**) |

### ❌ Pendientes — ordenadas de menor a mayor peligro

#### 🟢 Bajo riesgo
| Tabla | Riesgo | Motivo |
|---|---|---|
| `roles` | Bajo | Tabla lookup global. Solo lectura. |
| `gym_plans` | Bajo | Planes del SaaS. Solo lectura para gyms, escritura solo FitFlow admin. |
| `novedades` | Bajo | Blog del sistema. Tiene policies con `USING true` pero RLS **deshabilitado**. Ya debería funcionar igual. |
| `metodos_de_pago` | Bajo | Lista de métodos de pago. Baja sensibilidad. |

#### 🟡 Riesgo medio
| Tabla | Riesgo | Motivo |
|---|---|---|
| `clases` | Medio | Datos multi-tenant sin barrera entre gimnasios. |
| `clases_inscripciones` | Medio | Inscripciones a clases multi-tenant. |
| `clases_sesiones` | Medio | Sesiones de clases multi-tenant. |
| `pago_items` | Medio | Items de pagos. Datos financieros. |

#### 🟠 Riesgo alto
| Tabla | Riesgo | Motivo |
|---|---|---|
| `users` | **Alto** | Tiene 5 policies creadas pero RLS **deshabilitado**. Cualquier usuario autenticado puede leer/modificar todos los usuarios del sistema. |
| `gyms` | **Alto** | Datos de todos los gimnasios visibles a cualquier usuario autenticado. |
| `suscriptions` | **Alto** | Suscripciones activas de los gyms expuestas. |
| `productos` | **Alto** | DELETE y UPDATE con `USING true` — cualquier usuario autenticado puede borrar/modificar productos de cualquier gym. |

#### 🔴 Crítico — `user_metadata` editable
| Tabla | Riesgo | Motivo |
|---|---|---|
| `turnos` | 🔴 Crítico | Las policies usan `auth.jwt() -> 'user_metadata'` que **el usuario puede editar**. Un usuario malicioso cambia su metadata y accede a turnos de otros gyms. |
| `alumnos` | 🔴 Crítico | La policy `alumnos_select_by_gym_from_jwt` usa `user_metadata`. Misma vulnerabilidad. |
| `asistencias` | 🔴 Crítico | Policy usa `user_metadata`. Misma vulnerabilidad. |
| `servicios` | 🔴 Crítico | Algunas policies usan `auth.jwt() ->> 'gym_id'` (lectura directa del claim raíz) — más seguro que `user_metadata` pero hay que verificar que funcione. |

### ⚠️ Notas importantes
- `deudas` y `egresos` no se usan → se omitieron adrede.
- Las policies de `users` ya están creadas, solo falta ejecutar `ALTER TABLE users ENABLE ROW LEVEL SECURITY;`.
- `novedades` igual: policies listas, solo falta habilitar RLS.
- **Solución para `user_metadata`**: migrar las policies a `app_metadata` (solo editable por admin de Supabase). Requiere cambiar cómo se crean los usuarios (usar `app_metadata` en vez de `user_metadata` en `auth.supabase.js`).

## Gráfico de torta (Dashboard admin)

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
