# RLS Pendientes — FitFlow

Tablas que necesitan Row Level Security en Supabase.
Ejecutar cada bloque SQL en el SQL Editor de Supabase.

---

## ✅ Completadas

### asistencias
```sql
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users access own gym asistencias"
ON asistencias FOR ALL TO authenticated
USING (gym_id = ((auth.jwt() -> 'user_metadata' ->> 'gym_id')::uuid))
WITH CHECK (gym_id = ((auth.jwt() -> 'user_metadata' ->> 'gym_id')::uuid));
```

---

## ⏳ Pendientes

### clases
> Multi-tenant por gym_id

### clases_inscripciones
> Multi-tenant por gym_id

### clases_sesiones
> Multi-tenant por gym_id

### deudas
> Multi-tenant por gym_id

### egresos
> Multi-tenant por gym_id

### metodos_de_pago
> Multi-tenant por gym_id

### pago_items
> Multi-tenant por gym_id (a través de pago → gym_id)

### suscriptions
> Multi-tenant por gym_id

### users
> Cada usuario ve solo los de su gym. Requiere cuidado: el admin de FitFlow necesita ver todos.

### gyms
> Cada gym solo puede leer su propia fila. Requiere política especial (no es multi-tenant clásico).

### gym_plans
> Tabla de planes del SaaS (global). Todos los gyms la leen, solo FitFlow admin escribe.

### roles
> Tabla lookup global. Solo lectura para todos, escritura solo para FitFlow admin.

### novedades
> Global (blog del sistema). Política abierta de lectura, escritura solo FitFlow admin.
> Ya tiene RLS habilitado con `USING (true)` — hay que reemplazar la política por una restrictiva.

---

## 🚫 No aplica RLS (vistas materializadas)

- `mv_alumnos_demografia`
- `mv_dashboard_charts`
- `mv_dashboard_kpis`
- `mv_planes_dashboard`
