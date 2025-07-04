-- Enable RLS on challenges and challenge_prompts tables
-- This fixes the security warnings from Supabase linter

-- Enable RLS on challenges table
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- Enable RLS on challenge_prompts table  
ALTER TABLE public.challenge_prompts ENABLE ROW LEVEL SECURITY;