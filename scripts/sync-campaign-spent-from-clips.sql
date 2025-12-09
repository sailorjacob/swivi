-- ============================================================================
-- FIX: Sync campaign.spent to actual clip earnings
-- This ensures campaign.spent matches the sum of clip.earnings for that campaign
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
    cs.campaign_id,
    SUM(cl.earnings) as total_earnings
  FROM clip_submissions cs
  JOIN clips cl ON cs.clip_id = cl.id
  WHERE cs.status = 'APPROVED'
  GROUP BY cs.campaign_id
) actual ON c.id = actual.campaign_id
WHERE c.deleted_at IS NULL
  AND ABS(c.spent - COALESCE(actual.total_earnings, 0)) > 0.01
ORDER BY ABS(c.spent - COALESCE(actual.total_earnings, 0)) DESC;

-- STEP 2: Apply the fix (UNCOMMENT TO RUN)
/*
UPDATE campaigns c
SET spent = COALESCE(actual.total_earnings, 0),
    updated_at = NOW()
FROM (
  SELECT 
    cs.campaign_id,
    SUM(cl.earnings) as total_earnings
  FROM clip_submissions cs
  JOIN clips cl ON cs.clip_id = cl.id
  WHERE cs.status = 'APPROVED'
  GROUP BY cs.campaign_id
) actual
WHERE c.id = actual.campaign_id
  AND c.deleted_at IS NULL
  AND ABS(c.spent - COALESCE(actual.total_earnings, 0)) > 0.01;
*/

-- STEP 3: Verify fix worked
-- Run the preview query again to confirm no discrepancies remain

