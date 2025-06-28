-- Create a version of get_all_users_with_roles that works with your specific admin user
CREATE OR REPLACE FUNCTION get_all_users_with_roles()
RETURNS TABLE (
  id UUID,
  email TEXT,
  created_at TIMESTAMPTZ,
  role TEXT
) AS $$
BEGIN
  -- Check if current user is admin OR if it's your specific admin user
  IF (auth.uid() IS NULL OR 
      NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')) AND
      auth.uid() != 'b16b8fe8-1ae7-449e-89d6-3d286294afd2' THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT 
    au.id,
    au.email::TEXT,
    au.created_at,
    COALESCE(ur.role, 'user') as role
  FROM auth.users au
  LEFT JOIN user_roles ur ON au.id = ur.user_id
  ORDER BY au.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the role update function to handle your admin user specifically
CREATE OR REPLACE FUNCTION update_user_role(target_user_id UUID, new_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  -- Get current user's role
  SELECT role INTO current_user_role
  FROM user_roles
  WHERE user_id = auth.uid();
  
  -- Check if current user is admin OR if it's your specific admin user
  IF (COALESCE(current_user_role, 'user') != 'admin' AND 
      auth.uid() != 'b16b8fe8-1ae7-449e-89d6-3d286294afd2') THEN
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

-- Update get_current_user_role to handle your specific case
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
DECLARE
  current_role TEXT;
BEGIN
  -- If it's your admin user, return admin directly
  IF auth.uid() = 'b16b8fe8-1ae7-449e-89d6-3d286294afd2' THEN
    RETURN 'admin';
  END IF;
  
  SELECT role INTO current_role
  FROM user_roles
  WHERE user_id = auth.uid();
  
  RETURN COALESCE(current_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;