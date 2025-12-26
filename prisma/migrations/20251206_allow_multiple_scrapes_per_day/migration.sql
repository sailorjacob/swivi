-- Migration: Allow multiple view tracking records per day for each clip
-- Purpose: Track each individual scrape instead of just one per day
-- This provides complete scrape history visible in admin analytics

-- Drop the unique constraint that limits to one record per clip per day
DROP INDEX IF EXISTS "view_tracking_userId_clipId_date_platform_key";

-- Add new indexes for efficient queries (if they don't exist)
CREATE INDEX IF NOT EXISTS "view_tracking_userId_clipId_platform_idx" ON "view_tracking"("userId", "clipId", "platform");
CREATE INDEX IF NOT EXISTS "view_tracking_clipId_scrapedAt_idx" ON "view_tracking"("clipId", "scrapedAt" DESC);

























