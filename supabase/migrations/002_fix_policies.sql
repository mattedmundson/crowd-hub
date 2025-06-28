-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Users can read own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can read all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON user_roles;

-- Create non-recursive policies
-- Policy: Users can read their own role
CREATE POLICY "Users can read own role" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Admins can read all roles (using function to avoid recursion)
CREATE POLICY "Admins can read all roles" ON user_roles
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  );

-- Policy: Admins can update all roles (using function to avoid recursion)
CREATE POLICY "Admins can update all roles" ON user_roles
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  );

-- Policy: Admins can insert roles (using function to avoid recursion)
CREATE POLICY "Admins can insert roles" ON user_roles
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  );

-- Alternative approach: Create a security definer function to check admin status
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM user_roles
  WHERE user_id = auth.uid();
  
  RETURN COALESCE(user_role = 'admin', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the problematic policies and create simpler ones
DROP POLICY IF EXISTS "Admins can read all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON user_roles;

-- Create new policies using the function
CREATE POLICY "Admins can read all roles" ON user_roles
  FOR SELECT USING (is_admin() OR auth.uid() = user_id);

CREATE POLICY "Admins can update all roles" ON user_roles
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can insert roles" ON user_roles
  FOR INSERT WITH CHECK (is_admin());