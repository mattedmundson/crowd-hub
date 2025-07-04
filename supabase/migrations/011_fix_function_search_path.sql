-- Fix search_path security warnings for all database functions
-- This sets search_path to empty string to prevent security issues

-- Drop triggers first to avoid dependency conflicts
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;

-- Drop functions that have signature conflicts (parameters or return types)
-- Drop all possible variations of these functions
DROP FUNCTION IF EXISTS public.get_user_role(uuid);
DROP FUNCTION IF EXISTS public.handle_new_user_profile();
DROP FUNCTION IF EXISTS public.is_admin(uuid);
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.calculate_current_day();
DROP FUNCTION IF EXISTS public.current_user_is_admin();
DROP FUNCTION IF EXISTS public.debug_current_user();
DROP FUNCTION IF EXISTS public.update_challenge_progress(integer, text, text, text);
DROP FUNCTION IF EXISTS public.update_challenge_progress(integer, text, text);
DROP FUNCTION IF EXISTS public.update_user_role(uuid, text);
DROP FUNCTION IF EXISTS public.get_current_user_role();
DROP FUNCTION IF EXISTS public.get_all_users_with_roles();

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- Fix get_user_role function (using original parameter name user_uuid)
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid DEFAULT auth.uid())
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM public.user_roles 
    WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- Fix handle_new_user_profile function
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, country)
  VALUES (NEW.id, '', '', '');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- Recreate the trigger for user profile creation
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Fix is_admin function
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Hardcoded admin user ID
  IF user_id = 'b16b8fe8-1ae7-449e-89d6-3d286294afd2'::uuid THEN
    RETURN true;
  END IF;
  
  -- Check if user has admin role
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE public.user_roles.user_id = $1 AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- Fix calculate_current_day function
CREATE OR REPLACE FUNCTION public.calculate_current_day()
RETURNS integer AS $$
DECLARE
  start_date date := '2024-01-01';
  current_date date := CURRENT_DATE;
  days_diff integer;
BEGIN
  days_diff := current_date - start_date + 1;
  
  IF days_diff < 1 THEN
    RETURN 1;
  ELSIF days_diff > 100 THEN
    RETURN 100;
  ELSE
    RETURN days_diff;
  END IF;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- Fix current_user_is_admin function
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN public.is_admin(auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- Fix debug_current_user function
CREATE OR REPLACE FUNCTION public.debug_current_user()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'auth_uid', auth.uid(),
    'user_role', public.get_user_role(auth.uid()),
    'is_admin', public.is_admin(auth.uid())
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- Fix update_challenge_progress function
CREATE OR REPLACE FUNCTION public.update_challenge_progress(
  p_day integer,
  p_morning_entry text DEFAULT NULL,
  p_evening_entry text DEFAULT NULL,
  p_gods_message text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.challenge_progress (
    user_id, 
    day, 
    morning_entry, 
    evening_entry,
    gods_message,
    completed_at
  ) VALUES (
    auth.uid(), 
    p_day, 
    p_morning_entry, 
    p_evening_entry,
    p_gods_message,
    NOW()
  )
  ON CONFLICT (user_id, day) 
  DO UPDATE SET
    morning_entry = COALESCE(EXCLUDED.morning_entry, public.challenge_progress.morning_entry),
    evening_entry = COALESCE(EXCLUDED.evening_entry, public.challenge_progress.evening_entry),
    gods_message = COALESCE(EXCLUDED.gods_message, public.challenge_progress.gods_message),
    completed_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- Fix update_user_role function
CREATE OR REPLACE FUNCTION public.update_user_role(target_user_id uuid, new_role text)
RETURNS void AS $$
BEGIN
  -- Check if current user is admin
  IF NOT public.current_user_is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Update the user's role
  INSERT INTO public.user_roles (user_id, role, updated_at)
  VALUES (target_user_id, new_role, NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    role = EXCLUDED.role,
    updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- Fix get_current_user_role function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN public.get_user_role(auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- Fix get_all_users_with_roles function
CREATE OR REPLACE FUNCTION public.get_all_users_with_roles()
RETURNS TABLE (
  id uuid,
  email text,
  first_name text,
  last_name text,
  role text,
  created_at timestamptz
) AS $$
BEGIN
  -- Check if current user is admin
  IF NOT public.current_user_is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    u.email::text,
    COALESCE(p.first_name, '') as first_name,
    COALESCE(p.last_name, '') as last_name,
    COALESCE(ur.role, 'user') as role,
    u.created_at
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.id
  LEFT JOIN public.user_roles ur ON u.id = ur.user_id
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';