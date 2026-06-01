# SECURITY.md — Auditoría FitFlow

**Fecha:** 2026-05-31
**Proyecto Supabase:** FitFlow (`ilxnmxunzpugdredtixa`)
**Alcance:** backend (Express + Supabase), RLS multi-tenant, rutas públicas, auth.

## Modelo de seguridad (cómo está pensado)

- Aislamiento por `gym_id` (multi-tenant).
- RLS activo en las tablas (`alumnos`, `pagos`, `productos`, etc.) como **red de seguridad** para acceso directo a la API REST (anon key + token de usuario).
- Llave de inquilino NO manipulable: `app_metadata.gym_id`, leída por `public.current_gym_id()`.
- **Problema central:** casi todo el backend usa `supabaseAdmin` (service_role), que **saltea el RLS**. Por lo tanto el límite entre gimnasios depende del **código del backend**, no del RLS. Y el backend hoy confía en datos manipulables por el cliente.

## Resumen de hallazgos

| # | Severidad | Hallazgo | Estado |
|---|-----------|----------|--------|
| 1 | 🔴 CRÍTICO | `req.gymId` sale de `user_metadata` (editable por el usuario) | Abierto |
| 2 | 🔴 CRÍTICO | `users.controller` acepta `gym_id` desde el query string | Abierto |
| 3 | 🔴 ALTO | Rutas públicas de turnos sin auth (IDOR lectura + escritura) | Abierto |
| 4 | 🟠 MEDIO | RPC `gym_subscription_overview` ejecutable por `anon` (fuga de todos los gyms) | Abierto |
| 5 | 🟠 MEDIO | Policies `novedades` INSERT/UPDATE/DELETE con `USING (true)` | Abierto |
| 6 | 🟠 MEDIO | Trigger `set_gym_id_on_pagos` depende de `users.auth_user_id` incompleto (13/27) | Abierto |
| 7 | 🟡 BAJO | 14 funciones con `search_path` mutable | Abierto |
| 8 | 🟡 BAJO | Postgres con parches de seguridad pendientes | Abierto |
| 9 | 🟡 BAJO | Protección de contraseñas filtradas off + OTP expiry > 1h | Abierto |
| 10 | 🟡 BAJO | Bucket `novedades` permite listar archivos; `pg_trgm` en schema `public` | Abierto |
| 11 | 🟡 BAJO | Cache de token: clave truncada (16 chars) + TTL 5 min (acceso revocado persiste) | Abierto |
| 12 | 🟡 BAJO | `getPagosPaged` arma `.or()` de PostgREST con input del usuario | Abierto |
| 13 | ℹ️ Verificar | CORS `allowedOrigins` con `credentials:true` | Pendiente revisar |

---

## 1. 🔴 CRÍTICO — `req.gymId` desde `user_metadata` (falsificable)

**Ubicación:** `backend/middleware/auth.js:20,36`; `backend/server.js:123`

```js
req.gymId = user.user_metadata?.gym_id
```

**Impacto:** `user_metadata` lo edita el propio usuario con su token:
```js
supabase.auth.updateUser({ data: { gym_id: '<gym-victima>' } })
```
Como stats/gyms/whatsapp/users usan `supabaseAdmin` (RLS bypass) con `.eq('gym_id', req.gymId)`
(confirmado: `stats.controller.js:26,45,247,358,384` → `stats.supabase.js`), el atacante del gym A
cambia su `user_metadata.gym_id` y lee/escribe datos del gym B (facturación, alumnos, KPIs).
El RLS no lo frena porque service_role lo saltea.

**Fix:** usar la llave no manipulable (la misma del RLS).
```js
// auth.js y server.js
req.gymId = user.app_metadata?.gym_id   // app_metadata solo lo escribe service_role
```
**Pre-check antes de aplicar** (asegurar que todos tienen la llave poblada):
```sql
select count(*) filter (where raw_app_meta_data->>'gym_id' is null) as sin_app_gymid,
       count(*) as total
from auth.users;
```
Si hay nulos, re-correr el backfill de `app_metadata` (ver `backend/sql/rls_multitenant.sql`).

