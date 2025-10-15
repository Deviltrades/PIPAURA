-- Supabase Tables for Automated Fundamental Bias System
-- Run this SQL in your Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- 1. Forex Events Table (economic calendar)
CREATE TABLE IF NOT EXISTS forex_events (
  id SERIAL PRIMARY KEY,
  event_id VARCHAR(255) UNIQUE NOT NULL,
  country VARCHAR(10),
  currency VARCHAR(10),
  title TEXT,
  impact VARCHAR(20),
  actual VARCHAR(50),
  forecast VARCHAR(50),
  previous VARCHAR(50),
  event_date VARCHAR(50),
  event_time VARCHAR(50),
  score NUMERIC DEFAULT 0,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Economic Scores Table (aggregated by currency)
CREATE TABLE IF NOT EXISTS economic_scores (
  id SERIAL PRIMARY KEY,
  currency VARCHAR(10) UNIQUE NOT NULL,
  total_score NUMERIC DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Currency Scores Table (full breakdown)
CREATE TABLE IF NOT EXISTS currency_scores (
  id SERIAL PRIMARY KEY,
  window_start TIMESTAMP WITH TIME ZONE,
  window_end TIMESTAMP WITH TIME ZONE,
  currency VARCHAR(10),
  data_score NUMERIC DEFAULT 0,
  cb_tone_score NUMERIC DEFAULT 0,
  commodity_score NUMERIC DEFAULT 0,
  sentiment_score NUMERIC DEFAULT 0,
  market_score NUMERIC DEFAULT 0,
  total_score NUMERIC DEFAULT 0,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Fundamental Bias Table (FX pairs)
CREATE TABLE IF NOT EXISTS fundamental_bias (
  id SERIAL PRIMARY KEY,
  pair VARCHAR(20) UNIQUE NOT NULL,
  base_currency VARCHAR(10),
  quote_currency VARCHAR(10),
  base_score NUMERIC DEFAULT 0,
  quote_score NUMERIC DEFAULT 0,
  total_bias NUMERIC DEFAULT 0,
  bias_text VARCHAR(50),
  summary TEXT,
  confidence INTEGER DEFAULT 50,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Index Bias Table (stock indices)
CREATE TABLE IF NOT EXISTS index_bias (
  id SERIAL PRIMARY KEY,
  instrument VARCHAR(20) UNIQUE NOT NULL,
  score NUMERIC DEFAULT 0,
  bias_text VARCHAR(50),
  summary TEXT,
  confidence INTEGER DEFAULT 50,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Market News Table (Finnhub news integration)
CREATE TABLE IF NOT EXISTS market_news (
  id SERIAL PRIMARY KEY,
  headline TEXT NOT NULL,
  summary TEXT,
  source TEXT,
  category TEXT,
  datetime BIGINT NOT NULL,
  url TEXT,
  image TEXT,
  related TEXT,
  impact_level VARCHAR(20) DEFAULT 'low',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(headline, datetime)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_forex_events_currency ON forex_events(currency);
CREATE INDEX IF NOT EXISTS idx_forex_events_processed ON forex_events(processed_at);
CREATE INDEX IF NOT EXISTS idx_currency_scores_currency ON currency_scores(currency);
CREATE INDEX IF NOT EXISTS idx_fundamental_bias_pair ON fundamental_bias(pair);
CREATE INDEX IF NOT EXISTS idx_index_bias_instrument ON index_bias(instrument);
CREATE INDEX IF NOT EXISTS idx_market_news_datetime ON market_news(datetime DESC);
CREATE INDEX IF NOT EXISTS idx_market_news_category ON market_news(category);
CREATE INDEX IF NOT EXISTS idx_market_news_impact ON market_news(impact_level);

-- **CRITICAL: RLS Policies for public read access**
ALTER TABLE market_news ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for market news" ON market_news;
DROP POLICY IF EXISTS "Service role full access for market news" ON market_news;

-- Allow anyone to read news (no authentication required)
CREATE POLICY "Public read access for market news" ON market_news
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Service role has full access (for cron jobs)
CREATE POLICY "Service role full access for market news" ON market_news
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Success message
SELECT 'Cron database tables created successfully!' as message;
