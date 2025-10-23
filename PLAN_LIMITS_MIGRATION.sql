-- ============================================================================
-- PipAura Plan-Based Limits: Supabase Migration SQL
-- ============================================================================
-- 
-- This migration adds the 'source' field to trade_accounts to track whether
-- accounts were created manually or via MyFxBook sync.
-- 
-- **IMPORTANT**: Run this SQL directly in your Supabase SQL Editor
-- ============================================================================

-- Step 1: Create the account_source enum type
CREATE TYPE account_source AS ENUM ('manual', 'myfxbook');

-- Step 2: Add the source column to trade_accounts table
-- All existing accounts will default to 'manual'
ALTER TABLE trade_accounts 
ADD COLUMN source account_source NOT NULL DEFAULT 'manual';

-- Step 3: Create index for faster queries on source field
CREATE INDEX idx_trade_accounts_source ON trade_accounts(source);
CREATE INDEX idx_trade_accounts_user_source ON trade_accounts(user_id, source);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify the column was added successfully
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'trade_accounts' 
  AND column_name = 'source';

-- Check existing accounts (should all be 'manual' initially)
SELECT 
  COUNT(*) as total_accounts,
  COUNT(CASE WHEN source = 'manual' THEN 1 END) as manual_accounts,
  COUNT(CASE WHEN source = 'myfxbook' THEN 1 END) as myfxbook_accounts
FROM trade_accounts;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- After running this migration:
-- 
-- 1. All existing accounts will be marked as 'manual'
-- 2. New manual accounts will default to 'manual'
-- 3. MyFxBook-synced accounts will be marked as 'myfxbook' by the backend code
-- 4. Plan limits enforce:
--    - Lite: 1 manual account, unlimited MyFxBook
--    - Core: 10 manual accounts, unlimited MyFxBook  
--    - Elite: Unlimited both
-- 
-- ============================================================================
