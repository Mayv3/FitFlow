-- Test de aislamiento entre sedes (HerGym / Hergym Carlota) a nivel base de datos.
--
-- Se hace pasar por un usuario parado en cada sede (mismos claims que trae el JWT)
-- y comprueba que solo ve y escribe datos de su sede activa, en todos los módulos.
--
-- NO DEJA NADA GUARDADO: el bloque termina siempre con una excepción, que deshace
-- todo lo que insertó. El resultado se lee en el mensaje de esa excepción
-- (una línea OK / FALLA por chequeo). Se corre en el SQL Editor de Supabase.

do $$
declare
  c_carlota constant uuid := '6e513100-c2a4-4db1-ba27-d82f367c246a';
  c_hergym  constant uuid := 'e0e69af7-3288-479b-af90-39edd0b53e60';
  -- hergymtest@gmail.com parado en Carlota / Zuli parada en HerGym
  claims_carlota constant text := '{"sub":"80734f2d-657e-4830-b144-fddbaf44d0dc","role":"authenticated","app_metadata":{"gym_id":"6e513100-c2a4-4db1-ba27-d82f367c246a","role_id":"2"}}';
  claims_hergym  constant text := '{"sub":"385028a5-433e-4e03-87e0-6d2f74055fd3","role":"authenticated","app_metadata":{"gym_id":"e0e69af7-3288-479b-af90-39edd0b53e60","role_id":"2"}}';

  r text := '';
  fallas int := 0;
  total int := 0;
  n int; n2 int; t text; v_txt text; v_num numeric; v_gym uuid;
  v_alumno int; v_alumno_hg int; v_dni_hg text;
  v_plan int; v_plan_hg int; v_metodo int;
  v_pago int; v_pago_hg int; v_pago_hg_nuevo int;
  v_items jsonb;

  -- deja asentado un chequeo
  ok boolean;
