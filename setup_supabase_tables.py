#!/usr/bin/env python3
"""
Setup script to create currency_scores and fundamental_bias tables in production Supabase.
Run this once before the main automation script.
"""
import os
from supabase import create_client

# Get Supabase credentials
SB_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
SB_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SB_URL or not SB_KEY:
    print("ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    exit(1)

# Connect using service role key (has full admin access)
sb = create_client(SB_URL, SB_KEY)

# SQL to create tables
CREATE_CURRENCY_SCORES = """
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
"""

CREATE_CURRENCY_SCORES_INDEX = """
CREATE INDEX IF NOT EXISTS idx_currency_scores_window
ON currency_scores (currency, window_end DESC);
"""

CREATE_FUNDAMENTAL_BIAS = """
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
"""

CREATE_FUNDAMENTAL_BIAS_INDEX = """
CREATE INDEX IF NOT EXISTS idx_fundamental_bias_pair ON fundamental_bias (pair);
"""

# Enable RLS
ENABLE_RLS_CURRENCY = "ALTER TABLE currency_scores ENABLE ROW LEVEL SECURITY;"
ENABLE_RLS_BIAS = "ALTER TABLE fundamental_bias ENABLE ROW LEVEL SECURITY;"

# RLS Policies - Allow public read on fundamental_bias, service role has full access
RLS_POLICY_BIAS_READ = """
CREATE POLICY IF NOT EXISTS "Public read access to fundamental_bias"
ON fundamental_bias FOR SELECT TO public USING (true);
"""

RLS_POLICY_BIAS_WRITE = """
CREATE POLICY IF NOT EXISTS "Service role write to fundamental_bias"  
ON fundamental_bias FOR ALL TO public USING (true) WITH CHECK (true);
"""

RLS_POLICY_CURRENCY = """
CREATE POLICY IF NOT EXISTS "Service role access to currency_scores"
ON currency_scores FOR ALL TO public USING (true) WITH CHECK (true);
"""

# Execute SQL via Supabase RPC (if available) or direct SQL
try:
    print("Creating tables in Supabase...")
    
    # Use postgrest to execute SQL
    response = sb.rpc('exec_sql', {'sql': CREATE_CURRENCY_SCORES}).execute()
    print("✓ Created currency_scores table")
    
    response = sb.rpc('exec_sql', {'sql': CREATE_CURRENCY_SCORES_INDEX}).execute()
    print("✓ Created currency_scores index")
    
    response = sb.rpc('exec_sql', {'sql': CREATE_FUNDAMENTAL_BIAS}).execute()
    print("✓ Created fundamental_bias table")
    
    response = sb.rpc('exec_sql', {'sql': CREATE_FUNDAMENTAL_BIAS_INDEX}).execute()
    print("✓ Created fundamental_bias index")
    
    response = sb.rpc('exec_sql', {'sql': ENABLE_RLS_CURRENCY}).execute()
    response = sb.rpc('exec_sql', {'sql': ENABLE_RLS_BIAS}).execute()
    print("✓ Enabled RLS")
    
    response = sb.rpc('exec_sql', {'sql': RLS_POLICY_BIAS_READ}).execute()
    response = sb.rpc('exec_sql', {'sql': RLS_POLICY_BIAS_WRITE}).execute()
    response = sb.rpc('exec_sql', {'sql': RLS_POLICY_CURRENCY}).execute()
    print("✓ Created RLS policies")
    
    print("\n✅ Supabase setup complete!")
    
except Exception as e:
    print(f"\n⚠️ RPC method not available. You need to run this SQL manually in Supabase SQL Editor:\n")
    print("=" * 60)
    print(CREATE_CURRENCY_SCORES)
    print(CREATE_CURRENCY_SCORES_INDEX)
    print(CREATE_FUNDAMENTAL_BIAS)
    print(CREATE_FUNDAMENTAL_BIAS_INDEX)
    print(ENABLE_RLS_CURRENCY)
    print(ENABLE_RLS_BIAS)
    print(RLS_POLICY_BIAS_READ)
    print(RLS_POLICY_BIAS_WRITE)
    print(RLS_POLICY_CURRENCY)
    print("=" * 60)
    print(f"\nError: {e}")
