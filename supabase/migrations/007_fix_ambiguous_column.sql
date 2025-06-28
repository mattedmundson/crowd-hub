-- Fix the ambiguous column reference in get_all_users_with_roles
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
      NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND user_roles.role = 'admin')) AND
      auth.uid() != 'b16b8fe8-1ae7-449e-89d6-3d286294afd2' THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT 
    au.id,
    au.email::TEXT,
    au.created_at,
    COALESCE(ur.role, 'user')::TEXT as user_role
  FROM auth.users au
  LEFT JOIN user_roles ur ON au.id = ur.user_id
  ORDER BY au.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;