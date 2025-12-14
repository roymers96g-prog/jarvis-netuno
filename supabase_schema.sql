-- ============================================
-- ACTUALIZACIÓN COMPLETA - Jarvis Netuno
-- ============================================
-- Ejecuta este script completo en Supabase SQL Editor
-- Actualiza la base de datos para soportar servicio técnico
-- NO pierde datos existentes

-- ============================================
-- 1. ACTUALIZAR TABLA production_records
-- ============================================

-- Agregar nuevos campos si no existen
ALTER TABLE production_records
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS manual_amount DECIMAL(10, 2);

-- Hacer quantity nullable (para servicio_tecnico)
ALTER TABLE production_records
ALTER COLUMN quantity DROP NOT NULL;

-- Hacer unit_price nullable (para servicio_tecnico)
ALTER TABLE production_records
ALTER COLUMN unit_price DROP NOT NULL;

-- Actualizar constraint de installation_type para incluir 'servicio_tecnico'
ALTER TABLE production_records
DROP CONSTRAINT IF EXISTS production_records_installation_type_check;

ALTER TABLE production_records
ADD CONSTRAINT production_records_installation_type_check
CHECK (installation_type IN ('residencial', 'poste', 'corporativo', 'servicio_tecnico'));

-- Actualizar constraint de quantity para permitir NULL
ALTER TABLE production_records
DROP CONSTRAINT IF EXISTS production_records_quantity_check;

ALTER TABLE production_records
ADD CONSTRAINT production_records_quantity_check
CHECK (quantity IS NULL OR quantity > 0);

