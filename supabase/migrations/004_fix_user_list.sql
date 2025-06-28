-- Update the get_all_users_with_roles function to use the new non-recursive function
CREATE OR REPLACE FUNCTION get_all_users_with_roles()
RETURNS TABLE (
  id UUID,
  email TEXT,
  created_at TIMESTAMPTZ,
  role TEXT
) AS $$
BEGIN
  -- Check if current user is admin using the new function
  IF NOT current_user_is_admin() THEN
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