-- ============================================================================
-- PHASE 1: Create Table and Add Column (No NOT NULL requirement yet)
-- ============================================================================

-- Create trade_accounts table
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

-- Enable RLS
ALTER TABLE trade_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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

-- Add account_id to trades (NULLABLE - we'll make it required after you create accounts)
ALTER TABLE trades ADD COLUMN IF NOT EXISTS account_id UUID;
CREATE INDEX IF NOT EXISTS idx_trades_account_id ON trades (account_id);

-- ============================================================================
-- DONE! Now follow these steps:
-- ============================================================================
-- 1. Go to your app at /accounts
-- 2. Click "Add Account" to create your first trading account
-- 3. The app will automatically link your existing trades to that account
-- 4. Later we can make account_id NOT NULL after all trades are linked
-- ============================================================================
