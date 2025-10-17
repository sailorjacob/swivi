-- SUPABASE MIGRATION: Remove deadline column from campaigns table
-- Copy and paste this SQL into your Supabase SQL Editor and run it

-- Step 1: Check current table structure (optional - for verification)
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'campaigns' AND table_schema = 'public';

-- Step 2: Drop any indexes that reference the deadline column
DROP INDEX IF EXISTS "campaigns_deadline_idx";
DROP INDEX IF EXISTS "campaigns_endDate_idx";

-- Step 3: Remove the deadline column (this is the critical fix)
ALTER TABLE "campaigns" DROP COLUMN IF EXISTS "deadline";

-- Step 4: Verify the column is gone (optional - for verification)
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'campaigns' AND table_schema = 'public'
-- ORDER BY column_name;

-- Success! The deadline column has been removed.
-- Campaign creation should now work without the "Null constraint violation" error.




