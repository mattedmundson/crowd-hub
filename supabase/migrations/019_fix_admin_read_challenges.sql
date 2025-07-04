-- Fix RLS policies to allow admins to read all challenges (active and inactive)
-- Regular users can only read active challenges

-- Drop existing policies
DROP POLICY IF EXISTS "Allow admins to manage challenges" ON challenges;
DROP POLICY IF EXISTS "Allow users to read challenges" ON challenges;

-- Create new policies
-- Allow admins full access to ALL challenges (active and inactive)
CREATE POLICY "Allow admins to manage challenges" ON challenges
FOR ALL
TO authenticated
USING (
  current_user_is_admin()
)
WITH CHECK (
  current_user_is_admin()
);

-- Allow regular users to read only active challenges
CREATE POLICY "Allow users to read active challenges" ON challenges
FOR SELECT
TO authenticated
USING (
  NOT current_user_is_admin() AND is_active = true
);

-- Allow admins to read all challenges (active and inactive)
CREATE POLICY "Allow admins to read all challenges" ON challenges
FOR SELECT
TO authenticated
USING (
  current_user_is_admin()
);