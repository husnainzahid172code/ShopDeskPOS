# COMPLETE DATABASE FIX - Follow these steps EXACTLY

## Step 1: Run fix-trigger.sql in Supabase SQL Editor
1. Go to: https://supabase.com/dashboard/project/vwgyplsywmvuxmdfeymq
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy ALL contents from `database/fix-trigger.sql`
5. Paste into SQL Editor
6. Click **RUN** (or Ctrl+Enter)
7. Verify at the bottom you see a row showing the trigger exists

## Step 2: Delete ALL existing users
1. Click **Authentication** → **Users** (left sidebar)
2. Select all users (if any exist)
3. Click **Delete Users**
4. Confirm deletion

## Step 3: Test registration
1. Go to http://localhost:3000
2. Try to register with:
   - Email: admin@test.com
   - Password: admin123
   - Full Name: Admin User
   - Role: admin
3. Should work now!

## If still not working:
Run this in Supabase SQL Editor to check for errors:

```sql
-- Check if trigger exists
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Check if profiles table exists
SELECT * FROM information_schema.tables 
WHERE table_name = 'profiles';

-- Check policies
SELECT * FROM pg_policies 
WHERE tablename = 'profiles';
```

If trigger doesn't exist, the schema wasn't run properly - go back to Step 1.
