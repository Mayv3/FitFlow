-- Crear tabla de novedades/features (Blog global del sistema)
CREATE TABLE IF NOT EXISTS public.novedades (
    id BIGSERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(50) DEFAULT 'novedad' CHECK (tipo IN ('novedad', 'feature', 'promocion', 'evento', 'error', 'fix')),
    activo BOOLEAN DEFAULT true,
    fecha_publicacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    imagen_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_novedades_activo ON public.novedades(activo);
CREATE INDEX IF NOT EXISTS idx_novedades_tipo ON public.novedades(tipo);
CREATE INDEX IF NOT EXISTS idx_novedades_fecha_publicacion ON public.novedades(fecha_publicacion);
CREATE INDEX IF NOT EXISTS idx_novedades_deleted_at ON public.novedades(deleted_at);

-- RLS (Row Level Security)
ALTER TABLE public.novedades ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas antiguas si existen
DROP POLICY IF EXISTS "Users can view novedades from their gym" ON public.novedades;
DROP POLICY IF EXISTS "Admins can manage novedades from their gym" ON public.novedades;
DROP POLICY IF EXISTS "Admins can insert novedades in their gym" ON public.novedades;
DROP POLICY IF EXISTS "Admins can update novedades in their gym" ON public.novedades;
DROP POLICY IF EXISTS "Admins can delete novedades in their gym" ON public.novedades;
DROP POLICY IF EXISTS "Allow all operations on novedades" ON public.novedades;

-- Política simple: Permitir todas las operaciones (el backend maneja la autenticación)
CREATE POLICY "Allow all operations on novedades" ON public.novedades
    FOR ALL USING (true) WITH CHECK (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_novedades_updated_at BEFORE UPDATE ON public.novedades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentarios
COMMENT ON TABLE public.novedades IS 'Tabla para gestionar novedades, features y promociones del sistema (Blog global)';
COMMENT ON COLUMN public.novedades.tipo IS 'Tipo de novedad: novedad, feature, promocion, evento, error, fix';
COMMENT ON COLUMN public.novedades.fecha_publicacion IS 'Fecha y hora de publicación de la novedad';