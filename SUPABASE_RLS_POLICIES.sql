-- ============================================================================
-- PipAura Plan-Based Limits: Supabase RLS Policies (SECURITY CRITICAL)
-- ============================================================================
--
-- This SQL adds Row-Level Security policies to enforce plan limits at the
-- DATABASE level, preventing client-side bypass exploits.
--
-- **CRITICAL**: These policies are MANDATORY for security - without them,
-- users can bypass all limits by calling the Supabase API directly.
--
-- **RUN THIS IN SUPABASE SQL EDITOR BEFORE DEPLOYMENT**
-- ============================================================================

-- ============================================================================
-- PART 1: Enable RLS on critical tables
-- ============================================================================

ALTER TABLE trade_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 2: Helper function to get user's plan limits
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_plan_limits(p_user_id UUID)
RETURNS TABLE (
  plan_type TEXT,
  manual_account_limit INTEGER,
  storage_limit_mb INTEGER,
  storage_used_mb INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.plan_type::TEXT,
    up.account_limit,
    up.storage_limit_mb,
    up.storage_used_mb
  FROM user_profiles up
  WHERE up.supabase_user_id = p_user_id;
END;
$$;

-- ============================================================================
-- PART 3: Function to count user's manual accounts
-- ============================================================================

CREATE OR REPLACE FUNCTION count_manual_accounts(p_user_profile_id UUID)
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
-- PART 4: RLS Policy for trade_accounts SELECT
-- ============================================================================

-- Users can only see their own accounts
CREATE POLICY "Users can view own accounts"
ON trade_accounts
FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM user_profiles 
    WHERE supabase_user_id = auth.uid()
  )
);

-- ============================================================================
-- PART 5: RLS Policy for trade_accounts INSERT (PLAN LIMIT ENFORCEMENT)
-- ============================================================================

CREATE POLICY "Enforce account creation limits by plan"
ON trade_accounts
FOR INSERT
TO authenticated
WITH CHECK (
  -- Verify user owns this account
  user_id IN (
    SELECT id FROM user_profiles 
    WHERE supabase_user_id = auth.uid()
  )
  AND
  (
    -- MyFxBook accounts are ALWAYS allowed (unlimited)
    source = 'myfxbook'
    OR
    -- For MANUAL accounts, enforce plan-based limits
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
              true  -- unlimited
            ELSE 
              false  -- unknown plan, deny
          END
        FROM user_profiles up
        WHERE up.supabase_user_id = auth.uid()
      )
    )
  )
);

-- ============================================================================
-- PART 6: RLS Policy for trade_accounts UPDATE
-- ============================================================================

CREATE POLICY "Users can update own accounts"
ON trade_accounts
FOR UPDATE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM user_profiles 
    WHERE supabase_user_id = auth.uid()
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM user_profiles 
    WHERE supabase_user_id = auth.uid()
  )
  -- Prevent changing source field after creation (anti-exploit)
  AND source = (SELECT source FROM trade_accounts WHERE id = trade_accounts.id)
);

-- ============================================================================
-- PART 7: RLS Policy for trade_accounts DELETE
-- ============================================================================

CREATE POLICY "Users can delete own accounts"
ON trade_accounts
FOR DELETE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM user_profiles 
    WHERE supabase_user_id = auth.uid()
  )
);

-- ============================================================================
-- PART 8: RLS Policies for user_profiles
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON user_profiles
FOR SELECT
TO authenticated
USING (supabase_user_id = auth.uid());

-- Users can update their own profile (except plan_type and limits)
CREATE POLICY "Users can update own profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (supabase_user_id = auth.uid())
WITH CHECK (
  supabase_user_id = auth.uid()
  -- Prevent users from changing their own plan or limits
  AND plan_type = (SELECT plan_type FROM user_profiles WHERE supabase_user_id = auth.uid())
  AND storage_limit_mb = (SELECT storage_limit_mb FROM user_profiles WHERE supabase_user_id = auth.uid())
  AND account_limit = (SELECT account_limit FROM user_profiles WHERE supabase_user_id = auth.uid())
);

-- ============================================================================
-- PART 9: Database constraint to prevent source spoofing
-- ============================================================================

-- Add CHECK constraint to ensure source is immutable after creation
-- Note: This is enforced via RLS UPDATE policy above, but adding a trigger
-- provides defense-in-depth

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
-- PART 10: Verification Queries
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
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname IN ('get_user_plan_limits', 'count_manual_accounts', 'prevent_source_modification');

-- ============================================================================
-- NOTES FOR DEPLOYMENT
-- ============================================================================
--
-- After running this SQL:
--
-- 1. ✅ Users can only see/modify their own accounts
-- 2. ✅ Manual account creation enforced by plan (Lite: 1, Core: 10, Elite: unlimited)
-- 3. ✅ MyFxBook accounts bypass all limits
-- 4. ✅ Users CANNOT change source field after creation (anti-exploit)
-- 5. ✅ Users CANNOT modify their own plan_type or limits
-- 6. ✅ All enforcement happens server-side (database level)
--
-- CRITICAL: Without these policies, users can bypass all limits by calling
-- the Supabase API directly. These policies are MANDATORY for production.
--
-- ============================================================================
-- TESTING THE POLICIES
-- ============================================================================
--
-- Test as a Lite user (should be blocked at 2nd manual account):
-- 
-- INSERT INTO trade_accounts (user_id, account_name, broker_name, account_type, market_type, starting_balance, source)
-- VALUES ((SELECT id FROM user_profiles WHERE supabase_user_id = auth.uid()), 'Test Account 2', 'Broker', 'demo', 'forex', 10000, 'manual');
-- 
-- Expected: ERROR - Policy violation
--
-- Test MyFxBook account (should always work):
--
-- INSERT INTO trade_accounts (user_id, account_name, broker_name, account_type, market_type, starting_balance, source)
-- VALUES ((SELECT id FROM user_profiles WHERE supabase_user_id = auth.uid()), 'MyFxBook Account', 'Broker', 'live_personal', 'forex', 50000, 'myfxbook');
--
-- Expected: SUCCESS (unlimited)
--
-- Test source modification (should be blocked):
--
-- UPDATE trade_accounts SET source = 'myfxbook' WHERE id = 'some-account-id';
--
-- Expected: ERROR - Cannot modify account source
--
-- ============================================================================
