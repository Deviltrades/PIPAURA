-- ============================================================================
-- PipAura Plan-Based Limits: Supabase RLS Policies (FIXED TYPE CASTING)
-- ============================================================================

-- ============================================================================
-- PART 1: Enable RLS on critical tables
-- ============================================================================

ALTER TABLE trade_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 2: Helper function to count user's manual accounts
-- ============================================================================

CREATE OR REPLACE FUNCTION count_manual_accounts(p_user_profile_id TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  manual_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO manual_count
  FROM trade_accounts
  WHERE user_id = p_user_profile_id
    AND source = 'manual';
  
  RETURN manual_count;
END;
$$;

-- ============================================================================
-- PART 3: RLS Policy for trade_accounts SELECT
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own accounts" ON trade_accounts;

CREATE POLICY "Users can view own accounts"
ON trade_accounts
FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM user_profiles 
    WHERE supabase_user_id = auth.uid()::text
  )
);

-- ============================================================================
-- PART 4: RLS Policy for trade_accounts INSERT (PLAN LIMIT ENFORCEMENT)
-- ============================================================================

DROP POLICY IF EXISTS "Enforce account creation limits by plan" ON trade_accounts;

CREATE POLICY "Enforce account creation limits by plan"
ON trade_accounts
FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM user_profiles 
    WHERE supabase_user_id = auth.uid()::text
  )
  AND
  (
    source = 'myfxbook'
    OR
    (
      source = 'manual' 
      AND
      (
        SELECT 
          CASE up.plan_type
            WHEN 'lite' THEN 
              count_manual_accounts(up.id) < 1
            WHEN 'core' THEN 
              count_manual_accounts(up.id) < 10
            WHEN 'elite' THEN 
              true
            ELSE 
              false
          END
        FROM user_profiles up
        WHERE up.supabase_user_id = auth.uid()::text
      )
    )
  )
);

-- ============================================================================
-- PART 5: RLS Policy for trade_accounts UPDATE
-- ============================================================================

DROP POLICY IF EXISTS "Users can update own accounts" ON trade_accounts;

CREATE POLICY "Users can update own accounts"
ON trade_accounts
FOR UPDATE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM user_profiles 
    WHERE supabase_user_id = auth.uid()::text
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM user_profiles 
    WHERE supabase_user_id = auth.uid()::text
  )
  AND source = (SELECT source FROM trade_accounts WHERE id = trade_accounts.id)
);

-- ============================================================================
-- PART 6: RLS Policy for trade_accounts DELETE
-- ============================================================================

DROP POLICY IF EXISTS "Users can delete own accounts" ON trade_accounts;

CREATE POLICY "Users can delete own accounts"
ON trade_accounts
FOR DELETE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM user_profiles 
    WHERE supabase_user_id = auth.uid()::text
  )
);

-- ============================================================================
-- PART 7: RLS Policies for user_profiles
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;

CREATE POLICY "Users can view own profile"
ON user_profiles
FOR SELECT
TO authenticated
USING (supabase_user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

CREATE POLICY "Users can update own profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (supabase_user_id = auth.uid()::text)
WITH CHECK (
  supabase_user_id = auth.uid()::text
  AND plan_type = (SELECT plan_type FROM user_profiles WHERE supabase_user_id = auth.uid()::text)
  AND storage_limit_mb = (SELECT storage_limit_mb FROM user_profiles WHERE supabase_user_id = auth.uid()::text)
  AND account_limit = (SELECT account_limit FROM user_profiles WHERE supabase_user_id = auth.uid()::text)
);

-- ============================================================================
-- PART 8: Database constraint to prevent source spoofing
-- ============================================================================

DROP TRIGGER IF EXISTS enforce_source_immutability ON trade_accounts;
DROP FUNCTION IF EXISTS prevent_source_modification();

CREATE OR REPLACE FUNCTION prevent_source_modification()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.source IS DISTINCT FROM NEW.source THEN
    RAISE EXCEPTION 'Cannot modify account source after creation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_source_immutability
BEFORE UPDATE ON trade_accounts
FOR EACH ROW
EXECUTE FUNCTION prevent_source_modification();

-- ============================================================================
-- PART 9: Verification Queries
-- ============================================================================

-- Test 1: Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('trade_accounts', 'user_profiles');

-- Test 2: List all RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename IN ('trade_accounts', 'user_profiles');

-- Test 3: Verify helper functions exist
SELECT proname FROM pg_proc WHERE proname IN ('count_manual_accounts', 'prevent_source_modification');

-- ============================================================================
-- SUCCESS! You should see:
-- - rowsecurity = true for both tables
-- - 7 RLS policies created
-- - 2 helper functions created
-- ============================================================================
