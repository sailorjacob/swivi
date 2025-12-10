-- Add campaign end metrics fields
-- Tracks when budget was reached and the view count at that moment

ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS "budgetReachedAt" TIMESTAMP(6),
ADD COLUMN IF NOT EXISTS "budgetReachedViews" BIGINT DEFAULT 0;

-- For the current campaign that already reached budget, set the metrics now
UPDATE campaigns
SET 
  "budgetReachedAt" = NOW(),
  "budgetReachedViews" = (
    SELECT COALESCE(SUM(c.views), 0)
    FROM clips c
    JOIN clip_submissions cs ON cs."clipId" = c.id
    WHERE cs."campaignId" = campaigns.id AND cs.status = 'APPROVED'
  )
WHERE spent >= budget 
  AND "budgetReachedAt" IS NULL
  AND status = 'ACTIVE'
  AND "deletedAt" IS NULL
  AND "isTest" = false;

