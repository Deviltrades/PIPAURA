-- ============================================================================
-- FINAL SIMPLE MIGRATION - No Complex Queries, Just Direct Inserts
-- ============================================================================

-- Step 1: Create trade_accounts table
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

CREATE INDEX IF NOT EXISTS idx_trade_accounts_user_id ON trade_accounts (user_id);

-- Step 2: Enable RLS
ALTER TABLE trade_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own accounts" ON trade_accounts;
CREATE POLICY "Users can view their own accounts"
  ON trade_accounts FOR SELECT
  USING (user_id::TEXT = (SELECT id::TEXT FROM user_profiles WHERE supabase_user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own accounts" ON trade_accounts;
CREATE POLICY "Users can insert their own accounts"
  ON trade_accounts FOR INSERT
  WITH CHECK (user_id::TEXT = (SELECT id::TEXT FROM user_profiles WHERE supabase_user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update their own accounts" ON trade_accounts;
CREATE POLICY "Users can update their own accounts"
  ON trade_accounts FOR UPDATE
  USING (user_id::TEXT = (SELECT id::TEXT FROM user_profiles WHERE supabase_user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own accounts" ON trade_accounts;
CREATE POLICY "Users can delete their own accounts"
  ON trade_accounts FOR DELETE
  USING (user_id::TEXT = (SELECT id::TEXT FROM user_profiles WHERE supabase_user_id = auth.uid()));

-- Step 3: Insert YOUR legacy account (hardcoded your user_id - no queries!)
INSERT INTO trade_accounts (user_id, account_type, market_type, broker_name, account_name, starting_balance, current_balance, is_active)
VALUES ('bb86e68d-8243-43fa-937b-45b2124cb63c', 'live_personal', 'forex', 'Legacy', 'Legacy Account (Pre-Migration)', 0.00, 0.00, true)
ON CONFLICT DO NOTHING;

-- Step 4: Add account_id column to trades
ALTER TABLE trades ADD COLUMN IF NOT EXISTS account_id UUID;
CREATE INDEX IF NOT EXISTS idx_trades_account_id ON trades (account_id);

-- Step 5: Link YOUR trades to YOUR legacy account (direct comparison, no subqueries!)
UPDATE trades 
SET account_id = (SELECT id FROM trade_accounts WHERE user_id = 'bb86e68d-8243-43fa-937b-45b2124cb63c' LIMIT 1)
WHERE user_id = 'bb86e68d-8243-43fa-937b-45b2124cb63c' AND account_id IS NULL;

-- Step 6: Make account_id required
ALTER TABLE trades ALTER COLUMN account_id SET NOT NULL;

-- ============================================================================
-- DONE! All 19 trades now linked to "Legacy Account (Pre-Migration)"
-- Go to /accounts page to see it and create new accounts!
-- ============================================================================
