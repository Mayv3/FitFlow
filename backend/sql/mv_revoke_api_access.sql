-- ============================================================================
-- FitFlow · Cerrar acceso directo a las materialized views (mv_*)
-- Proyecto Supabase: FitFlow (ilxnmxunzpugdredtixa) · 2026-05-31
--
-- Las materialized views NO soportan RLS. Las mv_* tienen datos POR gym (gym_id:
-- facturacion, activos, bajas, demografia, top planes) y estaban expuestas via API
-- (PostgREST) a los roles anon/authenticated => cualquiera con la anon key podia
-- leer las metricas de TODOS los gimnasios.
--
-- Fix: revocar SELECT a anon/authenticated. El backend las lee con service_role
-- (NO afectado por estos revoke), asi que los dashboards siguen funcionando.
--
-- OJO: si una migracion futura DROP+CREATE una mv_*, vuelve a heredar los grants
-- por defecto de Supabase (select a anon/authenticated) => re-correr este script.
-- Fix permanente alternativo: mover las mv_* a un schema NO expuesto (ej 'private').
-- ============================================================================

do $$ declare r record; begin
  for r in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('m','v') and c.relname ~ '^mv_'
  loop
    execute format('revoke select on public.%I from anon, authenticated', r.relname);
  end loop;
end $$;