---

## 2. 🔴 CRÍTICO — `gym_id` aceptado desde el query string

**Ubicación:** `backend/controllers/users.controller.js:5`

```js
const gymId = req.query.gym_id || req.gymId
```

**Impacto:** `GET /api/users?gym_id=<cualquiera>` → lista usuarios + emails de cualquier gimnasio
(`users.supabase.js:listUsers` usa `supabaseAdmin`). IDOR directo, sin necesidad de tocar metadata.

**Fix:**
```js
const gymId = req.gymId   // nunca del cliente
```
Revisar el mismo patrón en otros controllers/rutas (buscar `req.query.gym_id`, `req.body.gym_id`).

---

## 3. 🔴 ALTO — Rutas públicas de turnos sin auth (IDOR)

**Ubicación:** `backend/routes/appointments.public.routes.js` (sin middleware de auth, usa `supabaseAdmin`)

Todo se identifica por `alumno_id` en path/body, sin verificar identidad ni pertenencia al gym:
- `GET /alumno/:alumno_id/enrollments` → leer clases/horarios de cualquier alumno (PII).
- `POST /session/:session_id/enroll` (body `alumno_id`) → inscribir a cualquier alumno en cualquier sesión/gym.
- `POST /session/:session_id/cancel` (body `alumno_id`) → **cancelar** inscripciones de cualquiera.
- `GET /service/:service_id/sessions?alumno_id=` → filtra estado de inscripción de un alumno arbitrario.

**Impacto:** lectura de datos de terceros + escritura/borrado cross-tenant. Si los `alumno_id` son
secuenciales, enumeración trivial.

**Fix:** exigir token de miembro (flujo `gymLogin`) en estas rutas y validar que el `alumno_id`
pertenece al solicitante y a la sesión/gym objetivo. Como mínimo, mover a rutas autenticadas.

---

## 4. 🟠 MEDIO — RPC `gym_subscription_overview` ejecutable por `anon`

**Ubicación:** función SQL `public.gym_subscription_overview()` (SECURITY DEFINER), expuesta vía
`/rest/v1/rpc/gym_subscription_overview`.

**Impacto:** cualquiera, **sin login**, con la anon key pública, obtiene la lista de **todos** los
gimnasios: nombre, plan, `max_alumnos`, alumnos actuales, suscripción activa y fechas. Inteligencia
de negocio de todos los tenants.

**Fix:**
```sql
revoke execute on function public.gym_subscription_overview() from anon, authenticated;
-- dejar solo service_role (backend)
```

---

## 5. 🟠 MEDIO — Policies `novedades` demasiado permisivas

**Detalle (linter):** `novedades_insert` / `novedades_update` / `novedades_delete` usan `USING (true)` /
`WITH CHECK (true)` para `authenticated`.

