-- Create custom types
CREATE TYPE user_type AS ENUM ('natural', 'juridical', 'company');
CREATE TYPE process_status AS ENUM ('active', 'inactive', 'closed', 'archived');
CREATE TYPE notification_type AS ENUM ('email', 'sms', 'in_app', 'sound');
CREATE TYPE activity_type AS ENUM ('hearing', 'resolution', 'notification', 'document', 'appeal', 'other');
CREATE TYPE job_status AS ENUM ('pending', 'running', 'completed', 'failed');

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies table
CREATE TABLE companies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    nit VARCHAR(20) UNIQUE NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    document_number VARCHAR(20) UNIQUE NOT NULL,
    document_type VARCHAR(10) NOT NULL CHECK (document_type IN ('CC', 'CE', 'NIT', 'passport')),
    user_type user_type NOT NULL,
    phone_number VARCHAR(20),
    company_id UUID REFERENCES companies(id),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    notification_preferences JSONB DEFAULT '{
        "email_enabled": true,
        "sms_enabled": false,
        "in_app_enabled": true,
        "sound_enabled": true,
        "process_updates": true,
        "hearing_reminders": true,
        "document_alerts": true,
        "weekly_summary": false
    }',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Judicial processes table (based on Rama Judicial portal structure)
CREATE TABLE judicial_processes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    numero_radicacion VARCHAR(50) UNIQUE NOT NULL,
    fecha_radicacion DATE,
    fecha_ultima_actuacion TIMESTAMP WITH TIME ZONE,
    fecha_consulta TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_replicacion_datos TIMESTAMP WITH TIME ZONE,
    
    -- Court and jurisdiction info
    despacho VARCHAR(255) NOT NULL,
    departamento VARCHAR(100),
    ponente VARCHAR(255),
    ubicacion_expediente VARCHAR(255),
    
    -- Case classification
    tipo_proceso VARCHAR(100),
    clase_proceso VARCHAR(150),
    subclase_proceso VARCHAR(150),
    tipo_recurso VARCHAR(100),
    contenido_radicacion TEXT,
    
    -- Process parties
    demandante TEXT NOT NULL,
    demandado TEXT NOT NULL,
    apoderado_demandante TEXT,
    apoderado_demandado TEXT,
    otros_sujetos_procesales JSONB,
    
    -- Process status and metadata  
    status process_status DEFAULT 'active',
    es_privado BOOLEAN DEFAULT false,
    cantidad_folios INTEGER,
    portal_url TEXT,
    
    -- Monitoring and user association
    is_monitored BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Search optimization
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('spanish', 
            coalesce(numero_radicacion, '') || ' ' ||
            coalesce(demandante, '') || ' ' ||
            coalesce(demandado, '') || ' ' ||
            coalesce(despacho, '') || ' ' ||
            coalesce(tipo_proceso, '')
        )
    ) STORED
);

-- User processes relationship table
CREATE TABLE user_processes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    process_id UUID REFERENCES judicial_processes(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- plaintiff, defendant, lawyer, observer
    is_shared BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, process_id)
);

-- Process activities/actuaciones table (based on portal structure)
CREATE TABLE process_activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    process_id UUID REFERENCES judicial_processes(id) ON DELETE CASCADE,
    id_actuacion BIGINT, -- From portal API
    cons_actuacion INTEGER,
    
    -- Activity details
    fecha_actuacion TIMESTAMP WITH TIME ZONE NOT NULL,
    actuacion VARCHAR(255) NOT NULL,
    anotacion TEXT,
    
    -- Timing information  
    fecha_inicio_termino TIMESTAMP WITH TIME ZONE,
    fecha_finaliza_termino TIMESTAMP WITH TIME ZONE,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Additional metadata
    codigo_regla VARCHAR(50),
    con_documentos BOOLEAN DEFAULT false,
    cant_folios INTEGER DEFAULT 0,
    
    -- System fields
    is_new BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Process subjects/sujetos procesales table (based on portal structure)
