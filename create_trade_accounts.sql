-- Create trade_accounts table for multi-account management
-- Run this in your Supabase SQL Editor

-- Create enum for account types
DO $$ BEGIN
  CREATE TYPE account_type_enum AS ENUM ('demo', 'proprietary', 'live');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create enum for market types
DO $$ BEGIN
  CREATE TYPE market_type_enum AS ENUM ('forex', 'futures', 'stocks', 'crypto');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create trade_accounts table
CREATE TABLE IF NOT EXISTS trade_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_type account_type_enum NOT NULL,
  market_type market_type_enum NOT NULL,
  broker_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  starting_balance NUMERIC(12,2) NOT NULL,
  current_balance NUMERIC(12,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add account_id to trades table (NOT NULL to enforce every trade must have an account)
ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS account_id UUID NOT NULL REFERENCES trade_accounts(id) ON DELETE RESTRICT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_trades_account_id ON trades (account_id);
CREATE INDEX IF NOT EXISTS idx_trade_accounts_user_id ON trade_accounts (user_id);

-- Enable RLS on trade_accounts
ALTER TABLE trade_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trade_accounts
DROP POLICY IF EXISTS "Users can view own accounts" ON trade_accounts;
CREATE POLICY "Users can view own accounts"
ON trade_accounts FOR SELECT
USING (
  user_id IN (
    SELECT id FROM user_profiles WHERE supabase_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can insert own accounts" ON trade_accounts;
CREATE POLICY "Users can insert own accounts"
ON trade_accounts FOR INSERT
WITH CHECK (
  user_id IN (
    SELECT id FROM user_profiles WHERE supabase_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update own accounts" ON trade_accounts;
CREATE POLICY "Users can update own accounts"
ON trade_accounts FOR UPDATE
USING (
  user_id IN (
    SELECT id FROM user_profiles WHERE supabase_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete own accounts" ON trade_accounts;
CREATE POLICY "Users can delete own accounts"
ON trade_accounts FOR DELETE
USING (
  user_id IN (
    SELECT id FROM user_profiles WHERE supabase_user_id = auth.uid()
  )
);

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
