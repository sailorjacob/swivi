-- Remove deadline column from campaigns table
-- This migration removes the deadline field as campaigns now run until budget is exhausted

ALTER TABLE "campaigns" DROP COLUMN IF EXISTS "deadline";
