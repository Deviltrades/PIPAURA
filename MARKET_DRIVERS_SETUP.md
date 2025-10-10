# Market Drivers Real-Time Analysis Setup Guide

## Overview
This guide sets up automated real-time market driver analysis that updates hourly alongside the fundamental bias system. The system analyzes 5 key market drivers and displays them on the Fundamentals page.

## Features
- **5 Key Drivers**: Fed Rate Policy, Global Growth, Inflation Trends, Geopolitical Risk, Oil Prices
- **Real-Time Analysis**: Automated updates every 30 minutes via hourly_update.py
- **Data-Driven**: Uses currency scores, index bias, and market data
- **Frontend Integration**: Live display on Fundamentals page with color-coded status badges

---

## Setup Instructions

### Step 1: Create Table in Production Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]
2. Navigate to **SQL Editor** (left sidebar)
3. Click **+ New Query**
4. Paste and run the following SQL:

```sql
-- Create market_drivers table for automated fundamental market analysis
CREATE TABLE IF NOT EXISTS market_drivers (
  driver VARCHAR(100) PRIMARY KEY,
  status VARCHAR(100) NOT NULL,
  impact VARCHAR(20) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default drivers with initial values
INSERT INTO market_drivers (driver, status, impact, updated_at) VALUES
  ('Fed Rate Policy', 'Hawkish Pause', 'High', NOW()),
  ('Global Growth', 'Slowing', 'Medium', NOW()),
  ('Inflation Trends', 'Cooling', 'High', NOW()),
  ('Geopolitical Risk', 'Elevated', 'Medium', NOW()),
  ('Oil Prices', 'Stable', 'Medium', NOW())
ON CONFLICT (driver) DO UPDATE 
SET status = EXCLUDED.status, 
    impact = EXCLUDED.impact,
    updated_at = EXCLUDED.updated_at;

-- Enable Row Level Security (RLS)
ALTER TABLE market_drivers ENABLE ROW LEVEL SECURITY;

-- Public read access (no authentication required)
CREATE POLICY "market_drivers_read_policy" ON market_drivers
  FOR SELECT USING (true);

-- Public write access (will be used by automation scripts with service role)
CREATE POLICY "market_drivers_write_policy" ON market_drivers
  FOR ALL USING (true);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
```

5. Click **Run** to execute the SQL
6. Verify the table was created successfully

### Step 2: Verify Integration

The market drivers analysis is already integrated into the automation system:

1. **hourly_update.py** - Calls `update_drivers()` every 30 minutes/hourly
2. **update_market_drivers.py** - Analyzes data and updates driver statuses
3. **Fundamentals page** - Displays live driver data with color-coded badges

### Step 3: Test the System

1. The automation will automatically update drivers on the next cycle
2. Visit the Fundamentals page to see the "Key Fundamental Drivers" card
3. Data updates every 30 minutes during trading hours (6-22 UTC, Mon-Fri)

---

## How It Works

### Analysis Logic

Each driver is analyzed based on specific market data:

1. **Fed Rate Policy**
   - Data: USD currency score, central bank tone
   - Status: Hawkish, Dovish, Hawkish Pause, Dovish Pause, Neutral
   - Impact: Always High

2. **Global Growth**
   - Data: Major indices (US500, EU50, UK100, JP225)
   - Status: Expanding, Moderate, Contracting, Slowing, Neutral
   - Impact: High if |avg_score| > 2, else Medium

3. **Inflation Trends**
   - Data: USD/EUR/GBP data scores, Gold (XAU) total score
   - Status: Rising, Elevated, Deflating, Cooling, Stable
   - Impact: High if significant movement, else Medium

4. **Geopolitical Risk**
   - Data: Safe-haven assets (JPY, CHF, XAU)
   - Status: Extreme, Elevated, Moderate, Low
   - Impact: High if elevated, else Medium

5. **Oil Prices**
   - Data: CAD commodity score
   - Status: Rising, Elevated, Falling, Declining, Stable
   - Impact: High if |score| > 10, else Medium

### Frontend Display

The Fundamentals page shows drivers with:
- **Driver name**: e.g., "Fed Rate Policy"
- **Status**: Current market condition
- **Impact badge**: High (red) or Medium (gray)
- **Real-time updates**: via React Query

---

## Troubleshooting

### Table Not Found Error
If you see "Could not find the table 'public.market_drivers' in the schema cache":
1. Run `NOTIFY pgrst, 'reload schema';` in Supabase SQL Editor
2. Wait 1-2 minutes for cache refresh
3. Restart the application if needed

### No Data Showing
1. Check if hourly_update.py has run at least once
2. Verify the automation is running via cron-job.org or Replit Cron
3. Manually run: `python update_market_drivers.py` to populate data

### Column Errors
Ensure your Python scripts use the correct column names:
- `currency_scores`: `data_score`, `cb_tone_score`, `total_score`
- `index_bias`: `score` (not `bias_score`)
- `market_drivers`: `driver`, `status`, `impact`, `updated_at`

---

## Files Reference

- `create_market_drivers_table.sql` - Table creation SQL
- `update_market_drivers.py` - Analysis and update logic
- `hourly_update.py` - Calls driver updates in automation cycle
- `client/src/pages/fundamentals.tsx` - Frontend display
- `client/src/lib/supabase-service.ts` - Service function `getMarketDrivers()`

---

## Production Notes

- **Service Role Key**: update_market_drivers.py uses SUPABASE_SERVICE_ROLE_KEY for writes
- **RLS Policies**: Public read, service role write
- **Update Frequency**: Every 30 minutes (trading hours) + hourly safety net
- **Data Dependencies**: Requires currency_scores and index_bias tables to exist
