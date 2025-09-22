-- Migración segura para agregar nuevos campos del API de la Rama Judicial
-- Versión corregida que maneja columnas generadas

BEGIN;

-- PASO 1: Verificar y eliminar la columna search_vector si existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'judicial_processes' AND column_name = 'search_vector') THEN
        ALTER TABLE judicial_processes DROP COLUMN search_vector;
        RAISE NOTICE 'Columna search_vector eliminada';
    END IF;
END $$;

-- PASO 2: Agregar nuevos campos si no existen
DO $$
BEGIN
    -- id_proceso
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'judicial_processes' AND column_name = 'id_proceso') THEN
        ALTER TABLE judicial_processes ADD COLUMN id_proceso BIGINT;
        RAISE NOTICE 'Columna id_proceso agregada';
    END IF;
    
    -- id_conexion
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'judicial_processes' AND column_name = 'id_conexion') THEN
        ALTER TABLE judicial_processes ADD COLUMN id_conexion INTEGER;
        RAISE NOTICE 'Columna id_conexion agregada';
    END IF;
    
    -- fecha_proceso
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'judicial_processes' AND column_name = 'fecha_proceso') THEN
        ALTER TABLE judicial_processes ADD COLUMN fecha_proceso TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Columna fecha_proceso agregada';
    END IF;
    
    -- sujetos_procesales
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'judicial_processes' AND column_name = 'sujetos_procesales') THEN
        ALTER TABLE judicial_processes ADD COLUMN sujetos_procesales TEXT;
        RAISE NOTICE 'Columna sujetos_procesales agregada';
    END IF;
    
    -- solo_activos
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'judicial_processes' AND column_name = 'solo_activos') THEN
        ALTER TABLE judicial_processes ADD COLUMN solo_activos BOOLEAN DEFAULT false;
        RAISE NOTICE 'Columna solo_activos agregada';
    END IF;
END $$;

-- PASO 3: Modificar el tamaño de la columna despacho
ALTER TABLE judicial_processes ALTER COLUMN despacho TYPE VARCHAR(500);
RAISE NOTICE 'Tamaño de columna despacho actualizado a VARCHAR(500)';

-- PASO 4: Renombrar y cambiar tipo de columna status a estado
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'judicial_processes' AND column_name = 'status') THEN
        -- Primero cambiar el tipo a VARCHAR para permitir valores en español
        ALTER TABLE judicial_processes ALTER COLUMN status TYPE VARCHAR(50);
        RAISE NOTICE 'Tipo de columna status cambiado a VARCHAR(50)';
        
        -- Luego renombrar
        ALTER TABLE judicial_processes RENAME COLUMN status TO estado;
        RAISE NOTICE 'Columna status renombrada a estado';
        
        -- Actualizar valores existentes
        UPDATE judicial_processes SET estado = 'Activo' WHERE estado = 'active';
        UPDATE judicial_processes SET estado = 'Inactivo' WHERE estado = 'inactive';
        UPDATE judicial_processes SET estado = 'Terminado' WHERE estado = 'closed';
        UPDATE judicial_processes SET estado = 'Archivado' WHERE estado = 'archived';
        RAISE NOTICE 'Valores de estado actualizados al español';
    END IF;
    
    -- Asegurar que estado tenga el valor por defecto correcto
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'judicial_processes' AND column_name = 'estado') THEN
        ALTER TABLE judicial_processes ALTER COLUMN estado SET DEFAULT 'Activo';
        RAISE NOTICE 'Valor por defecto de estado establecido como Activo';
    END IF;
END $$;

-- PASO 5: Crear tablas nuevas si no existen
CREATE TABLE IF NOT EXISTS consultation_parameters (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    numero VARCHAR(50),
    nombre VARCHAR(255),
    tipo_persona VARCHAR(50),
    id_sujeto VARCHAR(50),
    ponente VARCHAR(255),
    clase_proceso VARCHAR(150),
    codificacion_despacho VARCHAR(100),
    solo_activos BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pagination_info (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    consultation_id UUID REFERENCES consultation_parameters(id) ON DELETE CASCADE,
    cantidad_registros INTEGER,
    registros_pagina INTEGER,
    cantidad_paginas INTEGER,
    pagina INTEGER,
    paginas INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PASO 6: Crear nuevos índices si no existen
CREATE INDEX IF NOT EXISTS idx_judicial_processes_id_proceso ON judicial_processes(id_proceso);
CREATE INDEX IF NOT EXISTS idx_judicial_processes_estado ON judicial_processes(estado);
CREATE INDEX IF NOT EXISTS idx_judicial_processes_fecha_proceso ON judicial_processes(fecha_proceso);
CREATE INDEX IF NOT EXISTS idx_judicial_processes_departamento ON judicial_processes(departamento);
CREATE INDEX IF NOT EXISTS idx_judicial_processes_es_privado ON judicial_processes(es_privado);
CREATE INDEX IF NOT EXISTS idx_consultation_parameters_numero ON consultation_parameters(numero);
CREATE INDEX IF NOT EXISTS idx_consultation_parameters_nombre ON consultation_parameters(nombre);
CREATE INDEX IF NOT EXISTS idx_pagination_info_consultation_id ON pagination_info(consultation_id);

-- PASO 7: Eliminar índices antiguos
DROP INDEX IF EXISTS idx_judicial_processes_status;

-- PASO 8: Actualizar función de estadísticas
CREATE OR REPLACE FUNCTION get_process_statistics(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_processes', COUNT(*),
        'active_processes', COUNT(*) FILTER (WHERE jp.estado = 'Activo'),
        'recent_updates', COUNT(*) FILTER (WHERE jp.updated_at > NOW() - INTERVAL '7 days'),
        'private_processes', COUNT(*) FILTER (WHERE jp.es_privado = true),
        'closed_processes', COUNT(*) FILTER (WHERE jp.estado = 'Terminado'),
        'suspended_processes', COUNT(*) FILTER (WHERE jp.estado = 'Suspendido')
    ) INTO result
    FROM judicial_processes jp
    INNER JOIN user_processes up ON jp.id = up.process_id
    WHERE up.user_id = user_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 9: Recrear la columna search_vector con los nuevos campos
ALTER TABLE judicial_processes 
ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('spanish', 
        coalesce(numero_radicacion, '') || ' ' ||
        coalesce(demandante, '') || ' ' ||
        coalesce(demandado, '') || ' ' ||
        coalesce(despacho, '') || ' ' ||
        coalesce(tipo_proceso, '') || ' ' ||
        coalesce(sujetos_procesales, '')
    )
) STORED;

RAISE NOTICE 'Migración completada exitosamente';

COMMIT;