-- ============================================
-- 2. FUNCIÓN DE INSERCIÓN: insert_production_record
-- Se re-crea para manejar la lógica de servicio_tecnico
-- ============================================
CREATE OR REPLACE FUNCTION insert_production_record(
    p_user_id TEXT,
    p_installation_type TEXT,
    p_quantity INTEGER DEFAULT NULL,
    p_record_date DATE DEFAULT CURRENT_DATE,
    p_notes TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_manual_amount DECIMAL(10, 2) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_total_amount DECIMAL(10, 2);
    v_unit_price DECIMAL(10, 2);
    v_new_record_id UUID;
BEGIN
    -- Validar tipo de instalación
    IF p_installation_type NOT IN ('residencial', 'poste', 'corporativo', 'servicio_tecnico') THEN
        RAISE EXCEPTION 'Tipo de instalación inválido: %', p_installation_type;
    END IF;

    IF p_installation_type = 'servicio_tecnico' THEN
        -- Validar monto manual para servicio técnico
        IF p_manual_amount IS NULL OR p_manual_amount <= 0 THEN
            RAISE EXCEPTION 'Servicio técnico requiere un monto válido (manual_amount)';
        END IF;
        v_total_amount := p_manual_amount;
        v_unit_price := NULL;
    ELSE
        -- Validar cantidad para instalaciones normales
        IF p_quantity IS NULL OR p_quantity <= 0 THEN
            RAISE EXCEPTION 'Las instalaciones requieren una cantidad válida';
        END IF;

        -- Determinar precio unitario según tipo
        CASE p_installation_type
            WHEN 'residencial' THEN v_unit_price := 7.00;
            WHEN 'poste' THEN v_unit_price := 8.00;
            WHEN 'corporativo' THEN v_unit_price := 0.00; -- Preparado para futuro
            ELSE RAISE EXCEPTION 'Tipo de instalación inválido: %', p_installation_type;
        END CASE;

        -- Calcular total
        v_total_amount := p_quantity * v_unit_price;
    END IF;

    -- Insertar registro
    INSERT INTO production_records (
        user_id,
        installation_type,
        quantity,
        unit_price,
        total_amount,
        record_date,
        notes,
        description,
        manual_amount
    ) VALUES (
        p_user_id,
        p_installation_type,
        p_quantity,
        v_unit_price,
        v_total_amount,
        p_record_date,
        p_notes,
        p_description,
        p_manual_amount
    )
    RETURNING id INTO v_new_record_id;

    RETURN v_new_record_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. ACTUALIZAR FUNCIONES DE TOTALES (Manejo de NULL)
-- ============================================

-- Función para obtener totales del día actual
CREATE OR REPLACE FUNCTION get_today_totals(p_user_id TEXT)
RETURNS TABLE (
    total_installations INTEGER,
    total_earnings DECIMAL(10, 2),
    residencial_count INTEGER,
    poste_count INTEGER,
    corporativo_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(COALESCE(quantity, 0)), 0)::INTEGER as total_installations,
        COALESCE(SUM(total_amount), 0) as total_earnings,
        COALESCE(SUM(CASE WHEN installation_type = 'residencial' THEN COALESCE(quantity, 0) ELSE 0 END), 0)::INTEGER as residencial_count,
        COALESCE(SUM(CASE WHEN installation_type = 'poste' THEN COALESCE(quantity, 0) ELSE 0 END), 0)::INTEGER as poste_count,
        COALESCE(SUM(CASE WHEN installation_type = 'corporativo' THEN COALESCE(quantity, 0) ELSE 0 END), 0)::INTEGER as corporativo_count
    FROM production_records
    WHERE user_id = p_user_id
    AND record_date = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener totales del mes actual
CREATE OR REPLACE FUNCTION get_month_totals(p_user_id TEXT)
RETURNS TABLE (
    total_installations INTEGER,
    total_earnings DECIMAL(10, 2),
    residencial_count INTEGER,
    poste_count INTEGER,
    corporativo_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(COALESCE(quantity, 0)), 0)::INTEGER as total_installations,
        COALESCE(SUM(total_amount), 0) as total_earnings,
        COALESCE(SUM(CASE WHEN installation_type = 'residencial' THEN COALESCE(quantity, 0) ELSE 0 END), 0)::INTEGER as residencial_count,
        COALESCE(SUM(CASE WHEN installation_type = 'poste' THEN COALESCE(quantity, 0) ELSE 0 END), 0)::INTEGER as poste_count,
        COALESCE(SUM(CASE WHEN installation_type = 'corporativo' THEN COALESCE(quantity, 0) ELSE 0 END), 0)::INTEGER as corporativo_count
    FROM production_records
    WHERE user_id = p_user_id
    AND DATE_TRUNC('month', record_date) = DATE_TRUNC('month', CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- Función para obtener totales del año actual
CREATE OR REPLACE FUNCTION get_year_totals(p_user_id TEXT)
RETURNS TABLE (
    total_installations INTEGER,
    total_earnings DECIMAL(10, 2),
    residencial_count INTEGER,
    poste_count INTEGER,
    corporativo_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(COALESCE(quantity, 0)), 0)::INTEGER as total_installations,
        COALESCE(SUM(total_amount), 0) as total_earnings,
        COALESCE(SUM(CASE WHEN installation_type = 'residencial' THEN COALESCE(quantity, 0) ELSE 0 END), 0)::INTEGER as residencial_count,
        COALESCE(SUM(CASE WHEN installation_type = 'poste' THEN COALESCE(quantity, 0) ELSE 0 END), 0)::INTEGER as poste_count,
        COALESCE(SUM(CASE WHEN installation_type = 'corporativo' THEN COALESCE(quantity, 0) ELSE 0 END), 0)::INTEGER as corporativo_count
    FROM production_records
    WHERE user_id = p_user_id
    AND DATE_TRUNC('year', record_date) = DATE_TRUNC('year', CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. VERIFICACIÓN
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Actualización completa exitosa';
    RAISE NOTICE '✅ Tabla production_records actualizada';
    RAISE NOTICE '✅ Función insert_production_record actualizada';
    RAISE NOTICE '✅ Funciones de totales actualizadas';
END
$$ LANGUAGE plpgsql;
