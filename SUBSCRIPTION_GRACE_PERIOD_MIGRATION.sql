-- ============================================================================
-- PipAura Subscription Grace Period: Supabase Migration SQL
-- ============================================================================
--
-- This migration adds subscription status tracking to handle cancelations
-- with grace periods (users keep access until current_period_end).
--
-- **IMPORTANT**: Run this SQL directly in your Supabase SQL Editor
-- ============================================================================

-- Step 1: Create the subscription_status enum type
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'expired', 'past_due', 'trialing');

-- Step 2: Add subscription tracking columns to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN subscription_status subscription_status DEFAULT 'active',
ADD COLUMN current_period_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN stripe_customer_id TEXT,
ADD COLUMN stripe_subscription_id TEXT;

-- Step 3: Create indexes for faster queries
CREATE INDEX idx_user_profiles_subscription_status ON user_profiles(subscription_status);
CREATE INDEX idx_user_profiles_stripe_customer ON user_profiles(stripe_customer_id);
CREATE INDEX idx_user_profiles_period_end ON user_profiles(current_period_end);

-- Step 4: Set existing users to 'active' status
UPDATE user_profiles 
SET subscription_status = 'active'
WHERE subscription_status IS NULL;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify the columns were added successfully
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND column_name IN ('subscription_status', 'current_period_end', 'stripe_customer_id', 'stripe_subscription_id');

-- Check existing users (should all be 'active' initially)
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN subscription_status = 'active' THEN 1 END) as active_users,
  COUNT(CASE WHEN subscription_status = 'canceled' THEN 1 END) as canceled_users,
  COUNT(CASE WHEN subscription_status = 'expired' THEN 1 END) as expired_users
FROM user_profiles;

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- After running this migration:
--
-- 1. All existing users will have subscription_status = 'active'
-- 2. When users cancel:
--    - subscription_status → 'canceled'
--    - plan_type → KEPT AS-IS (for analytics)
--    - current_period_end → KEPT (shows when access expires)
--    - They retain full access until current_period_end
--
-- 3. After current_period_end passes:
--    - Frontend checks if subscription expired
--    - Shows grace period expiration message
--    - Locks dashboard with "Renew to continue" prompt
--
-- 4. Data retention:
--    - ALL user data kept (trades, journal, stats)
--    - Only access is restricted, data never deleted
--    - Complies with professional SaaS standards
--
-- ============================================================================
