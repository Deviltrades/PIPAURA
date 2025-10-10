-- Create forex_events table to track processed events
CREATE TABLE IF NOT EXISTS forex_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  country TEXT NOT NULL,
  title TEXT NOT NULL,
  impact TEXT NOT NULL,
  actual TEXT,
  forecast TEXT,
  score FLOAT NOT NULL DEFAULT 0,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forex_events_id ON forex_events (event_id);
CREATE INDEX IF NOT EXISTS idx_forex_events_processed ON forex_events (processed_at DESC);

-- Create economic_scores table for aggregated currency scores
CREATE TABLE IF NOT EXISTS economic_scores (
  currency TEXT PRIMARY KEY CHECK (char_length(currency)=3),
  total_score INT NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE forex_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE economic_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Public read, service role write)
DROP POLICY IF EXISTS "Public read access to forex_events" ON forex_events;
CREATE POLICY "Public read access to forex_events"
ON forex_events FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Service role write to forex_events" ON forex_events;
CREATE POLICY "Service role write to forex_events"
ON forex_events FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read access to economic_scores" ON economic_scores;
CREATE POLICY "Public read access to economic_scores"
ON economic_scores FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Service role write to economic_scores" ON economic_scores;
CREATE POLICY "Service role write to economic_scores"
ON economic_scores FOR ALL TO public USING (true) WITH CHECK (true);