CREATE TABLE process_subjects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    process_id UUID REFERENCES judicial_processes(id) ON DELETE CASCADE,
    
    -- Portal API fields
    id_sujeto_proceso BIGINT,
    nombre_sujeto VARCHAR(255) NOT NULL,
    tipo_sujeto VARCHAR(100) NOT NULL, -- DEMANDANTE, DEMANDADO, etc
    
    -- Person details
    identificacion VARCHAR(50),
    tipo_identificacion VARCHAR(50),
    nombre_completo TEXT,
    
    -- Legal representation
    apoderado VARCHAR(255),
    tiene_apoderado BOOLEAN DEFAULT false,
    
    -- Contact information (if available)
    email VARCHAR(100),
    telefono VARCHAR(20),
    direccion TEXT,
    ciudad VARCHAR(100),
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Process documents table (based on portal structure)
CREATE TABLE process_documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    process_id UUID REFERENCES judicial_processes(id) ON DELETE CASCADE,
    actuacion_id UUID REFERENCES process_activities(id) ON DELETE CASCADE,
    
    -- Document details from portal
    id_documento BIGINT,
    nombre_archivo VARCHAR(255) NOT NULL,
    tipo_documento VARCHAR(100),
    url_descarga TEXT,
    
    -- File information
    tamano_archivo BIGINT,
    extension_archivo VARCHAR(10),
    fecha_documento TIMESTAMP WITH TIME ZONE,
    
    -- Access control
    uploaded_by UUID REFERENCES users(id),
    is_downloaded BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,
    
    -- System fields  
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Consultation history table
CREATE TABLE consultation_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    process_id UUID REFERENCES judicial_processes(id) ON DELETE CASCADE,
    consultation_type VARCHAR(50) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    result_status VARCHAR(50) NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    process_id UUID REFERENCES judicial_processes(id) ON DELETE SET NULL,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scraping jobs table
CREATE TABLE scraping_jobs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    process_id UUID REFERENCES judicial_processes(id) ON DELETE CASCADE,
    status job_status DEFAULT 'pending',
    portal_name VARCHAR(100) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Password reset tokens table
