-- ============================================================================
-- FIX: Sync campaign.spent to actual clip earnings
-- This ensures campaign.spent matches the sum of clip.earnings for that campaign
-- NOTE: Column names use camelCase (Prisma convention)
-- ============================================================================

-- STEP 1: Preview what will be fixed (DRY RUN)
SELECT 
  c.id,
  c.title,
  c.status,
  c.spent as current_spent,
  COALESCE(actual.total_earnings, 0) as actual_clip_earnings,
  COALESCE(actual.total_earnings, 0) - c.spent as adjustment_needed
FROM campaigns c
LEFT JOIN (
  SELECT 
    cs."campaignId",
    SUM(cl.earnings) as total_earnings
  FROM clip_submissions cs
  JOIN clips cl ON cs."clipId" = cl.id
  WHERE cs.status = 'APPROVED'
  GROUP BY cs."campaignId"
) actual ON c.id = actual."campaignId"
WHERE c."deletedAt" IS NULL
  AND ABS(c.spent - COALESCE(actual.total_earnings, 0)) > 0.01
ORDER BY ABS(c.spent - COALESCE(actual.total_earnings, 0)) DESC;

-- STEP 2: Apply the fix (UNCOMMENT TO RUN)
/*
UPDATE campaigns c
SET spent = COALESCE(actual.total_earnings, 0),
    "updatedAt" = NOW()
FROM (
  SELECT 
    cs."campaignId",
    SUM(cl.earnings) as total_earnings
  FROM clip_submissions cs
  JOIN clips cl ON cs."clipId" = cl.id
  WHERE cs.status = 'APPROVED'
  GROUP BY cs."campaignId"
) actual
WHERE c.id = actual."campaignId"
  AND c."deletedAt" IS NULL
  AND ABS(c.spent - COALESCE(actual.total_earnings, 0)) > 0.01;
*/

-- STEP 3: Verify fix worked
-- Run the preview query again to confirm no discrepancies remain
