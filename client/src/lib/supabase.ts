import { createClient } from '@supabase/supabase-js';

// For now, we'll use the Supabase URL and key directly
// In production, these would come from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pnfmcizedhryvwrvotf.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuZm1jaXplZGhyeXZ3cnZvdGYiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNzU1MTI4MywiZXhwIjoyMDUzMTI3MjgzfQ.p2RJiS5sjdKJQbDzTfXJLTdPQHZcYpnE9T0lTYaVNjA';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to get current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Helper function to get auth token
export const getAuthToken = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
};