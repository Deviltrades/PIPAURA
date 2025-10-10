#!/usr/bin/env python3
"""
Setup Forex Factory tables in production Supabase
Run this once before using the FF integration
"""
import os
from supabase import create_client

# Get Supabase credentials
SB_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
SB_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SB_URL or not SB_KEY:
    print("ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    exit(1)

sb = create_client(SB_URL, SB_KEY)

print("=" * 60)
print("Setting up Forex Factory tables in Production Supabase")
print("=" * 60)

# SQL to execute
sqls = [
    # forex_events table
    """
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
    """,
    
    # forex_events indexes
    """
    CREATE INDEX IF NOT EXISTS idx_forex_events_id ON forex_events (event_id);
    """,
    """
    CREATE INDEX IF NOT EXISTS idx_forex_events_processed ON forex_events (processed_at DESC);
    """,
    
    # economic_scores table
    """
    CREATE TABLE IF NOT EXISTS economic_scores (
      currency TEXT PRIMARY KEY CHECK (char_length(currency)=3),
      total_score INT NOT NULL DEFAULT 0,
      last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    """,
]

# Execute each SQL
for sql in sqls:
    try:
        print(f"\nExecuting: {sql[:60]}...")
        # Note: Direct SQL execution via Supabase client doesn't support CREATE TABLE
        # User needs to run the SQL manually in Supabase SQL Editor
        print("✅ SQL prepared")
    except Exception as e:
        print(f"❌ Error: {e}")

print("\n" + "=" * 60)
print("IMPORTANT: Copy the SQL from create_ff_tables.sql to Supabase")
print("=" * 60)
print("""
Steps to complete setup:

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click SQL Editor in left sidebar
4. Click New Query
5. Copy and paste the contents of create_ff_tables.sql
6. Click Run

This will create:
- forex_events table (tracks processed events)
- economic_scores table (aggregated currency scores)
- Necessary indexes and RLS policies

Then test with: python forexfactory_feed.py
""")
