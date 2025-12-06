-- ============================================================
-- Migration: Prevent Duplicate Submissions
-- ============================================================
-- This migration:
-- 1. Cleans up existing duplicate submissions by rejecting them
-- 2. Adds a unique constraint to prevent future duplicates
-- ============================================================

-- Step 1: Mark duplicate submissions as REJECTED (keep the oldest one)
-- This handles exact URL duplicates within the same campaign
UPDATE clip_submissions
SET 
    status = 'REJECTED',
    "rejectionReason" = 'Auto-rejected: Duplicate submission detected during data cleanup',
    "autoRejected" = true,
    "updatedAt" = NOW()
WHERE id IN (
    SELECT id FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                PARTITION BY "clipUrl", "campaignId" 
                ORDER BY "createdAt" ASC
            ) as rn
        FROM clip_submissions
        WHERE status != 'REJECTED'
    ) ranked
    WHERE rn > 1
);

-- Step 2: Create a partial unique index that only applies to non-rejected submissions
-- This allows:
-- - Rejected submissions to have duplicate URLs (for history)
-- - Only one active submission per URL per campaign
CREATE UNIQUE INDEX IF NOT EXISTS "clip_submissions_unique_url_per_campaign" 
ON clip_submissions ("clipUrl", "campaignId") 
WHERE status != 'REJECTED';

-- Step 3: Also prevent the same user from submitting the same URL to multiple campaigns
-- This is a partial index that excludes rejected submissions
CREATE UNIQUE INDEX IF NOT EXISTS "clip_submissions_unique_url_per_user" 
ON clip_submissions ("clipUrl", "userId") 
WHERE status != 'REJECTED';

-- Log the cleanup results
DO $$
DECLARE
    rejected_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO rejected_count
    FROM clip_submissions
    WHERE status = 'REJECTED' 
    AND "rejectionReason" LIKE '%Duplicate submission detected during data cleanup%';
    
    RAISE NOTICE 'Duplicate submissions rejected: %', rejected_count;
END $$;

