-- Market News Table with RLS Policies
-- Run this SQL in your Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- Create market_news table
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

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_market_news_datetime ON market_news(datetime DESC);
CREATE INDEX IF NOT EXISTS idx_market_news_category ON market_news(category);
CREATE INDEX IF NOT EXISTS idx_market_news_impact ON market_news(impact_level);

-- **CRITICAL: Enable RLS but allow public read access**
ALTER TABLE market_news ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
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
SELECT 'Market news table and RLS policies configured successfully!' as message;
