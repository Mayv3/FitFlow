-- RLS para la tabla asistencias
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;

-- Usuarios autenticados solo ven/modifican asistencias de su propio gimnasio
CREATE POLICY "Authenticated users access own gym asistencias"
ON asistencias
FOR ALL
TO authenticated
USING (gym_id = ((auth.jwt() -> 'user_metadata' ->> 'gym_id')::uuid))
WITH CHECK (gym_id = ((auth.jwt() -> 'user_metadata' ->> 'gym_id')::uuid));
