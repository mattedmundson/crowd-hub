-- Drop all existing policies
DROP POLICY IF EXISTS "Users can read own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can read all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON user_roles;

-- Disable RLS temporarily
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- Create a simple stored procedure for getting user role without RLS issues
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
DECLARE
  current_role TEXT;
BEGIN
  SELECT role INTO current_role
  FROM user_roles
  WHERE user_id = auth.uid();
  
  RETURN COALESCE(current_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if current user is admin
CREATE OR REPLACE FUNCTION current_user_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT get_current_user_role() = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create simple policies that don't cause recursion
CREATE POLICY "Users can read own role" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- For now, let's allow all authenticated users to read roles to avoid recursion
-- We'll handle admin-only access in the application layer
CREATE POLICY "Authenticated users can read roles" ON user_roles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only allow updates/inserts through stored procedures
CREATE POLICY "No direct updates" ON user_roles
  FOR UPDATE USING (false);

CREATE POLICY "No direct inserts" ON user_roles
  FOR INSERT WITH CHECK (false);

-- Create secure functions for role management
CREATE OR REPLACE FUNCTION update_user_role(target_user_id UUID, new_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if current user is admin
  IF NOT current_user_is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  -- Validate role
  IF new_role NOT IN ('user', 'contributor', 'editor', 'admin') THEN
    RAISE EXCEPTION 'Invalid role specified.';
  END IF;
  
  -- Update or insert role
  INSERT INTO user_roles (user_id, role)
  VALUES (target_user_id, new_role)
  ON CONFLICT (user_id)
  DO UPDATE SET role = new_role, updated_at = NOW();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;