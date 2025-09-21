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

-- Judicial processes table
CREATE TABLE judicial_processes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    process_number VARCHAR(50) UNIQUE NOT NULL,
    court_name VARCHAR(255) NOT NULL,
    process_type VARCHAR(100) NOT NULL,
    subject_matter TEXT NOT NULL,
    plaintiff VARCHAR(255) NOT NULL,
    defendant VARCHAR(255) NOT NULL,
    status process_status DEFAULT 'active',
    start_date DATE,
    last_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    next_hearing_date TIMESTAMP WITH TIME ZONE,
    case_summary TEXT,
    portal_url TEXT,
    is_monitored BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- Process activities table
CREATE TABLE process_activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    process_id UUID REFERENCES judicial_processes(id) ON DELETE CASCADE,
    activity_type activity_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    activity_date TIMESTAMP WITH TIME ZONE NOT NULL,
    document_url TEXT,
    is_new BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Process documents table
CREATE TABLE process_documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    process_id UUID REFERENCES judicial_processes(id) ON DELETE CASCADE,
    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    uploaded_by UUID REFERENCES users(id),
    is_downloaded BOOLEAN DEFAULT false,
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
CREATE INDEX idx_judicial_processes_process_number ON judicial_processes(process_number);
CREATE INDEX idx_judicial_processes_status ON judicial_processes(status);
CREATE INDEX idx_judicial_processes_is_monitored ON judicial_processes(is_monitored);
CREATE INDEX idx_user_processes_user_id ON user_processes(user_id);
CREATE INDEX idx_user_processes_process_id ON user_processes(process_id);
CREATE INDEX idx_process_activities_process_id ON process_activities(process_id);
CREATE INDEX idx_process_activities_activity_date ON process_activities(activity_date);
CREATE INDEX idx_process_documents_process_id ON process_documents(process_id);
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

-- Functions for common operations
CREATE OR REPLACE FUNCTION get_user_processes(user_uuid UUID)
RETURNS TABLE (
    process_id UUID,
    process_number VARCHAR,
    court_name VARCHAR,
    process_type VARCHAR,
    status process_status,
    role VARCHAR,
    last_update TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        jp.id,
        jp.process_number,
        jp.court_name,
        jp.process_type,
        jp.status,
        up.role,
        jp.last_update
    FROM judicial_processes jp
    INNER JOIN user_processes up ON jp.id = up.process_id
    WHERE up.user_id = user_uuid
    ORDER BY jp.last_update DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_process_statistics(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_processes', COUNT(*),
        'active_processes', COUNT(*) FILTER (WHERE jp.status = 'active'),
        'recent_updates', COUNT(*) FILTER (WHERE jp.last_update > NOW() - INTERVAL '7 days'),
        'upcoming_hearings', COUNT(*) FILTER (WHERE jp.next_hearing_date > NOW() AND jp.next_hearing_date < NOW() + INTERVAL '30 days')
    ) INTO result
    FROM judicial_processes jp
    INNER JOIN user_processes up ON jp.id = up.process_id
    WHERE up.user_id = user_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;