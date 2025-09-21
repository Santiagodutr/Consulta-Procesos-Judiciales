-- Fix for user registration issue
-- This adds the missing INSERT policy for the users table

-- Allow user registration (INSERT operations for new users)
CREATE POLICY "Allow user registration" ON users FOR INSERT WITH CHECK (true);