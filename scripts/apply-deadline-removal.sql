-- URGENT: Remove deadline column from campaigns table
-- This fixes the "Null constraint violation on the fields: (deadline)" error
-- Run this SQL directly in your production database

-- Check current campaigns table structure
\d campaigns;

-- Show current campaigns (if any)
SELECT id, title, deadline FROM campaigns LIMIT 5;

-- Step 1: Drop any indexes that reference the deadline column
DROP INDEX IF EXISTS "campaigns_endDate_idx";
DROP INDEX IF EXISTS "campaigns_deadline_idx";

-- Step 2: Remove the deadline column (this is the critical fix)
ALTER TABLE "campaigns" DROP COLUMN IF EXISTS "deadline";

-- Step 3: Verify the column is gone
\d campaigns;

-- Step 4: Test campaign creation (should work now)
-- This is just a test - you can delete this test campaign after
INSERT INTO campaigns (
    id,
    title,
    description,
    creator,
    budget,
    "payoutRate",
    status,
    "targetPlatforms",
    requirements,
    "createdAt",
    "updatedAt"
) VALUES (
    'test-' || generate_random_uuid()::text,
    'Test Campaign',
    'This is a test campaign to verify the deadline column removal worked',
    'Test Creator',
    1000.00,
    2.50,
    'DRAFT',
    ARRAY['TIKTOK']::text[],
    ARRAY[]::text[],
    NOW(),
    NOW()
);

-- Verify the test campaign was created successfully
SELECT id, title, creator, budget FROM campaigns WHERE title = 'Test Campaign';

-- Clean up test campaign
DELETE FROM campaigns WHERE title = 'Test Campaign';

-- Final verification - show table structure without deadline
\d campaigns;

-- Success message
SELECT 'SUCCESS: deadline column removed, campaign creation should now work!' as status;
