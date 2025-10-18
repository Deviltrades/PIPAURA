-- Create emotional_logs table (allows multiple logs per day)
CREATE TABLE IF NOT EXISTS emotional_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  log_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 10),
  energy INTEGER NOT NULL CHECK (energy >= 1 AND mood <= 10),
  tags TEXT[],
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries by user and date
CREATE INDEX IF NOT EXISTS idx_emotional_logs_user_date ON emotional_logs(user_id, log_date DESC);

-- Create index for user-specific queries
CREATE INDEX IF NOT EXISTS idx_emotional_logs_user ON emotional_logs(user_id);

-- NOTE: No unique constraint on (user_id, log_date) to allow multiple logs per day
