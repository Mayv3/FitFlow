-- Tabla de productos para el sistema FitFlow
-- Esta tabla almacena productos que pueden venderse en el gimnasio (suplementos, bebidas, merchandising, etc.)

CREATE TABLE productos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10, 2) NOT NULL,
  stock INTEGER DEFAULT 0,
  categoria VARCHAR(100), -- Ej: 'Suplementos', 'Bebidas', 'Merchandising', 'Accesorios'
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_productos_gym_id ON productos(gym_id);
CREATE INDEX idx_productos_categoria ON productos(categoria);
CREATE INDEX idx_productos_activo ON productos(activo);
CREATE INDEX idx_productos_deleted_at ON productos(deleted_at);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_productos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_productos_updated_at
  BEFORE UPDATE ON productos
  FOR EACH ROW
  EXECUTE FUNCTION update_productos_updated_at();

-- RLS (Row Level Security)
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso a productos
CREATE POLICY "Enable read access for all users"
  ON productos
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON productos
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON productos
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users"
  ON productos
  FOR DELETE
  USING (true);

-- Datos de ejemplo (opcional)
-- INSERT INTO productos (gym_id, nombre, descripcion, precio, stock, categoria, activo)
-- VALUES 
--   ('tu-gym-id-uuid', 'Proteína Whey 1kg', 'Proteína de suero de leche sabor chocolate', 45000.00, 20, 'Suplementos', true),
--   ('tu-gym-id-uuid', 'Creatina Monohidrato 300g', 'Creatina pura monohidrato', 25000.00, 15, 'Suplementos', true),
--   ('tu-gym-id-uuid', 'Botella Deportiva', 'Botella de agua deportiva 750ml', 8000.00, 50, 'Accesorios', true),
--   ('tu-gym-id-uuid', 'Remera FitFlow', 'Remera oficial del gimnasio', 15000.00, 30, 'Merchandising', true);
