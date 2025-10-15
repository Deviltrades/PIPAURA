-- Emotional Logs Table for Trading Psychology Tracking
-- Run this SQL in your Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- Create emotional_logs table
CREATE TABLE IF NOT EXISTS emotional_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  log_date date NOT NULL DEFAULT current_date,
  mood integer NOT NULL CHECK (mood BETWEEN 1 AND 10),
  energy integer NOT NULL CHECK (energy BETWEEN 1 AND 10),
  tags text[],
  note text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_user_date UNIQUE(user_id, log_date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_emotional_logs_user ON emotional_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_emotional_logs_date ON emotional_logs(log_date DESC);
CREATE INDEX IF NOT EXISTS idx_emotional_logs_user_date ON emotional_logs(user_id, log_date DESC);

-- Enable RLS
ALTER TABLE emotional_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own emotional logs" ON emotional_logs;
DROP POLICY IF EXISTS "Users can insert their own emotional logs" ON emotional_logs;
DROP POLICY IF EXISTS "Users can update their own emotional logs" ON emotional_logs;

-- Allow users to view only their own logs
CREATE POLICY "Users can view their own emotional logs" ON emotional_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to insert their own logs
CREATE POLICY "Users can insert their own emotional logs" ON emotional_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own logs
CREATE POLICY "Users can update their own emotional logs" ON emotional_logs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Success message
SELECT 'Emotional logs table created successfully!' as message;
