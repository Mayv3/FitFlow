-- Políticas de Storage para el bucket 'novedades'

-- 1. Permitir a usuarios autenticados INSERTAR (subir) archivos
CREATE POLICY "Usuarios autenticados pueden subir imágenes a novedades"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'novedades');

-- 2. Permitir a usuarios autenticados SELECCIONAR (ver/descargar) archivos
CREATE POLICY "Usuarios autenticados pueden ver imágenes de novedades"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'novedades');

-- 3. Permitir acceso público para ver archivos (opcional, si quieres que sean públicas)
CREATE POLICY "Acceso público para ver imágenes de novedades"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'novedades');

-- 4. Permitir a usuarios autenticados ACTUALIZAR archivos
CREATE POLICY "Usuarios autenticados pueden actualizar imágenes de novedades"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'novedades')
WITH CHECK (bucket_id = 'novedades');

-- 5. Permitir a usuarios autenticados ELIMINAR archivos
CREATE POLICY "Usuarios autenticados pueden eliminar imágenes de novedades"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'novedades');

-- IMPORTANTE: Ejecuta estos comandos en el SQL Editor de Supabase
-- Si ya existen políticas con estos nombres, primero elimínalas con:
-- DROP POLICY IF EXISTS "nombre_de_la_politica" ON storage.objects;
