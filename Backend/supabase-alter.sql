-- Create the podcasts table with correct data types
CREATE TABLE IF NOT EXISTS public.podcasts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id TEXT NOT NULL, -- Using TEXT for compatibility with auth providers
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  duration INTEGER NOT NULL,
  url TEXT,
  topics TEXT[] NOT NULL DEFAULT '{}',
  host_voice TEXT NOT NULL,
  co_host_voice TEXT NOT NULL,
  language TEXT NOT NULL,
  metadata JSONB,
  transcript TEXT,
  message TEXT
);

-- Enable Row Level Security
ALTER TABLE podcasts ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to view their own podcasts
CREATE POLICY "Users can view their own podcasts" 
ON podcasts FOR SELECT 
USING (auth.uid()::text = user_id);

-- Create policy that allows users to create their own podcasts
CREATE POLICY "Users can insert their own podcasts" 
ON podcasts FOR INSERT 
WITH CHECK (auth.uid()::text = user_id);

-- Create policy that allows users to update their own podcasts
CREATE POLICY "Users can update their own podcasts" 
ON podcasts FOR UPDATE 
USING (auth.uid()::text = user_id);

-- Optional: For development/testing only - allows service role to access all records
-- Remove this in production!
CREATE POLICY "Service role access to all podcasts" 
ON podcasts 
USING (auth.role() = 'service_role');

-- Add table comment
COMMENT ON TABLE podcasts IS 'Table for storing podcast information with RLS policies for user data protection';