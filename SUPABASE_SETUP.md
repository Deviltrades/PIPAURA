# Supabase Setup Instructions

## Required Supabase Configuration

### 1. Storage Bucket Setup
Create a storage bucket named `trade-images` in your Supabase dashboard:

1. Go to Storage in your Supabase dashboard
2. Create a new bucket named `trade-images`
3. Set it to **private** for security
4. Enable RLS (Row Level Security)

### 2. Database Table Setup
Execute this SQL in your Supabase SQL Editor:

```sql
-- Create trade_notes table for storing trade notes
CREATE TABLE trade_notes (
  trade_id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient user queries
CREATE INDEX trade_notes_user_id_idx ON trade_notes(user_id);

-- Enable RLS
ALTER TABLE trade_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policy - users can only access their own notes
CREATE POLICY "Users can access their own trade notes" ON trade_notes
  FOR ALL USING (user_id = auth.uid()::text);

-- Storage policies for trade-images bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('trade-images', 'trade-images', false);

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload their own images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'trade-images' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to view their own images
CREATE POLICY "Users can view their own images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'trade-images' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to delete their own images  
CREATE POLICY "Users can delete their own images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'trade-images' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

### 3. Environment Variables
Ensure these are set in your Replit secrets:
- `Project_URL_SUPABASE` - Your Supabase project URL
- `SUPABASE_API_KEY` - Your Supabase anon public key

## Migration Strategy

1. **Phase 1**: Keep existing schema, add Supabase integration for new data
2. **Phase 2**: Dual-read/write (Supabase primary, PostgreSQL fallback)
3. **Phase 3**: Optional backfill of existing data to Supabase
4. **Phase 4**: Full cutover to Supabase-only reads

This ensures zero data loss and allows for rollback at any point.