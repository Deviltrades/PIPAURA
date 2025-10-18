# Supabase Database Migration Guide

## Plan Type Migration: demo/basic/premium → lite/core/elite

### What This Migration Does
This migration updates your Supabase database to use the new membership tier names:
- **Old tiers**: demo, basic, premium
- **New tiers**: lite, core, elite

### Data Mapping Strategy
- `demo` → `lite` (free tier becomes lite)
- `basic` → `lite` (basic becomes lite)
- `premium` → `elite` (premium becomes elite)

**Note**: We don't map to `core` automatically because there's no direct equivalent in the old system. Users can be manually upgraded to `core` if needed.

### How to Run This Migration

#### Option 1: Supabase SQL Editor (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **"New Query"**
4. Copy and paste the contents of `001_migrate_plan_types_to_lite_core_elite.sql`
5. Click **"Run"** to execute the migration
6. Check the verification query results at the bottom

#### Option 2: Command Line (If you have direct access)
```bash
psql $SUPABASE_DATABASE_URL -f migrations/001_migrate_plan_types_to_lite_core_elite.sql
```

### Verification
After running the migration, you should see:
- The `user_profiles` table now uses the new enum values
- All existing users are mapped to their new plan types
- The verification query shows the count of users per plan type

### Rollback (If Needed)
If you need to rollback, you'll need to reverse the process:
1. Create a new enum with old values (demo/basic/premium)
2. Map data back (lite→demo, core→basic, elite→premium)
3. Drop new enum and restore old one

**Important**: Make a backup of your database before running this migration!

### New Plan Limits
After migration, the new tiers have these limits:
- **Lite**: 1GB storage, 1 account
- **Core**: 2GB storage, 10 accounts
- **Elite**: 10GB storage, unlimited accounts

Make sure to communicate these changes to your users!
