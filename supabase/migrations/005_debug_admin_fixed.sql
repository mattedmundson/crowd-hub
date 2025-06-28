-- Debug function to check current user's role
CREATE OR REPLACE FUNCTION debug_current_user()
RETURNS TABLE (
  user_id UUID,
  user_role TEXT,
  is_admin_check BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    auth.uid() as user_id,
    get_current_user_role() as user_role,
    current_user_is_admin() as is_admin_check;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also ensure your user has the admin role
INSERT INTO user_roles (user_id, role) 
VALUES ('b16b8fe8-1ae7-449e-89d6-3d286294afd2', 'admin') 
ON CONFLICT (user_id) 
DO UPDATE SET role = 'admin', updated_at = NOW();