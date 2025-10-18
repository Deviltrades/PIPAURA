-- Drop the unique constraint on (user_id, log_date) to allow multiple logs per day
-- This constraint prevents users from logging multiple emotional states on the same day

-- Check if the constraint exists and drop it
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_user_date' 
        AND table_name = 'emotional_logs'
    ) THEN
        ALTER TABLE emotional_logs DROP CONSTRAINT unique_user_date;
        RAISE NOTICE 'Constraint unique_user_date dropped successfully';
    ELSE
        RAISE NOTICE 'Constraint unique_user_date does not exist';
    END IF;
END $$;

-- Also check for any other similar unique constraints
DO $$ 
BEGIN
    -- Drop constraint if it has a different name but same pattern
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE t.relname = 'emotional_logs'
        AND c.contype = 'u'
        AND array_length(c.conkey, 1) = 2
    ) THEN
        EXECUTE (
            SELECT 'ALTER TABLE emotional_logs DROP CONSTRAINT ' || conname || ';'
            FROM pg_constraint c
            JOIN pg_class t ON c.conrelid = t.oid
            WHERE t.relname = 'emotional_logs'
            AND c.contype = 'u'
            AND array_length(c.conkey, 1) = 2
            LIMIT 1
        );
        RAISE NOTICE 'Found and dropped unique constraint on emotional_logs';
    END IF;
END $$;

-- Verify the table structure
SELECT 
    conname AS constraint_name,
    contype AS constraint_type
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'emotional_logs'
ORDER BY conname;
