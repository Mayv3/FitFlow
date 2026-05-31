-- ============================================================================
-- FitFlow · ROLLBACK de rls_multitenant.sql
-- Proyecto Supabase: FitFlow (ilxnmxunzpugdredtixa)
--
-- Que hace: deshace por completo la migracion de RLS.
--   - Borra TODAS las policies del schema public.
--   - APAGA el RLS en todas las tablas tocadas.
--   - Borra las funciones helper.
-- Resultado: "RLS apagado" en todo => tanto service_role como el cliente con
--   JWT del usuario (req.supa) acceden sin restriccion => la app vuelve a
--   funcionar como antes. Usar SOLO como escape de emergencia: deja las tablas
--   abiertas al acceso directo via API REST.
--
-- (No borra los indices idx_users_auth_user_id / idx_pago_items_pago_id porque
--  son inofensivos y mejoran performance.)
-- ============================================================================

-- 1) Borrar todas las policies del schema public -----------------------------
do $$ declare r record; begin
  for r in select tablename, policyname from pg_policies where schemaname='public' loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- 2) Apagar RLS en todas las tablas tocadas ----------------------------------
do $$ declare t text; begin
  foreach t in array array[
    'alumnos','asistencias','deudas','egresos','pagos','planes_precios','productos',
    'servicios','clases','clases_sesiones','clases_inscripciones','turnos',
    'whatsapp_session','whatsapp_mensajes','pago_items','suscriptions','gyms','users',
    'roles','metodos_de_pago','gym_plans','novedades','gym_email_logs'] loop
    execute format('alter table public.%I disable row level security', t);
  end loop;
end $$;

-- 3) Borrar funciones helper -------------------------------------------------
drop function if exists public.current_gym_id();
drop function if exists public.current_role_id();
