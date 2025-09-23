-- ============================================================================
-- SCRIPT DE VERIFICACIÓN POST-MIGRACIÓN
-- ============================================================================
-- Ejecuta este script después de aplicar schema.sql para verificar que
-- todo se instaló correctamente
-- ============================================================================

\echo '============================================================================'
\echo 'VERIFICACIÓN DE MIGRACIÓN - SISTEMA JUDICIAL COLOMBIANO'
\echo '============================================================================'

\echo ''
\echo '1. VERIFICANDO EXTENSIONES...'
SELECT 
    extname as "Extensión",
    extversion as "Versión"
FROM pg_extension 
WHERE extname = 'uuid-ossp';

\echo ''
\echo '2. VERIFICANDO TIPOS PERSONALIZADOS...'
SELECT 
    typname as "Tipo Personalizado",
    string_agg(enumlabel, ', ' ORDER BY enumsortorder) as "Valores"
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typtype = 'e'
GROUP BY typname
ORDER BY typname;

\echo ''
\echo '3. VERIFICANDO TABLAS PRINCIPALES...'
SELECT 
    t.table_name as "Tabla",
    COUNT(c.column_name) as "Columnas"
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public' 
AND t.table_type = 'BASE TABLE'
GROUP BY t.table_name
ORDER BY t.table_name;

\echo ''
\echo '4. VERIFICANDO FOREIGN KEYS...'
SELECT 
    tc.table_name as "Tabla Origen",
    kcu.column_name as "Columna",
    ccu.table_name as "Tabla Referenciada",
    ccu.column_name as "Columna Referenciada"
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

\echo ''
\echo '5. VERIFICANDO ÍNDICES...'
SELECT 
    tablename as "Tabla",
    indexname as "Índice",
    indexdef as "Definición"
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('users', 'judicial_processes', 'process_activities', 'process_subjects')
ORDER BY tablename, indexname;

\echo ''
\echo '6. VERIFICANDO TRIGGERS...'
SELECT 
    trigger_name as "Trigger",
    event_object_table as "Tabla",
    action_timing as "Momento",
    event_manipulation as "Evento"
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

\echo ''
\echo '7. VERIFICANDO POLÍTICAS RLS...'
SELECT 
    tablename as "Tabla",
    policyname as "Política",
    roles as "Roles",
    cmd as "Comando"
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

\echo ''
\echo '8. VERIFICANDO FUNCIONES PERSONALIZADAS...'
SELECT 
    routine_name as "Función",
    routine_type as "Tipo",
    data_type as "Retorna"
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('get_user_processes', 'get_process_statistics', 'update_updated_at_column')
ORDER BY routine_name;

\echo ''
\echo '9. VERIFICANDO ESTRUCTURA DE TABLA PRINCIPAL (judicial_processes)...'
SELECT 
    column_name as "Columna",
    data_type as "Tipo",
    is_nullable as "Nulo",
    column_default as "Default"
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'judicial_processes'
ORDER BY ordinal_position;

\echo ''
\echo '10. VERIFICANDO CAPACIDAD DE INSERCIÓN (TEST)...'
-- Test de inserción básica
INSERT INTO companies (name, nit, email, is_active) 
VALUES ('Empresa Test Migración', '900123456-7', 'test@migracion.com', true)
ON CONFLICT (nit) DO NOTHING;

-- Verificar que se insertó
SELECT 
    'SUCCESS: Inserción en companies' as "Resultado",
    COUNT(*) as "Registros"
FROM companies 
WHERE nit = '900123456-7';

\echo ''
\echo '11. RESUMEN DE VERIFICACIÓN...'
SELECT 
    'Tablas creadas' as "Componente",
    COUNT(*)::text as "Cantidad"
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'

UNION ALL

SELECT 
    'Tipos personalizados',
    COUNT(DISTINCT typname)::text
FROM pg_type 
WHERE typtype = 'e'

UNION ALL

SELECT 
    'Índices',
    COUNT(*)::text
FROM pg_indexes 
WHERE schemaname = 'public'

UNION ALL

SELECT 
    'Políticas RLS',
    COUNT(*)::text
FROM pg_policies 
WHERE schemaname = 'public'

UNION ALL

SELECT 
    'Triggers',
    COUNT(*)::text
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

\echo ''
\echo '============================================================================'
\echo 'VERIFICACIÓN COMPLETADA'
\echo '============================================================================'
\echo 'Si todos los componentes muestran números > 0, la migración fue exitosa.'
\echo 'Procede a probar la API con:'
\echo '- POST /api/judicial/consult'
\echo '- GET /api/judicial/search' 
\echo '- POST /api/auth/register'
\echo '============================================================================'