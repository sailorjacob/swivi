-- Campaign Soft Delete and Test Flag Migration
-- This migration adds soft delete support and test campaign flagging
-- Run this on your production database before deploying the new code

-- Add isTest column (for excluding test campaigns from real statistics)
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS "isTest" BOOLEAN DEFAULT false;

-- Add deletedAt column (for soft delete / archiving)
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(6);

-- Create indexes for efficient filtering
CREATE INDEX IF NOT EXISTS "campaigns_deletedAt_idx" ON campaigns ("deletedAt");
CREATE INDEX IF NOT EXISTS "campaigns_isTest_idx" ON campaigns ("isTest");

-- Optional: Set any existing campaigns you want to mark as test
-- UPDATE campaigns SET "isTest" = true WHERE title LIKE '%test%' OR title LIKE '%Test%';