begin
  ---------------------------------------------------------------------------
  -- Datos de referencia (todavía como rol dueño, sin RLS)
  ---------------------------------------------------------------------------
  select id, dni into v_alumno_hg, v_dni_hg from alumnos
    where gym_id = c_hergym and deleted_at is null order by id limit 1;
  select id into v_plan    from planes_precios where gym_id = c_carlota and deleted_at is null order by id limit 1;
  select id into v_plan_hg from planes_precios where gym_id = c_hergym  and deleted_at is null order by id limit 1;
  select id into v_pago_hg from pagos where gym_id = c_hergym and deleted_at is null order by id desc limit 1;
  select min(id) into v_metodo from metodos_de_pago;
  v_items := jsonb_build_array(jsonb_build_object('metodo_de_pago_id', v_metodo, 'monto', 1000));

  ---------------------------------------------------------------------------
  -- A. Usuario parado en HERGYM CARLOTA
  ---------------------------------------------------------------------------
  perform set_config('request.jwt.claims', claims_carlota, true);
  perform set_config('role', 'authenticated', true);
  r := r || E'\n== A. Parado en Hergym Carlota ==';

  -- A1. Lectura: en ninguna tabla se ve una fila de otro gimnasio
  foreach t in array array['alumnos','pagos','asistencias','planes_precios','clases','clases_sesiones',
                           'clases_inscripciones','servicios','productos','turnos','suscriptions',
                           'deudas','egresos','whatsapp_mensajes','whatsapp_session']
  loop
    begin
      execute format('select count(*) filter (where gym_id is distinct from %L), count(*) from public.%I', c_carlota, t)
        into n, n2;
      ok := (n = 0); total := total + 1; if not ok then fallas := fallas + 1; end if;
      r := r || format(E'\n%s lectura %s: %s filas visibles, %s de otro gym', case when ok then 'OK   ' else 'FALLA' end, t, n2, n);
    exception when others then
      total := total + 1; fallas := fallas + 1;
      r := r || format(E'\nFALLA lectura %s: %s', t, sqlerrm);
    end;
  end loop;

  select count(*) into n from gyms where id <> c_carlota;
  ok := (n = 0); total := total + 1; if not ok then fallas := fallas + 1; end if;
  r := r || format(E'\n%s lectura gyms: %s gimnasios ajenos visibles', case when ok then 'OK   ' else 'FALLA' end, n);

  select count(*) into n from users where gym_id is distinct from c_carlota and auth_user_id <> auth.uid();
  ok := (n = 0); total := total + 1; if not ok then fallas := fallas + 1; end if;
  r := r || format(E'\n%s lectura users: %s usuarios de otro gym visibles', case when ok then 'OK   ' else 'FALLA' end, n);

  select count(*) into n from pago_items pi join pagos p on p.id = pi.pago_id where p.gym_id is distinct from c_carlota;
  ok := (n = 0); total := total + 1; if not ok then fallas := fallas + 1; end if;
  r := r || format(E'\n%s lectura pago_items: %s ítems de pagos ajenos', case when ok then 'OK   ' else 'FALLA' end, n);

  -- A2. Alumnos: alta en la sede propia; no se puede crear ni tocar uno de HerGym
  begin
    insert into alumnos (dni, nombre, gym_id) values ('99000001', 'TEST SEDES', c_carlota) returning id into v_alumno;
    total := total + 1; r := r || E'\nOK    alta de alumno en Carlota';
  exception when others then
    total := total + 1; fallas := fallas + 1; r := r || E'\nFALLA alta de alumno en Carlota: ' || sqlerrm;
  end;

  begin
    insert into alumnos (dni, nombre, gym_id) values ('99000002', 'TEST SEDES AJENO', c_hergym);
    total := total + 1; fallas := fallas + 1; r := r || E'\nFALLA se pudo crear un alumno en HerGym estando en Carlota';
  exception when others then
    total := total + 1; r := r || E'\nOK    crear alumno en HerGym desde Carlota: rechazado';
  end;

  update alumnos set nombre = nombre where id = v_alumno_hg;
  get diagnostics n = row_count;
  ok := (n = 0); total := total + 1; if not ok then fallas := fallas + 1; end if;
  r := r || format(E'\n%s editar alumno de HerGym desde Carlota: %s filas afectadas', case when ok then 'OK   ' else 'FALLA' end, n);

  -- A3. Pagos (el caso que falló): el pago queda en Carlota y se puede releer
  begin
    v_pago := create_pago(v_alumno, v_plan, 'Mensualidad', null, null, '10:00', current_date,
                          current_date + 30, 'test-sedes', 1000, 1, v_items);
    select gym_id into v_gym from pagos where id = v_pago;
    ok := (v_gym = c_carlota); total := total + 1; if not ok then fallas := fallas + 1; end if;
    r := r || format(E'\n%s alta de pago en Carlota: queda en gym %s y se puede releer', case when ok then 'OK   ' else 'FALLA' end, coalesce(v_gym::text, 'NO VISIBLE'));

    select count(*) into n from pago_items where pago_id = v_pago;
    ok := (n = 1); total := total + 1; if not ok then fallas := fallas + 1; end if;
    r := r || format(E'\n%s ítems del pago visibles: %s', case when ok then 'OK   ' else 'FALLA' end, n);

    select count(*) into n from alumnos where id = v_alumno and plan_id = v_plan and fecha_de_vencimiento = current_date + 30;
    ok := (n = 1); total := total + 1; if not ok then fallas := fallas + 1; end if;
    r := r || format(E'\n%s el pago actualizó plan y vencimiento del alumno', case when ok then 'OK   ' else 'FALLA' end);
  exception when others then
    total := total + 1; fallas := fallas + 1; r := r || E'\nFALLA alta de pago en Carlota: ' || sqlerrm;
  end;

  begin
    perform create_pago(v_alumno_hg, v_plan_hg, 'Mensualidad', null, null, '10:00', current_date,
                        current_date + 30, 'test-sedes', 1000, 1, v_items);
    total := total + 1; fallas := fallas + 1; r := r || E'\nFALLA se pudo cobrar a un alumno de HerGym estando en Carlota';
  exception when others then
    total := total + 1; r := r || E'\nOK    cobrar a alumno de HerGym desde Carlota: rechazado';
  end;

  begin
    perform create_pago(v_alumno, v_plan_hg, 'Mensualidad', null, null, '10:00', current_date,
                        current_date + 30, 'test-sedes', 1000, 1, v_items);
    total := total + 1; fallas := fallas + 1; r := r || E'\nFALLA se pudo cobrar un plan de HerGym estando en Carlota';
  exception when others then
    total := total + 1; r := r || E'\nOK    cobrar un plan de HerGym desde Carlota: rechazado';
  end;

  begin
    perform delete_pago(v_pago_hg);
    total := total + 1; fallas := fallas + 1; r := r || E'\nFALLA se pudo anular un pago de HerGym estando en Carlota';
  exception when others then
    total := total + 1; r := r || E'\nOK    anular pago de HerGym desde Carlota: rechazado';
  end;

  begin
    perform delete_pago(v_pago);
    perform restore_pago(v_pago);
    select count(*) into n from pagos where id = v_pago and deleted_at is null;
    ok := (n = 1); total := total + 1; if not ok then fallas := fallas + 1; end if;
    r := r || format(E'\n%s anular y restaurar un pago propio', case when ok then 'OK   ' else 'FALLA' end);
  exception when others then
    total := total + 1; fallas := fallas + 1; r := r || E'\nFALLA anular/restaurar pago propio: ' || sqlerrm;
  end;

  begin
    select count(*) into n from buscar_pagos('', null, null, false, 100, 0);
    select count(*) into n2 from pagos where deleted_at is null;
    ok := (n = n2); total := total + 1; if not ok then fallas := fallas + 1; end if;
    r := r || format(E'\n%s buscador de pagos: devuelve %s, hay %s en la sede', case when ok then 'OK   ' else 'FALLA' end, n, n2);
  exception when others then
    total := total + 1; fallas := fallas + 1; r := r || E'\nFALLA buscador de pagos: ' || sqlerrm;
  end;

  -- A4. Asistencias
  begin
    perform registrar_asistencia('99000001', c_carlota);
    select count(*) into n from asistencias where alumno_id = v_alumno and gym_id = c_carlota;
    ok := (n = 1); total := total + 1; if not ok then fallas := fallas + 1; end if;
    r := r || format(E'\n%s registrar asistencia en Carlota', case when ok then 'OK   ' else 'FALLA' end);
  exception when others then
    total := total + 1; fallas := fallas + 1; r := r || E'\nFALLA registrar asistencia en Carlota: ' || sqlerrm;
  end;

  begin
    perform registrar_asistencia(v_dni_hg, c_hergym);
    total := total + 1; fallas := fallas + 1; r := r || E'\nFALLA se pudo registrar asistencia de un alumno de HerGym estando en Carlota';
  exception when others then
    total := total + 1; r := r || E'\nOK    registrar asistencia de alumno de HerGym desde Carlota: rechazado';
  end;

  begin
    insert into asistencias (fecha, hora, gym_id, alumno_id) values (current_date - 1, '10:00', c_hergym, v_alumno_hg);
    total := total + 1; fallas := fallas + 1; r := r || E'\nFALLA se pudo insertar una asistencia en HerGym estando en Carlota';
  exception when others then
    total := total + 1; r := r || E'\nOK    insertar asistencia en HerGym desde Carlota: rechazado';
  end;

  -- A5. Clases, sesiones e inscripciones
  begin
    insert into clases (gym_id, nombre, capacidad_default) values (c_carlota, 'TEST SEDES CLASE', 10);
    insert into clases_sesiones (gym_id, clase_id, dia_semana, hora_inicio, capacidad)
      select c_carlota, id, 1, '10:00', 10 from clases where nombre = 'TEST SEDES CLASE';
    insert into clases_inscripciones (gym_id, sesion_id, alumno_id, estado)
      select c_carlota, s.id, v_alumno, 'inscripto'
      from clases_sesiones s join clases c on c.id = s.clase_id where c.nombre = 'TEST SEDES CLASE';
    get diagnostics n = row_count;
    ok := (n = 1); total := total + 1; if not ok then fallas := fallas + 1; end if;
    r := r || format(E'\n%s crear clase, sesión e inscripción en Carlota', case when ok then 'OK   ' else 'FALLA' end);
  exception when others then
    total := total + 1; fallas := fallas + 1; r := r || E'\nFALLA clase/sesión/inscripción en Carlota: ' || sqlerrm;
  end;

  begin
    insert into clases (gym_id, nombre, capacidad_default) values (c_hergym, 'TEST SEDES CLASE AJENA', 10);
    total := total + 1; fallas := fallas + 1; r := r || E'\nFALLA se pudo crear una clase en HerGym estando en Carlota';
  exception when others then
    total := total + 1; r := r || E'\nOK    crear clase en HerGym desde Carlota: rechazado';
  end;

  -- A6. Productos, servicios y turnos
  begin
    insert into productos (gym_id, nombre, precio) values (c_carlota, 'TEST SEDES PRODUCTO', 100);
    insert into servicios (gym_id, nombre) values (c_carlota, 'TEST SEDES SERVICIO');
    insert into turnos (gym_id, titulo, profesional, alumno_id, inicio_at, fin_at)
      values (c_carlota, 'TEST SEDES TURNO', 'test', v_alumno, now(), now() + interval '1 hour');
    total := total + 1; r := r || E'\nOK    crear producto, servicio y turno en Carlota';
  exception when others then
    total := total + 1; fallas := fallas + 1; r := r || E'\nFALLA producto/servicio/turno en Carlota: ' || sqlerrm;
  end;

  begin
    insert into productos (gym_id, nombre, precio) values (c_hergym, 'TEST SEDES PRODUCTO AJENO', 100);
    total := total + 1; fallas := fallas + 1; r := r || E'\nFALLA se pudo crear un producto en HerGym estando en Carlota';
  exception when others then
    total := total + 1; r := r || E'\nOK    crear producto en HerGym desde Carlota: rechazado';
  end;

  begin
    insert into servicios (gym_id, nombre) values (c_hergym, 'TEST SEDES SERVICIO AJENO');
    total := total + 1; fallas := fallas + 1; r := r || E'\nFALLA se pudo crear un servicio en HerGym estando en Carlota';
  exception when others then
    total := total + 1; r := r || E'\nOK    crear servicio en HerGym desde Carlota: rechazado';
  end;

  begin
    insert into turnos (gym_id, titulo, profesional, alumno_id, inicio_at, fin_at)
      values (c_hergym, 'TEST SEDES TURNO AJENO', 'test', v_alumno_hg, now(), now() + interval '1 hour');
    total := total + 1; fallas := fallas + 1; r := r || E'\nFALLA se pudo crear un turno en HerGym estando en Carlota';
  exception when others then
    total := total + 1; r := r || E'\nOK    crear turno en HerGym desde Carlota: rechazado';
  end;

  -- A7. Estadísticas: pedir las de HerGym desde Carlota no devuelve su facturación
  begin
    select facturacion_mes_actual into v_num from rpc_facturacion_resumen(c_hergym);
    ok := (coalesce(v_num, 0) = 0); total := total + 1; if not ok then fallas := fallas + 1; end if;
    r := r || format(E'\n%s facturación de HerGym pedida desde Carlota: %s', case when ok then 'OK   ' else 'FALLA' end, coalesce(v_num::text, 'nada'));
  exception when others then
    total := total + 1; fallas := fallas + 1; r := r || E'\nFALLA rpc_facturacion_resumen: ' || sqlerrm;
  end;

  ---------------------------------------------------------------------------
  -- B. Usuario parado en HERGYM (no debe enterarse de nada de Carlota)
  ---------------------------------------------------------------------------
  perform set_config('request.jwt.claims', claims_hergym, true);
  r := r || E'\n== B. Parado en HerGym ==';

  select count(*) filter (where gym_id is distinct from c_hergym), count(*) into n, n2 from alumnos where deleted_at is null;
  ok := (n = 0); total := total + 1; if not ok then fallas := fallas + 1; end if;
  r := r || format(E'\n%s lectura alumnos: %s activos visibles, %s de otro gym', case when ok then 'OK   ' else 'FALLA' end, n2, n);

  select count(*) into n from gyms where id <> c_hergym;
  ok := (n = 0); total := total + 1; if not ok then fallas := fallas + 1; end if;
  r := r || format(E'\n%s lectura gyms: %s gimnasios ajenos visibles', case when ok then 'OK   ' else 'FALLA' end, n);

  select (select count(*) from alumnos where id = v_alumno)
       + (select count(*) from pagos where id = v_pago)
       + (select count(*) from asistencias where alumno_id = v_alumno)
       + (select count(*) from clases where nombre = 'TEST SEDES CLASE')
       + (select count(*) from productos where nombre = 'TEST SEDES PRODUCTO')
       + (select count(*) from servicios where nombre = 'TEST SEDES SERVICIO')
       + (select count(*) from turnos where titulo = 'TEST SEDES TURNO') into n;
  ok := (n = 0); total := total + 1; if not ok then fallas := fallas + 1; end if;
  r := r || format(E'\n%s lo cargado en Carlota no se ve desde HerGym (%s filas visibles)', case when ok then 'OK   ' else 'FALLA' end, n);

  begin
    perform create_pago(v_alumno, v_plan, 'Mensualidad', null, null, '10:00', current_date,
                        current_date + 30, 'test-sedes', 1000, 1, v_items);
    total := total + 1; fallas := fallas + 1; r := r || E'\nFALLA se pudo cobrar a un alumno de Carlota estando en HerGym';
  exception when others then
    total := total + 1; r := r || E'\nOK    cobrar a alumno de Carlota desde HerGym: rechazado';
  end;

  -- El flujo normal de HerGym sigue igual después de cambiar el trigger de pagos
  begin
    v_pago_hg_nuevo := create_pago(v_alumno_hg, v_plan_hg, 'Mensualidad', null, null, '10:00', current_date,
                                   current_date + 30, 'test-sedes', 1000, 1, v_items);
    select gym_id into v_gym from pagos where id = v_pago_hg_nuevo;
    ok := (v_gym = c_hergym); total := total + 1; if not ok then fallas := fallas + 1; end if;
    r := r || format(E'\n%s alta de pago en HerGym: queda en gym %s', case when ok then 'OK   ' else 'FALLA' end, coalesce(v_gym::text, 'NO VISIBLE'));
  exception when others then
    total := total + 1; fallas := fallas + 1; r := r || E'\nFALLA alta de pago en HerGym: ' || sqlerrm;
  end;

  begin
    select facturacion_mes_actual into v_num from rpc_facturacion_resumen(c_carlota);
    ok := (coalesce(v_num, 0) = 0); total := total + 1; if not ok then fallas := fallas + 1; end if;
    r := r || format(E'\n%s facturación de Carlota pedida desde HerGym: %s', case when ok then 'OK   ' else 'FALLA' end, coalesce(v_num::text, 'nada'));
    select facturacion_mes_actual into v_num from rpc_facturacion_resumen(c_hergym);
    ok := (coalesce(v_num, 0) > 0); total := total + 1; if not ok then fallas := fallas + 1; end if;
    r := r || format(E'\n%s facturación propia de HerGym: %s', case when ok then 'OK   ' else 'FALLA' end, coalesce(v_num::text, 'nada'));
  exception when others then
    total := total + 1; fallas := fallas + 1; r := r || E'\nFALLA rpc_facturacion_resumen: ' || sqlerrm;
  end;

  ---------------------------------------------------------------------------
  -- C. Sin sesión (clave pública): no se ve nada
  ---------------------------------------------------------------------------
  perform set_config('request.jwt.claims', '', true);
  perform set_config('role', 'anon', true);
  r := r || E'\n== C. Sin sesión ==';

  foreach t in array array['alumnos','pagos','asistencias','gyms']
  loop
    begin
      execute format('select count(*) from public.%I', t) into n;
      ok := (n = 0); total := total + 1; if not ok then fallas := fallas + 1; end if;
      r := r || format(E'\n%s %s sin sesión: %s filas visibles', case when ok then 'OK   ' else 'FALLA' end, t, n);
    exception when others then
      total := total + 1; r := r || format(E'\nOK    %s sin sesión: acceso denegado', t);
    end;
  end loop;

  -- Fin: la excepción deshace todo lo insertado arriba
  raise exception E'RESULTADO: % chequeos, % fallas%', total, fallas, r;
end $$;
