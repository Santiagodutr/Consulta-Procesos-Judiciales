-- Migración para agregar nuevos campos del API de la Rama Judicial
-- Ejecutar después de aplicar el schema.sql actualizado

-- PASO 1: Eliminar la columna search_vector antes de modificar las columnas que usa
ALTER TABLE judicial_processes 
DROP COLUMN IF EXISTS search_vector;

-- PASO 2: Agregar nuevos campos a la tabla judicial_processes
ALTER TABLE judicial_processes 
ADD COLUMN IF NOT EXISTS id_proceso BIGINT,
ADD COLUMN IF NOT EXISTS id_conexion INTEGER,
ADD COLUMN IF NOT EXISTS fecha_proceso TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sujetos_procesales TEXT,
ADD COLUMN IF NOT EXISTS solo_activos BOOLEAN DEFAULT false;

-- PASO 3: Modificar el tamaño de la columna despacho para nombres largos
ALTER TABLE judicial_processes 
ALTER COLUMN despacho TYPE VARCHAR(500);

-- PASO 4: Renombrar y cambiar tipo de columna status a estado
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'judicial_processes' AND column_name = 'status') THEN
        -- Primero cambiar el tipo a TEXT para permitir valores en español
        ALTER TABLE judicial_processes ALTER COLUMN status TYPE VARCHAR(50);
        -- Luego renombrar
        ALTER TABLE judicial_processes RENAME COLUMN status TO estado;
        -- Actualizar valores existentes
        UPDATE judicial_processes SET estado = 'Activo' WHERE estado = 'active';
        UPDATE judicial_processes SET estado = 'Inactivo' WHERE estado = 'inactive';
        UPDATE judicial_processes SET estado = 'Terminado' WHERE estado = 'closed';
        UPDATE judicial_processes SET estado = 'Archivado' WHERE estado = 'archived';
    END IF;
END $$;

-- PASO 5: Actualizar valores por defecto para el campo estado
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'judicial_processes' AND column_name = 'estado') THEN
        ALTER TABLE judicial_processes ALTER COLUMN estado SET DEFAULT 'Activo';
    END IF;
END $$;

-- PASO 6: Crear nuevas tablas
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

CREATE TABLE IF NOT EXISTS process_snapshots (
    process_number VARCHAR(50) PRIMARY KEY,
    process_id VARCHAR(100),
    last_activity_date VARCHAR(50),
    last_decision_date VARCHAR(50),
    last_status VARCHAR(100),
    summary TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PASO 7: Crear nuevos índices
CREATE INDEX IF NOT EXISTS idx_judicial_processes_id_proceso ON judicial_processes(id_proceso);
CREATE INDEX IF NOT EXISTS idx_judicial_processes_estado ON judicial_processes(estado);
CREATE INDEX IF NOT EXISTS idx_judicial_processes_fecha_proceso ON judicial_processes(fecha_proceso);
CREATE INDEX IF NOT EXISTS idx_judicial_processes_departamento ON judicial_processes(departamento);
CREATE INDEX IF NOT EXISTS idx_judicial_processes_es_privado ON judicial_processes(es_privado);
CREATE INDEX IF NOT EXISTS idx_consultation_parameters_numero ON consultation_parameters(numero);
CREATE INDEX IF NOT EXISTS idx_consultation_parameters_nombre ON consultation_parameters(nombre);
CREATE INDEX IF NOT EXISTS idx_pagination_info_consultation_id ON pagination_info(consultation_id);
CREATE INDEX IF NOT EXISTS idx_process_snapshots_last_activity_date ON process_snapshots(last_activity_date);

-- PASO 8: Eliminar índices antiguos que ya no aplican
DROP INDEX IF EXISTS idx_judicial_processes_status;

-- PASO 9: Actualizar la función de estadísticas
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

-- PASO 10: Recrear el search_vector con los nuevos campos
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

COMMIT;