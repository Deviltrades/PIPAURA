-- Complete Supabase Database Migration for TJ - Traders Brotherhood
-- This script creates all necessary tables with proper RLS policies

-- Create additional enums
DO $$ BEGIN
    CREATE TYPE account_type AS ENUM ('live', 'prop');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE plan_type AS ENUM ('demo', 'basic', 'premium');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE session AS ENUM ('LONDON', 'NYC', 'TOKYO', 'SYDNEY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tag_category AS ENUM ('timeframe', 'strategy', 'session', 'custom');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE journal_status AS ENUM ('OPEN', 'CLOSED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create user_profiles table
DROP TABLE IF EXISTS user_profiles CASCADE;
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  email TEXT NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  profile_image_url TEXT,
  account_type account_type DEFAULT 'live',
  timezone TEXT DEFAULT 'UTC',
  broker TEXT,
  preferences JSONB DEFAULT '{}',
  dashboard_widgets TEXT[],
  dashboard_layout JSONB,
  dashboard_templates JSONB,
  calendar_settings JSONB,
  sidebar_settings JSONB,
  plan_type plan_type DEFAULT 'demo',
  storage_used_mb INTEGER DEFAULT 0,
  storage_limit_mb INTEGER DEFAULT 0,
  image_count INTEGER DEFAULT 0,
  image_limit INTEGER DEFAULT 0,
  account_limit INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = supabase_user_id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = supabase_user_id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = supabase_user_id)
  WITH CHECK (auth.uid() = supabase_user_id);

CREATE POLICY "Users can delete their own profile" ON user_profiles
  FOR DELETE USING (auth.uid() = supabase_user_id);

-- Create journal_entries table
DROP TABLE IF EXISTS journal_entries CASCADE;
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  notes TEXT NOT NULL,
  trade_data JSONB,
  image_url TEXT,
  trade_date TEXT NOT NULL,
  pair_symbol TEXT NOT NULL,
  lot_size DECIMAL,
  entry_price DECIMAL,
  exit_price DECIMAL,
  stop_loss DECIMAL,
  take_profit DECIMAL,
  profit_loss DECIMAL,
  trade_type trade_type,
  status journal_status DEFAULT 'OPEN',
  tags TEXT[] DEFAULT '{}',
  timeframe TEXT,
  strategy TEXT,
  session session,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on journal_entries
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for journal_entries
CREATE POLICY "Users can view their own journal entries" ON journal_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own journal entries" ON journal_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journal entries" ON journal_entries
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journal entries" ON journal_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Create tags table
DROP TABLE IF EXISTS tags CASCADE;
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  category tag_category,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on tags
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tags
CREATE POLICY "Users can view their own tags" ON tags
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tags" ON tags
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags" ON tags
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags" ON tags
  FOR DELETE USING (auth.uid() = user_id);

-- Create media table
DROP TABLE IF EXISTS media CASCADE;
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id UUID REFERENCES journal_entries(id) NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on media (access controlled through journal_entries)
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for media
CREATE POLICY "Users can view media from their journal entries" ON media
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM journal_entries 
      WHERE journal_entries.id = media.journal_entry_id 
      AND journal_entries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert media for their journal entries" ON media
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM journal_entries 
      WHERE journal_entries.id = media.journal_entry_id 
      AND journal_entries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update media from their journal entries" ON media
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM journal_entries 
      WHERE journal_entries.id = media.journal_entry_id 
      AND journal_entries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete media from their journal entries" ON media
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM journal_entries 
      WHERE journal_entries.id = media.journal_entry_id 
      AND journal_entries.user_id = auth.uid()
    )
  );

-- Create updated_at triggers for all tables
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_user_profiles_supabase_user_id ON user_profiles(supabase_user_id);
CREATE INDEX idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX idx_journal_entries_created_at ON journal_entries(created_at DESC);
CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE INDEX idx_media_journal_entry_id ON media(journal_entry_id);

-- Create storage bucket for trade attachments (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('trade-attachments', 'trade-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for trade attachments
CREATE POLICY "Users can upload their own attachments" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'trade-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own attachments" ON storage.objects
  FOR SELECT USING (bucket_id = 'trade-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own attachments" ON storage.objects
  FOR DELETE USING (bucket_id = 'trade-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Function to automatically create user profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    supabase_user_id,
    email,
    first_name,
    last_name,
    plan_type,
    storage_limit_mb,
    image_limit,
    account_limit
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    'demo',
    100, -- 100MB storage limit for demo users
    10,  -- 10 images limit for demo users  
    1    -- 1 account limit for demo users
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();