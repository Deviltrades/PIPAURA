-- Create market_drivers table for automated fundamental market analysis
-- Run this in your Supabase SQL Editor: Dashboard → SQL Editor → New Query

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
