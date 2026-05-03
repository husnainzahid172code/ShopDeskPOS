-- ================================================================
--  Fix Trigger - Run this to fix the profile creation trigger
--  This bypasses RLS issues
-- ================================================================

-- Drop and recreate the trigger function with proper permissions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create function that bypasses RLS
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER -- This is critical - runs with creator's permissions
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'cashier')
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'Error creating profile: %', SQLERRM;
    RETURN NEW; -- Still allow user creation even if profile fails
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION handle_new_user();

-- Add policy to allow service role to insert profiles
DROP POLICY IF EXISTS "service_role_insert_profiles" ON profiles;
CREATE POLICY "service_role_insert_profiles" 
  ON profiles 
  FOR INSERT 
  WITH CHECK (true);

-- Verify trigger exists
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
