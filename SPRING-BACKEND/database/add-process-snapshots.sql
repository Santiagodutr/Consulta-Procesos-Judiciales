-- Script to rebuild notifications and process_snapshots tables
-- Run after the base schema has been applied

DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS process_snapshots CASCADE;

CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    process_id UUID,
    type notification_type NOT NULL DEFAULT 'in_app',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = current_schema()
          AND tablename = 'notifications'
          AND policyname = 'Users can view their notifications'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can view their notifications" ON notifications '
              || 'FOR SELECT USING (user_id = auth.uid())';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = current_schema()
          AND tablename = 'notifications'
          AND policyname = 'Users can update their notifications'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can update their notifications" ON notifications '
              || 'FOR UPDATE USING (user_id = auth.uid())';
    END IF;
END $$;

CREATE TABLE process_snapshots (
    process_number VARCHAR(50) PRIMARY KEY,
    process_id VARCHAR(100),
    last_activity_date VARCHAR(50),
    last_decision_date VARCHAR(50),
    last_status VARCHAR(100),
    summary TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_process_snapshots_last_activity_date
    ON process_snapshots(last_activity_date);

ALTER TABLE process_snapshots ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = current_schema()
          AND tablename = 'process_snapshots'
          AND policyname = 'Allow backend access'
    ) THEN
        EXECUTE 'CREATE POLICY "Allow backend access" ON process_snapshots '
              || 'FOR ALL USING (auth.role() = ''service_role'')';
    END IF;
END $$;
