-- ============================================================================
-- FitFlow · RLS multi-tenant uniforme (aislamiento por gym_id) · "safety net"
-- Proyecto Supabase: FitFlow (ilxnmxunzpugdredtixa)
-- Aplicado: 2026-05-31
--
-- Modelo:
--   - Llave de inquilino NO manipulable: public.current_gym_id()
--     (resuelve el gym del usuario logueado desde public.users via auth.uid();
--      NO usa user_metadata, que es auto-editable por el usuario).
--   - El backend usa service_role => SE SALTEA el RLS. Esto NO cambia el
--     funcionamiento normal de la app; solo cierra el acceso directo a la API REST
--     (anon key + token del usuario) que hoy esta abierto.
--   - Cada gimnasio: CRUD solo de sus propios registros.
--   - users: alta/edicion/baja solo dentro del propio gym y solo owner/admin (rol 1/2).
--   - novedades: lectura publica. gym_email_logs: solo backend. roles/gym_plans/
--     metodos_de_pago: catalogos globales de solo lectura.
--
-- Rollback: backend/sql/rls_rollback.sql
-- ============================================================================

-- 1) Helpers -----------------------------------------------------------------
--    La llave de inquilino se lee del JWT: app_metadata.gym_id (NO manipulable
--    por el usuario; solo service_role lo escribe) con fallback a user_metadata
--    para tokens viejos. NO se usa public.users porque el vinculo auth_user_id
--    estaba incompleto (solo 13/27 usuarios linkeados).
create or replace function public.current_gym_id()
returns uuid language sql stable set search_path = public as $$
  select nullif(coalesce(
           auth.jwt() -> 'app_metadata'  ->> 'gym_id',
           auth.jwt() -> 'user_metadata' ->> 'gym_id'
         ), '')::uuid
$$;

create or replace function public.current_role_id()
returns int language sql stable set search_path = public as $$
  select nullif(coalesce(
           auth.jwt() -> 'app_metadata'  ->> 'role_id',
           auth.jwt() -> 'user_metadata' ->> 'role_id'
         ), '')::int
$$;

-- Backfill app_metadata desde user_metadata (idempotente).
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
     || jsonb_build_object('gym_id',  raw_user_meta_data->>'gym_id')
     || jsonb_build_object('role_id', raw_user_meta_data->>'role_id')
where raw_user_meta_data ? 'gym_id';

-- Solo 'authenticated' necesita ejecutarlas (las llaman las policies). anon NO.
revoke all on function public.current_gym_id()  from public;
revoke all on function public.current_role_id() from public;
grant execute on function public.current_gym_id()  to authenticated;
grant execute on function public.current_role_id() to authenticated;

create index if not exists idx_users_auth_user_id on public.users(auth_user_id);
create index if not exists idx_pago_items_pago_id  on public.pago_items(pago_id);

-- 2) Slate limpio: borrar TODAS las policies actuales del schema public -------
do $$ declare r record; begin
  for r in select tablename, policyname from pg_policies where schemaname='public' loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- 3) Tablas con gym_id directo: CRUD solo del propio gym ---------------------
do $$ declare t text; begin
  foreach t in array array[
    'alumnos','asistencias','deudas','egresos','pagos','planes_precios',
    'productos','servicios','clases','clases_sesiones','clases_inscripciones',
    'turnos','whatsapp_session','whatsapp_mensajes'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy gym_isolation on public.%I for all to authenticated '
      'using (gym_id = public.current_gym_id()) with check (gym_id = public.current_gym_id())', t);
  end loop;
end $$;

-- 4) pago_items: sin gym_id => hereda del pago padre -------------------------
alter table public.pago_items enable row level security;
create policy gym_isolation on public.pago_items for all to authenticated
  using (exists (select 1 from public.pagos p where p.id = pago_items.pago_id and p.gym_id = public.current_gym_id()))
  with check (exists (select 1 from public.pagos p where p.id = pago_items.pago_id and p.gym_id = public.current_gym_id()));

-- 5) suscriptions: lectura de la propia; escritura solo backend (sin auto-upgrade)
alter table public.suscriptions enable row level security;
create policy suscriptions_read_own on public.suscriptions for select to authenticated
  using (gym_id = public.current_gym_id());

-- 6) gyms: cada gym lee SOLO su fila; alta/edicion/baja solo backend ---------
alter table public.gyms enable row level security;
create policy gyms_read_own on public.gyms for select to authenticated
  using (id = public.current_gym_id());

-- 7) users: gestion dentro del propio gym (owner/admin) + auto-lectura -------
alter table public.users enable row level security;
create policy users_select on public.users for select to authenticated
  using (gym_id = public.current_gym_id() or auth_user_id = auth.uid());
create policy users_insert on public.users for insert to authenticated
  with check (gym_id = public.current_gym_id() and public.current_role_id() in (1,2));
create policy users_update on public.users for update to authenticated
  using (gym_id = public.current_gym_id() and public.current_role_id() in (1,2))
  with check (gym_id = public.current_gym_id());
create policy users_delete on public.users for delete to authenticated
  using (gym_id = public.current_gym_id() and public.current_role_id() in (1,2));

-- 8) Catalogos globales: solo lectura ---------------------------------------
do $$ declare t text; begin
  foreach t in array array['roles','metodos_de_pago','gym_plans'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy lookup_read on public.%I for select to anon, authenticated using (true)', t);
  end loop;
end $$;

-- 9) novedades: lectura publica + escritura autenticada (igual que hoy) ------
alter table public.novedades enable row level security;
create policy novedades_read   on public.novedades for select to anon, authenticated using (true);
create policy novedades_insert on public.novedades for insert to authenticated with check (true);
create policy novedades_update on public.novedades for update to authenticated using (true) with check (true);
create policy novedades_delete on public.novedades for delete to authenticated using (true);

-- 10) gym_email_logs: SOLO backend (service_role). RLS on, SIN policies =>
--     todo acceso directo (anon/authenticated) queda denegado.
alter table public.gym_email_logs enable row level security;
