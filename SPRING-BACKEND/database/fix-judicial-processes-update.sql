-- Fix judicial_processes table to ensure proper upsert behavior
-- This script ensures that:
-- 1. updated_at is ALWAYS updated on every modification
-- 2. created_at is only set on INSERT, not UPDATE
-- 3. Proper triggers for automatic timestamp management

-- Drop existing trigger if exists (but don't drop the function, it's shared)
DROP TRIGGER IF EXISTS update_judicial_processes_updated_at ON judicial_processes;

-- The function update_updated_at_column() already exists and is used by other tables
-- We just need to create the trigger for judicial_processes

-- Create trigger that fires BEFORE UPDATE
CREATE TRIGGER update_judicial_processes_updated_at
    BEFORE UPDATE ON judicial_processes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Ensure created_at has a default value (should already exist)
ALTER TABLE judicial_processes 
    ALTER COLUMN created_at SET DEFAULT NOW();

-- Ensure updated_at has a default value (should already exist)
ALTER TABLE judicial_processes 
    ALTER COLUMN updated_at SET DEFAULT NOW();

-- Verify the table structure
SELECT 
    column_name,
    column_default,
    is_nullable,
    data_type
FROM information_schema.columns
WHERE table_name = 'judicial_processes'
    AND column_name IN ('id', 'numero_radicacion', 'created_at', 'updated_at')
ORDER BY ordinal_position;

-- Test the trigger by updating a process
-- This will show that updated_at changes automatically
DO $$
DECLARE
    test_process_id UUID;
    old_updated_at TIMESTAMP;
    new_updated_at TIMESTAMP;
BEGIN
    -- Get a random process
    SELECT id, updated_at INTO test_process_id, old_updated_at
    FROM judicial_processes
    LIMIT 1;
    
    IF test_process_id IS NOT NULL THEN
        -- Wait 1 second to ensure different timestamp
        PERFORM pg_sleep(1);
        
        -- Update the process
        UPDATE judicial_processes
        SET despacho = despacho  -- Dummy update
        WHERE id = test_process_id;
        
        -- Get new updated_at
        SELECT updated_at INTO new_updated_at
        FROM judicial_processes
        WHERE id = test_process_id;
        
        -- Report results
        RAISE NOTICE 'Trigger test results:';
        RAISE NOTICE '  Process ID: %', test_process_id;
        RAISE NOTICE '  Old updated_at: %', old_updated_at;
        RAISE NOTICE '  New updated_at: %', new_updated_at;
        RAISE NOTICE '  Trigger working: %', (new_updated_at > old_updated_at);
    ELSE
        RAISE NOTICE 'No processes found to test trigger';
    END IF;
END $$;

-- Show summary of all processes
SELECT 
    COUNT(*) as total_processes,
    COUNT(DISTINCT numero_radicacion) as unique_processes,
    MIN(created_at) as oldest_process,
    MAX(updated_at) as most_recent_update
FROM judicial_processes;
