-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'contributor', 'editor', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS user_roles_role_idx ON user_roles(role);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own role
CREATE POLICY "Users can read own role" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Admins can read all roles
CREATE POLICY "Admins can read all roles" ON user_roles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admins can update all roles
CREATE POLICY "Admins can update all roles" ON user_roles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admins can insert roles
CREATE POLICY "Admins can insert roles" ON user_roles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Function to automatically create user role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM user_roles 
    WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all users with roles (admin only)
CREATE OR REPLACE FUNCTION get_all_users_with_roles()
RETURNS TABLE (
  id UUID,
  email TEXT,
  created_at TIMESTAMPTZ,
  role TEXT
) AS $$
BEGIN
  -- Check if current user is admin
  IF (SELECT get_user_role()) != 'admin' THEN
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