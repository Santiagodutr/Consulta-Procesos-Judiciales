-- Fix consultation_history table and policies
-- Run this script in Supabase SQL Editor

-- 1. Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view their consultation history" ON consultation_history;
DROP POLICY IF EXISTS "Allow consultation logging" ON consultation_history;

-- 2. Ensure RLS is enabled
ALTER TABLE consultation_history ENABLE ROW LEVEL SECURITY;

-- 3. Create policy for users to view their own history
CREATE POLICY "Users can view their consultation history" 
ON consultation_history 
FOR SELECT 
USING (auth.uid() = user_id);

-- 4. Create policy to allow ALL insertions (authenticated and anonymous)
-- This is crucial - it allows service role and authenticated users to insert
CREATE POLICY "Allow consultation logging" 
ON consultation_history 
FOR INSERT 
WITH CHECK (true);

-- 5. Verify the table structure allows NULL user_id
ALTER TABLE consultation_history 
ALTER COLUMN user_id DROP NOT NULL;

-- 6. Add index if not exists
CREATE INDEX IF NOT EXISTS idx_consultation_history_user_id 
ON consultation_history(user_id);

CREATE INDEX IF NOT EXISTS idx_consultation_history_created_at 
ON consultation_history(created_at DESC);

-- 7. Test insert (this should work)
-- Replace with actual UUIDs from your database
DO $$
DECLARE
    test_user_id UUID;
    test_process_id UUID;
BEGIN
    -- Get a real user_id (or use NULL for anonymous)
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    -- Get a real process_id
    SELECT id INTO test_process_id FROM judicial_processes LIMIT 1;
    
    -- Test insert
    IF test_process_id IS NOT NULL THEN
        INSERT INTO consultation_history (
            user_id,
            process_id,
            consultation_type,
            ip_address,
            user_agent,
            result_status,
            created_at
        ) VALUES (
            test_user_id, -- Can be NULL for anonymous
            test_process_id,
            'test',
            '127.0.0.1',
            'Test Agent',
            'success',
            NOW()
        );
        
        RAISE NOTICE 'Test insert successful!';
    ELSE
        RAISE NOTICE 'No processes found to test with';
    END IF;
END $$;

-- 8. Verify the test insert worked
SELECT 
    COUNT(*) as total_consultations,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT process_id) as unique_processes
FROM consultation_history;

-- 9. Show recent consultations
SELECT 
    id,
    user_id,
    process_id,
    consultation_type,
    result_status,
    created_at
FROM consultation_history 
ORDER BY created_at DESC 
LIMIT 10;

COMMIT;
