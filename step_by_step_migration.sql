-- ============================================================================
-- STEP-BY-STEP MIGRATION (Run Each Section One at a Time)
-- ============================================================================

-- ====== STEP 1: Create table (NO RLS YET) ======
CREATE TABLE IF NOT EXISTS trade_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  account_type VARCHAR(50) NOT NULL,
  market_type VARCHAR(50) NOT NULL,
  broker_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  starting_balance DECIMAL(12, 2) NOT NULL,
  current_balance DECIMAL(12, 2),
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====== STEP 2: Add check constraints ======
ALTER TABLE trade_accounts DROP CONSTRAINT IF EXISTS trade_accounts_account_type_check;
ALTER TABLE trade_accounts ADD CONSTRAINT trade_accounts_account_type_check 
  CHECK (account_type IN ('demo', 'proprietary_firm', 'live_personal', 'live_company'));

ALTER TABLE trade_accounts DROP CONSTRAINT IF EXISTS trade_accounts_market_type_check;
ALTER TABLE trade_accounts ADD CONSTRAINT trade_accounts_market_type_check 
  CHECK (market_type IN ('forex', 'futures', 'stocks', 'crypto'));

-- ====== STEP 3: Create indexes ======
CREATE INDEX IF NOT EXISTS idx_trade_accounts_user_id ON trade_accounts (user_id);

-- ====== STEP 4: Insert legacy account (SIMPLE VERSION) ======
-- First, get distinct user_ids from trades
INSERT INTO trade_accounts (user_id, account_type, market_type, broker_name, account_name, starting_balance, current_balance, is_active)
SELECT 
  user_id,
  'live_personal',
  'forex',
  'Legacy',
  'Legacy Account (Pre-Migration)',
  0.00,
  0.00,
  true
FROM trades
WHERE user_id NOT IN (SELECT user_id FROM trade_accounts)
GROUP BY user_id;

-- ====== STEP 5: Add account_id to trades ======
ALTER TABLE trades ADD COLUMN IF NOT EXISTS account_id UUID;
CREATE INDEX IF NOT EXISTS idx_trades_account_id ON trades (account_id);

-- ====== STEP 6: Link trades to accounts ======
UPDATE trades 
SET account_id = (
  SELECT id FROM trade_accounts 
  WHERE trade_accounts.user_id = trades.user_id 
  LIMIT 1
)
WHERE account_id IS NULL;

-- ====== STEP 7: Make account_id required ======
ALTER TABLE trades ALTER COLUMN account_id SET NOT NULL;

-- ====== STEP 8: Enable RLS ======
ALTER TABLE trade_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own accounts" ON trade_accounts;
CREATE POLICY "Users can view their own accounts"
  ON trade_accounts FOR SELECT
  USING (
    user_id::TEXT = (SELECT id::TEXT FROM user_profiles WHERE supabase_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert their own accounts" ON trade_accounts;
CREATE POLICY "Users can insert their own accounts"
  ON trade_accounts FOR INSERT
  WITH CHECK (
    user_id::TEXT = (SELECT id::TEXT FROM user_profiles WHERE supabase_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update their own accounts" ON trade_accounts;
CREATE POLICY "Users can update their own accounts"
  ON trade_accounts FOR UPDATE
  USING (
    user_id::TEXT = (SELECT id::TEXT FROM user_profiles WHERE supabase_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete their own accounts" ON trade_accounts;
CREATE POLICY "Users can delete their own accounts"
  ON trade_accounts FOR DELETE
  USING (
    user_id::TEXT = (SELECT id::TEXT FROM user_profiles WHERE supabase_user_id = auth.uid())
  );

-- ============================================================================
-- DONE! Your accounts system is ready.
-- ============================================================================
