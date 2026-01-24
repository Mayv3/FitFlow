-- Agregar columna producto_id a la tabla pagos
-- Esta columna permite registrar pagos de productos

ALTER TABLE pagos 
ADD COLUMN producto_id UUID REFERENCES productos(id) ON DELETE SET NULL;

-- Crear índice para mejorar el rendimiento
CREATE INDEX idx_pagos_producto_id ON pagos(producto_id);

-- Comentario explicativo
COMMENT ON COLUMN pagos.producto_id IS 'ID del producto asociado al pago (opcional)';
