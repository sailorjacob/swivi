-- Remove deadline column from campaigns table
-- This migration removes the deadline field as campaigns now run until budget is exhausted

-- First, drop any indexes that reference the deadline column
DROP INDEX IF EXISTS "campaigns_endDate_idx";
DROP INDEX IF EXISTS "campaigns_deadline_idx";

-- Remove the deadline column
ALTER TABLE "campaigns" DROP COLUMN IF EXISTS "deadline";