**Impacto:** cualquier usuario logueado (de cualquier gym) puede crear/editar/**borrar** todas las
novedades globales.

**Fix:** restringir escritura a owner/admin (rol 1/2). Ejemplo:
```sql
drop policy novedades_insert on public.novedades;
drop policy novedades_update on public.novedades;
drop policy novedades_delete on public.novedades;

create policy novedades_write_admin on public.novedades for all to authenticated
  using (public.current_role_id() in (1,2))
  with check (public.current_role_id() in (1,2));
-- mantener lectura pública:
-- create policy novedades_read on public.novedades for select to anon, authenticated using (true);
```

---

## 6. 🟠 MEDIO — Trigger `set_gym_id_on_pagos` frágil

**Ubicación:** trigger BEFORE INSERT en `pagos` → función `public.set_gym_id_on_pagos()` (SECURITY DEFINER):
```sql
new.gym_id := (select u.gym_id from users u where u.auth_user_id = auth.uid());
```

**Impacto:**
- Deriva `gym_id` de `public.users.auth_user_id`, que la migración dice **incompleto (13/27 linkeados)**.
  Para usuarios no linkeados → `gym_id = NULL` → RLS `WITH CHECK (gym_id = current_gym_id())` rechaza
  el insert → **no pueden crear ningún pago**.
- Usa fuente distinta a la del RLS (`current_gym_id()` lee el JWT). Si difieren, el insert falla.
- Expuesta como RPC a anon/authenticated (impacto bajo: es función de trigger).

**Fix:** alinear el trigger con la llave del RLS y endurecer:
```sql
create or replace function public.set_gym_id_on_pagos()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.gym_id := public.current_gym_id();
  return new;
end; $$;

revoke execute on function public.set_gym_id_on_pagos() from anon, authenticated;
```
Y/o completar el linkeo de `users.auth_user_id`.

> Nota relacionada (funcional, no seguridad): editar/borrar un pago de producto **no** ajusta el stock
> (`updatePago`/`deletePago` no tocan `productos`).

---

## 7-13. 🟡 BAJO / Endurecer

- **7. `search_path` mutable** en 14 funciones (`update_productos_updated_at`, `dashboard_kpis_by_year`,
  `rpc_facturacion_*`, etc.) → agregar `set search_path = public` (sobre todo a las SECURITY DEFINER).
- **8. Postgres desactualizado** (`supabase-postgres-15.8.1.111`) con parches de seguridad pendientes → upgrade.
- **9. Auth:** activar *Leaked Password Protection* (HaveIBeenPwned) y bajar OTP expiry a < 1h.
- **10. Storage/extensiones:** bucket público `novedades` permite **listar** archivos (3 policies SELECT amplias);
  extensión `pg_trgm` instalada en schema `public` → mover a otro schema.
- **11. Cache de token** (`backend/middleware/auth.js:14`): clave = últimos 16 chars del JWT (truncada) y
  TTL 5 min cacheando el `user` completo → un usuario degradado/expulsado conserva acceso hasta 5 min, y
  los cambios de `app_metadata` (gym/rol) tardan en reflejarse. Considerar invalidar al cambiar rol/gym.
- **12. `getPagosPaged`** (`backend/services/pagos.supabase.js`): arma el `.or()` de PostgREST con el
  input `q` del usuario (saca `[(),]`). Inyección limitada (sin comas no se agregan condiciones), pero
  frágil → preferir consultas parametrizadas / validación estricta.
- **13. CORS:** verificar que `allowedOrigins` (`backend/server.js`) no sea permisivo combinado con
  `credentials: true`.

---

## Checklist de remediación (orden sugerido)

- [ ] **#1** `auth.js` + `server.js`: `req.gymId = user.app_metadata?.gym_id` (tras pre-check de cobertura).
- [ ] **#2** `users.controller.js`: quitar `req.query.gym_id`; barrer otros `req.query/body.gym_id`.
- [ ] **#4** `revoke execute` de `gym_subscription_overview` a anon/authenticated.
- [ ] **#3** Proteger rutas públicas de turnos (token de miembro + ownership).
- [ ] **#5** Restringir escritura de `novedades` a admin.
- [ ] **#6** Reescribir `set_gym_id_on_pagos` con `current_gym_id()` + revoke; linkear `auth_user_id`.
- [ ] **#7** `set search_path` en funciones.
- [ ] **#9** Auth: leaked-password + OTP expiry.
- [ ] **#8** Upgrade de Postgres.
- [ ] **#10** Bucket listing + `pg_trgm`.
- [ ] **#11** Revisar cache/expiración de token.
- [ ] **#12/#13** `.or()` y CORS.

## Cómo re-auditar

- Linter de Supabase (security advisors) tras cada cambio de DDL.
- Buscar fuentes de tenant manipulables: `req.query.gym_id`, `req.body.gym_id`, `user_metadata`.
- Confirmar que ninguna ruta con `supabaseAdmin` confía en `gym_id`/ids del cliente sin validar pertenencia.
