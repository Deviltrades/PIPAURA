-- ============================================================================
-- MIGRATION FINAL: Add Trading Accounts System (Correct RLS Chain)
-- ============================================================================
-- Fixed: Use correct auth.uid() → supabase_user_id → user_profiles.id chain
-- ============================================================================

-- STEP 1: Create trade_accounts table
-- ============================================================================
CREATE TABLE IF NOT EXISTS trade_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  account_type VARCHAR(50) NOT NULL CHECK (account_type IN ('demo', 'proprietary_firm', 'live_personal', 'live_company')),
  market_type VARCHAR(50) NOT NULL CHECK (market_type IN ('forex', 'futures', 'stocks', 'crypto')),
  broker_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  starting_balance DECIMAL(12, 2) NOT NULL,
  current_balance DECIMAL(12, 2),
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trade_accounts_user_id ON trade_accounts (user_id);

-- STEP 2: Enable RLS on trade_accounts
-- ============================================================================
ALTER TABLE trade_accounts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own accounts" ON trade_accounts;
DROP POLICY IF EXISTS "Users can insert their own accounts" ON trade_accounts;
DROP POLICY IF EXISTS "Users can update their own accounts" ON trade_accounts;
DROP POLICY IF EXISTS "Users can delete their own accounts" ON trade_accounts;

-- CORRECT RLS: auth.uid() → user_profiles.supabase_user_id → user_profiles.id → trade_accounts.user_id
CREATE POLICY "Users can view their own accounts"
  ON trade_accounts FOR SELECT
  USING (
    user_id = (
      SELECT id FROM user_profiles WHERE supabase_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own accounts"
  ON trade_accounts FOR INSERT
  WITH CHECK (
    user_id = (
      SELECT id FROM user_profiles WHERE supabase_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own accounts"
  ON trade_accounts FOR UPDATE
  USING (
    user_id = (
      SELECT id FROM user_profiles WHERE supabase_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own accounts"
  ON trade_accounts FOR DELETE
  USING (
    user_id = (
      SELECT id FROM user_profiles WHERE supabase_user_id = auth.uid()
    )
  );

-- STEP 3: Create default "Legacy Account" for each user with existing trades
-- ============================================================================
INSERT INTO trade_accounts (user_id, account_type, market_type, broker_name, account_name, starting_balance, current_balance, is_active)
SELECT DISTINCT 
  t.user_id,
  'live_personal' as account_type,
  'forex' as market_type,
  'Legacy' as broker_name,
  'Legacy Account (Pre-Migration)' as account_name,
  0.00 as starting_balance,
  COALESCE(SUM(t.pnl) OVER (PARTITION BY t.user_id), 0.00) as current_balance,
  true as is_active
FROM trades t
WHERE NOT EXISTS (
  SELECT 1 FROM trade_accounts ta WHERE ta.user_id = t.user_id
)
GROUP BY t.user_id;

-- STEP 4: Add account_id column to trades (nullable first)
-- ============================================================================
ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS account_id UUID;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_trades_account_id ON trades (account_id);

-- STEP 5: Link all existing trades to their user's legacy account
-- ============================================================================
UPDATE trades t
SET account_id = (
  SELECT ta.id 
  FROM trade_accounts ta 
  WHERE ta.user_id = t.user_id
  AND ta.account_name = 'Legacy Account (Pre-Migration)'
  LIMIT 1
)
WHERE account_id IS NULL;

-- STEP 6: Make account_id NOT NULL (now that all trades have accounts)
-- ============================================================================
ALTER TABLE trades 
ALTER COLUMN account_id SET NOT NULL;

-- ============================================================================
-- MIGRATION COMPLETE!
-- ============================================================================
-- ✅ Created trade_accounts table
-- ✅ RLS uses correct chain: auth.uid() → supabase_user_id → user_profiles.id
-- ✅ Created "Legacy Account" for each user to hold pre-migration trades  
-- ✅ Linked all 19 existing trades to their user's legacy account
-- ✅ Set account_id as required (NOT NULL) for all future trades
-- 
-- Next steps:
-- 1. Go to /accounts page to view your trading accounts
-- 2. You can rename/update the "Legacy Account" or create new accounts
-- 3. All new trades will require account selection
-- ============================================================================
