-- Fix RLS policies for challenges table
-- Allow admins to create, read, update, and delete challenges

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow admins to manage challenges" ON challenges;
DROP POLICY IF EXISTS "Allow users to read challenges" ON challenges;

-- Create new policies
-- Allow admins full access to challenges
CREATE POLICY "Allow admins to manage challenges" ON challenges
FOR ALL
TO authenticated
USING (
  current_user_is_admin()
)
WITH CHECK (
  current_user_is_admin()
);

-- Allow all authenticated users to read challenges
CREATE POLICY "Allow users to read challenges" ON challenges
FOR SELECT
TO authenticated
USING (is_active = true);

-- Ensure RLS is enabled on challenges table
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;