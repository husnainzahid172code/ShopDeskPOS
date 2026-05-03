-- ================================================================
--  Fix Script - Creates missing profiles for existing users
--  Run this in Supabase SQL Editor
-- ================================================================

-- First, verify the trigger exists
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Create profiles for any existing auth users that don't have profiles
INSERT INTO profiles (id, full_name, role)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email) as full_name,
  COALESCE(u.raw_user_meta_data->>'role', 'admin') as role
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- Verify profiles were created
SELECT 
  u.email,
  p.full_name,
  p.role,
  p.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id;
