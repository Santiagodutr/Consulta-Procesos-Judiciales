-- ============================================================================
-- MIGRATION SCRIPT: DROP OLD TABLES AND STRUCTURES
-- ============================================================================
-- Este script elimina todas las estructuras existentes que no coinciden 
-- con el nuevo schema para el sistema de consulta de procesos judiciales
-- ⚠️  ADVERTENCIA: Este script ELIMINARÁ TODOS LOS DATOS EXISTENTES
-- ============================================================================

-- Deshabilitar RLS temporalmente para evitar errores
SET row_security = off;

-- Eliminar triggers existentes
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies CASCADE;
DROP TRIGGER IF EXISTS update_users_updated_at ON users CASCADE;
DROP TRIGGER IF EXISTS update_judicial_processes_updated_at ON judicial_processes CASCADE;
DROP TRIGGER IF EXISTS update_user_processes_updated_at ON user_processes CASCADE;
DROP TRIGGER IF EXISTS update_process_activities_updated_at ON process_activities CASCADE;
DROP TRIGGER IF EXISTS update_process_documents_updated_at ON process_documents CASCADE;
DROP TRIGGER IF EXISTS update_scraping_jobs_updated_at ON scraping_jobs CASCADE;

-- Eliminar funciones personalizadas
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS get_user_processes(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_process_statistics(UUID) CASCADE;

-- Eliminar índices específicos (los índices en columnas que se eliminan se borran automáticamente)
DROP INDEX IF EXISTS idx_users_email CASCADE;
DROP INDEX IF EXISTS idx_users_document_number CASCADE;
DROP INDEX IF EXISTS idx_users_company_id CASCADE;
DROP INDEX IF EXISTS idx_judicial_processes_process_number CASCADE;
DROP INDEX IF EXISTS idx_judicial_processes_numero_radicacion CASCADE;
DROP INDEX IF EXISTS idx_judicial_processes_status CASCADE;
DROP INDEX IF EXISTS idx_judicial_processes_is_monitored CASCADE;
DROP INDEX IF EXISTS idx_user_processes_user_id CASCADE;
DROP INDEX IF EXISTS idx_user_processes_process_id CASCADE;
DROP INDEX IF EXISTS idx_process_activities_process_id CASCADE;
DROP INDEX IF EXISTS idx_process_activities_activity_date CASCADE;
DROP INDEX IF EXISTS idx_process_activities_fecha_actuacion CASCADE;
DROP INDEX IF EXISTS idx_process_subjects_process_id CASCADE;
DROP INDEX IF EXISTS idx_process_subjects_tipo_sujeto CASCADE;
DROP INDEX IF EXISTS idx_process_subjects_identificacion CASCADE;
DROP INDEX IF EXISTS idx_process_documents_process_id CASCADE;
DROP INDEX IF EXISTS idx_process_documents_actuacion_id CASCADE;
DROP INDEX IF EXISTS idx_consultation_history_user_id CASCADE;
DROP INDEX IF EXISTS idx_consultation_history_process_id CASCADE;
DROP INDEX IF EXISTS idx_consultation_history_created_at CASCADE;
DROP INDEX IF EXISTS idx_notifications_user_id CASCADE;
DROP INDEX IF EXISTS idx_notifications_is_read CASCADE;
DROP INDEX IF EXISTS idx_scraping_jobs_status CASCADE;
DROP INDEX IF EXISTS idx_scraping_jobs_process_id CASCADE;

-- Eliminar políticas RLS
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Company members can view company" ON companies;
DROP POLICY IF EXISTS "Users can view associated processes" ON judicial_processes;
DROP POLICY IF EXISTS "Users can view their process associations" ON user_processes;
DROP POLICY IF EXISTS "Users can view activities of their processes" ON process_activities;
DROP POLICY IF EXISTS "Users can view documents of their processes" ON process_documents;
DROP POLICY IF EXISTS "Users can view their consultation history" ON consultation_history;
DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON notifications;

-- Eliminar tablas en orden correcto (respetando foreign keys)
DROP TABLE IF EXISTS email_verification_tokens CASCADE;
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS scraping_jobs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS consultation_history CASCADE;
DROP TABLE IF EXISTS process_documents CASCADE;
DROP TABLE IF EXISTS process_subjects CASCADE;
DROP TABLE IF EXISTS process_activities CASCADE;
DROP TABLE IF EXISTS user_processes CASCADE;
DROP TABLE IF EXISTS judicial_processes CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- Eliminar tipos personalizados
DROP TYPE IF EXISTS job_status CASCADE;
DROP TYPE IF EXISTS activity_type CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS process_status CASCADE;
DROP TYPE IF EXISTS user_type CASCADE;

-- Limpiar extensiones si no se usan en otros lugares
-- DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE; -- Comentado por seguridad

-- Re-habilitar RLS
SET row_security = on;

-- ============================================================================
-- LIMPIEZA COMPLETADA
-- ============================================================================
-- Todas las estructuras antiguas han sido eliminadas.
-- Ahora puedes ejecutar el script de creación del nuevo schema.
-- ============================================================================