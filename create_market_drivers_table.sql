-- Create market_drivers table for Key Fundamental Drivers analysis
CREATE TABLE IF NOT EXISTS market_drivers (
  driver TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  impact TEXT NOT NULL,
  description TEXT,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default drivers
INSERT INTO market_drivers (driver, status, impact, description) VALUES
  ('Fed Rate Policy', 'Neutral', 'High', 'Federal Reserve monetary policy stance'),
  ('Global Growth', 'Neutral', 'Medium', 'Global economic growth outlook'),
  ('Inflation Trends', 'Neutral', 'High', 'Inflation trajectory and expectations'),
  ('Geopolitical Risk', 'Neutral', 'Medium', 'Global political and conflict risks'),
  ('Oil Prices', 'Neutral', 'Medium', 'Energy market dynamics')
ON CONFLICT (driver) DO NOTHING;

-- Enable RLS
ALTER TABLE market_drivers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Public read access to market_drivers" ON market_drivers;
CREATE POLICY "Public read access to market_drivers"
ON market_drivers FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Service role write to market_drivers" ON market_drivers;
CREATE POLICY "Service role write to market_drivers"
ON market_drivers FOR ALL TO public USING (true) WITH CHECK (true);
