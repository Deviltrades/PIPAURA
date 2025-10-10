# Weekly Fundamental Bias Automation - Setup Guide

## ✅ What's Already Done

Your Replit project is now fully configured with:

- ✅ Python automation script (`main.py`) - Ready to run
- ✅ All Python dependencies installed (requests, yfinance, python-dateutil, supabase)
- ✅ Frontend integration complete - Fundamental Strength tab displays real data
- ✅ Sample data inserted in development database for testing
- ✅ Environment variables configured

## 🚀 Quick Start (5 Minutes)

### Step 1: Create Tables in Production Supabase

1. Open your **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project: `pnfmcizehdryvvwrvotf`
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. **Copy and paste** the SQL below:

```sql
-- Create currency_scores table
CREATE TABLE IF NOT EXISTS currency_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  currency TEXT NOT NULL CHECK (char_length(currency)=3),
  data_score INT NOT NULL DEFAULT 0,
  cb_tone_score INT NOT NULL DEFAULT 0,
  commodity_score INT NOT NULL DEFAULT 0,
  sentiment_score INT NOT NULL DEFAULT 0,
  market_score INT NOT NULL DEFAULT 0,
  total_score INT NOT NULL DEFAULT 0,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_currency_scores_window
ON currency_scores (currency, window_end DESC);

-- Create fundamental_bias table
CREATE TABLE IF NOT EXISTS fundamental_bias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair TEXT NOT NULL UNIQUE,
  base_currency TEXT NOT NULL,
  quote_currency TEXT NOT NULL,
  base_score INT NOT NULL,
  quote_score INT NOT NULL,
  total_bias INT NOT NULL,
  bias_text TEXT NOT NULL,
  summary TEXT NOT NULL,
  confidence INT NOT NULL DEFAULT 50,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fundamental_bias_pair ON fundamental_bias (pair);

-- Enable Row Level Security
ALTER TABLE currency_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE fundamental_bias ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Allow public read on fundamental_bias, service role has full access)
DROP POLICY IF EXISTS "Public read access to fundamental_bias" ON fundamental_bias;
CREATE POLICY "Public read access to fundamental_bias"
ON fundamental_bias FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Service role write to fundamental_bias" ON fundamental_bias;
CREATE POLICY "Service role write to fundamental_bias"  
ON fundamental_bias FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role access to currency_scores" ON currency_scores;
CREATE POLICY "Service role access to currency_scores"
ON currency_scores FOR ALL TO public USING (true) WITH CHECK (true);
```

6. Click **Run** (or press `Cmd/Ctrl + Enter`)
7. You should see "Success. No rows returned" - **Tables are now created!** ✅

### Step 2: Test the Automation Script

Run the automation script once to populate initial data:

```bash
python main.py
```

Expected output:
- Market data downloads from yfinance (DXY, WTI, GOLD, etc.)
- Currency scores calculated
- Fundamental bias generated for 11 FX pairs
- Data written to your production Supabase ✅

### Step 3: Configure Weekly Scheduler (Optional but Recommended)

**Option A: Using Replit Scheduled Jobs** (Recommended)

1. In Replit, click **Tools** → **Scheduled Jobs**
2. Click **+ New Scheduled Job**
3. Configure:
   - **Command**: `python main.py`
   - **Schedule (cron)**: `0 0 * * 0` ← *Runs every Sunday at 00:00 UTC*
   - **Name**: "Weekly Fundamental Bias Update"
4. Click **Create**
5. Done! ✅ Automation runs weekly

**Option B: Manual Run**

You can run `python main.py` manually whenever you want to update the fundamental bias data.

### Step 4: View Results in Your App

1. Open your app: https://your-app.vercel.app
2. Navigate to **Fundamentals** page
3. Click the **"Fundamental Strength"** tab
4. You should see:
   - **FX Pair Fundamental Bias** (11 major pairs with color-coded badges)
   - **Currency Strength Scores** (8 major currencies with breakdown)
   - **Key Fundamental Drivers**

## 📊 How It Works

### Data Sources

1. **TradingEconomics API** (optional):
   - Economic calendar data (GDP, CPI, NFP, etc.)
   - Actual vs Forecast surprises
   - *Note: Works without API key, but scoring will be limited*

2. **Yahoo Finance** (free):
   - Market data: DXY, WTI, GOLD, COPPER, SPX, UST10Y
   - Weekly % changes
   - Always available ✅

### Scoring Model

Each currency gets weighted scores:

| Factor | Rule | Weight |
|--------|------|--------|
| **Economic Data** | Actual > Forecast → + ; < Forecast → − | ±1–3 |
| **Central Bank Tone** | Hawkish = +3 ; Dovish = −3 | ±3 |
| **Commodity Links** | CAD ↔ WTI ; AUD ↔ Copper/Gold ; NZD ↔ Risk | ±2 |
| **Market Flows** | DXY↑ & Yields↑ → USD + ; Risk-off → JPY/CHF + | ±2 |

### Pair Bias Calculation

For each pair (e.g., EUR/USD):
- `bias = quote_score - base_score`
- **≥ +7** → 🟢 Fundamentally Strong (green badge)
- **≤ -7** → 🔴 Fundamentally Weak (red badge)
- **else** → ⚪ Neutral (gray badge)

## 🔑 Optional: Add TradingEconomics API Key

To enable economic calendar data scoring:

1. Get API key from: https://tradingeconomics.com/api
2. In Replit, go to **Tools** → **Secrets**
3. Add new secret:
   - **Key**: `TRADING_ECONOMICS_API_KEY`
   - **Value**: `your_api_key_here`
4. The script will automatically use it next run ✅

*Without this key, the automation still works using market data only.*

## 🛠️ Troubleshooting

### Issue: "Could not find table" error

**Solution**: You haven't run the SQL in your production Supabase yet. Go to Step 1 above.

### Issue: No data showing in app

**Solutions**:
1. Run `python main.py` to populate data
2. Check browser console for errors
3. Verify tables exist in Supabase

### Issue: Authentication failed

**Solution**: Your `SUPABASE_SERVICE_ROLE_KEY` is correct (already configured ✅). If issues persist, regenerate it in Supabase dashboard.

### Issue: Python script fails

**Solutions**:
1. Check internet connection (needs to fetch market data)
2. Verify all Python packages are installed: `pip list | grep -E "requests|yfinance|supabase"`
3. Check error messages - they usually indicate the exact issue

## 📋 Files Reference

### Created Files

- **`main.py`** - Main automation script (weekly fundamental scoring)
- **`setup_supabase_tables.py`** - Helper script for table setup
- **`create_tables.sql`** - SQL for manual table creation
- **`FUNDAMENTAL_BIAS_SETUP.md`** - This guide

### Modified Files

- **`client/src/pages/fundamentals.tsx`** - Added Fundamental Strength tab with real data
- **`client/src/lib/supabase-service.ts`** - Added getFundamentalBias() and getCurrencyScores()

## 🎯 Next Steps

1. ✅ Run the SQL in your Supabase dashboard (Step 1)
2. ✅ Test the script: `python main.py`
3. ✅ Configure weekly scheduler (Step 3)
4. ✅ Check your app's Fundamental Strength tab
5. ⏳ (Optional) Add TradingEconomics API key when available

---

## 📞 Support

If you encounter issues:
1. Check this guide's Troubleshooting section
2. Review error messages carefully
3. Verify all environment variables are set
4. Ensure tables are created in production Supabase

**System Status**:
- ✅ Python automation ready
- ✅ Frontend integration complete
- ✅ Sample data working in dev
- ⏳ Waiting for production Supabase setup