CREATE TABLE password_reset_tokens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email verification tokens table
CREATE TABLE email_verification_tokens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_document_number ON users(document_number);
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_judicial_processes_numero_radicacion ON judicial_processes(numero_radicacion);
CREATE INDEX idx_judicial_processes_status ON judicial_processes(status);
CREATE INDEX idx_judicial_processes_is_monitored ON judicial_processes(is_monitored);
CREATE INDEX idx_user_processes_user_id ON user_processes(user_id);
CREATE INDEX idx_user_processes_process_id ON user_processes(process_id);
CREATE INDEX idx_process_activities_process_id ON process_activities(process_id);
CREATE INDEX idx_process_activities_fecha_actuacion ON process_activities(fecha_actuacion);
CREATE INDEX idx_process_subjects_process_id ON process_subjects(process_id);
CREATE INDEX idx_process_subjects_tipo_sujeto ON process_subjects(tipo_sujeto);
CREATE INDEX idx_process_subjects_identificacion ON process_subjects(identificacion);
CREATE INDEX idx_process_documents_process_id ON process_documents(process_id);
CREATE INDEX idx_process_documents_actuacion_id ON process_documents(actuacion_id);
CREATE INDEX idx_consultation_history_user_id ON consultation_history(user_id);
CREATE INDEX idx_consultation_history_process_id ON consultation_history(process_id);
CREATE INDEX idx_consultation_history_created_at ON consultation_history(created_at);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_scraping_jobs_status ON scraping_jobs(status);
CREATE INDEX idx_scraping_jobs_process_id ON scraping_jobs(process_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_judicial_processes_updated_at BEFORE UPDATE ON judicial_processes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_processes_updated_at BEFORE UPDATE ON user_processes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_process_activities_updated_at BEFORE UPDATE ON process_activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_process_documents_updated_at BEFORE UPDATE ON process_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scraping_jobs_updated_at BEFORE UPDATE ON scraping_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE judicial_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraping_jobs ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
-- Allow user registration (INSERT operations for new users)
CREATE POLICY "Allow user registration" ON users FOR INSERT WITH CHECK (true);

-- Company members can view their company
CREATE POLICY "Company members can view company" ON companies FOR SELECT 
USING (id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- Users can only access processes they're associated with
CREATE POLICY "Users can view associated processes" ON judicial_processes FOR SELECT 
USING (id IN (SELECT process_id FROM user_processes WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their process associations" ON user_processes FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can view activities of their processes" ON process_activities FOR SELECT 
USING (process_id IN (SELECT process_id FROM user_processes WHERE user_id = auth.uid()));

CREATE POLICY "Users can view documents of their processes" ON process_documents FOR SELECT 
USING (process_id IN (SELECT process_id FROM user_processes WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their consultation history" ON consultation_history FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can view their notifications" ON notifications FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications" ON notifications FOR UPDATE 
USING (user_id = auth.uid());

-- PUBLIC ACCESS POLICIES (for judicial consultation system)
-- Allow public read access to non-private processes
CREATE POLICY "Public access to non-private processes" ON judicial_processes FOR SELECT 
USING (es_privado = false OR es_privado IS NULL);

-- Allow public read access to activities of non-private processes
CREATE POLICY "Public access to activities of non-private processes" ON process_activities FOR SELECT 
USING (process_id IN (SELECT id FROM judicial_processes WHERE es_privado = false OR es_privado IS NULL));

-- Allow public read access to subjects of non-private processes
CREATE POLICY "Public access to subjects of non-private processes" ON process_subjects FOR SELECT 
USING (process_id IN (SELECT id FROM judicial_processes WHERE es_privado = false OR es_privado IS NULL));

-- Allow public read access to documents of non-private processes
CREATE POLICY "Public access to documents of non-private processes" ON process_documents FOR SELECT 
USING (is_public = true AND process_id IN (SELECT id FROM judicial_processes WHERE es_privado = false OR es_privado IS NULL));

-- Allow service role to insert/update processes (for scraping)
CREATE POLICY "Service role can manage processes" ON judicial_processes FOR ALL 
USING (true);

CREATE POLICY "Service role can manage activities" ON process_activities FOR ALL 
USING (true);

CREATE POLICY "Service role can manage subjects" ON process_subjects FOR ALL 
USING (true);

CREATE POLICY "Service role can manage documents" ON process_documents FOR ALL 
USING (true);

-- Allow logging consultations (both authenticated and anonymous)
CREATE POLICY "Allow consultation logging" ON consultation_history FOR INSERT 
WITH CHECK (true);

-- Functions for common operations
CREATE OR REPLACE FUNCTION get_user_processes(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    numero_radicacion VARCHAR(100),
    despacho VARCHAR(200),
    tipo_proceso VARCHAR(100),
    fecha_inicio DATE,
    ultima_actualizacion TIMESTAMP WITH TIME ZONE,
    estado VARCHAR(50),
    es_favorito BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        jp.id,
        jp.numero_radicacion,
        jp.despacho,
        jp.tipo_proceso,
        jp.fecha_inicio,
        jp.updated_at as ultima_actualizacion,
        jp.estado,
        COALESCE((uf.process_id IS NOT NULL), false) as es_favorito
    FROM judicial_processes jp
    LEFT JOIN user_favorites uf ON jp.id = uf.process_id AND uf.user_id = user_uuid
    WHERE jp.id IN (
        SELECT DISTINCT process_id 
        FROM process_subjects 
        WHERE LOWER(nombre) LIKE '%' || LOWER(COALESCE((SELECT email FROM auth.users WHERE id = user_uuid), '')) || '%'
           OR LOWER(documento) = LOWER(COALESCE((SELECT raw_user_meta_data->>'document' FROM auth.users WHERE id = user_uuid), ''))
    )
    ORDER BY jp.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_process_statistics(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_processes', COUNT(*),
        'active_processes', COUNT(*) FILTER (WHERE jp.estado = 'Activo'),
        'recent_updates', COUNT(*) FILTER (WHERE jp.updated_at > NOW() - INTERVAL '7 days'),
        'private_processes', COUNT(*) FILTER (WHERE jp.es_privado = true)
    ) INTO result
    FROM judicial_processes jp
    INNER JOIN user_processes up ON jp.id = up.process_id
    WHERE up.user_id = user_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;