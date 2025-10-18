-- Migration: Update plan_type enum from demo/basic/premium to lite/core/elite
-- Run this in your Supabase SQL Editor

-- Step 1: Create new enum type with updated values
CREATE TYPE plan_type_new AS ENUM ('lite', 'core', 'elite');

-- Step 2: Add a temporary column with the new enum type
ALTER TABLE user_profiles 
ADD COLUMN plan_type_new plan_type_new;

-- Step 3: Migrate existing data
-- Map old values to new values:
-- demo -> lite (closest match for free/basic tier)
-- basic -> lite (renamed to lite)
-- premium -> elite (premium users get elite tier)
UPDATE user_profiles
SET plan_type_new = CASE
  WHEN plan_type = 'demo' THEN 'lite'::plan_type_new
  WHEN plan_type = 'basic' THEN 'lite'::plan_type_new
  WHEN plan_type = 'premium' THEN 'elite'::plan_type_new
  ELSE 'lite'::plan_type_new  -- Default fallback
END;

-- Step 4: Drop the old column
ALTER TABLE user_profiles DROP COLUMN plan_type;

-- Step 5: Rename the new column to the original name
ALTER TABLE user_profiles RENAME COLUMN plan_type_new TO plan_type;

-- Step 6: Set the default value
ALTER TABLE user_profiles ALTER COLUMN plan_type SET DEFAULT 'lite'::plan_type_new;

-- Step 7: Drop the old enum type
DROP TYPE plan_type;

-- Step 8: Rename the new enum type to the original name
ALTER TYPE plan_type_new RENAME TO plan_type;

-- Verification query - check the updated values
SELECT plan_type, COUNT(*) as user_count
FROM user_profiles
GROUP BY plan_type
ORDER BY plan_type;
