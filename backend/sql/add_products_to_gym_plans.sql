-- Agregar columna products a la tabla gym_plans
-- Esta columna habilita/deshabilita el módulo de gestión de productos para cada plan

ALTER TABLE gym_plans 
ADD COLUMN products BOOLEAN DEFAULT false;

-- Comentario explicativo
COMMENT ON COLUMN gym_plans.products IS 'Habilita el módulo de gestión de productos en el plan de suscripción';

-- Actualizar planes existentes si es necesario
-- Por defecto, los planes existentes tendrán products = false
