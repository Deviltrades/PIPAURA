-- Fix forex_events table to store all necessary calendar data
-- Run this in your Supabase SQL Editor

-- Add missing columns for calendar display
ALTER TABLE forex_events 
ADD COLUMN IF NOT EXISTS event_date DATE,
ADD COLUMN IF NOT EXISTS event_time TIME,
ADD COLUMN IF NOT EXISTS currency VARCHAR(3),
ADD COLUMN IF NOT EXISTS previous TEXT;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_forex_events_date ON forex_events (event_date DESC);
CREATE INDEX IF NOT EXISTS idx_forex_events_currency ON forex_events (currency);
CREATE INDEX IF NOT EXISTS idx_forex_events_impact ON forex_events (impact);

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
