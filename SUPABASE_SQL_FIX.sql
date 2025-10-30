-- ============================================================================
-- FIX DATA DIRECTLY IN SUPABASE SQL EDITOR
-- Copy/paste this into Supabase Dashboard → SQL Editor → New Query
-- ============================================================================

-- PART 1: Fix Campaign Spend to Match Actual Clip Earnings
-- This fixes the $863 discrepancy (campaign showing $1,586 instead of $2,449)

UPDATE campaigns c
SET spent = (
  SELECT COALESCE(SUM(cl.earnings), 0)
  FROM clip_submissions cs
  JOIN clips cl ON cl.id = cs."clipId"
  WHERE cs."campaignId" = c.id
    AND cs.status = 'APPROVED'
)
WHERE c.status IN ('ACTIVE', 'PAUSED', 'COMPLETED');

-- PART 2: Fix User Total Views to Match Actual View Tracking
-- This fixes the profile showing 6,153,896 views instead of correct number

UPDATE users u
SET "totalViews" = (
  SELECT COALESCE(SUM(latest_views.views), 0)
  FROM clip_submissions cs
  JOIN clips c ON c.id = cs."clipId"
  LEFT JOIN LATERAL (
    SELECT views
    FROM view_tracking vt
    WHERE vt."clipId" = c.id
    ORDER BY vt.date DESC
    LIMIT 1
  ) latest_views ON true
  WHERE cs."userId" = u.id
    AND cs.status = 'APPROVED'
);

-- PART 3: Fix User Total Earnings to Match Actual Clip Earnings

UPDATE users u
SET "totalEarnings" = (
  SELECT COALESCE(SUM(c.earnings), 0)
  FROM clip_submissions cs
  JOIN clips c ON c.id = cs."clipId"
  WHERE cs."userId" = u.id
    AND cs.status = 'APPROVED'
);

-- ============================================================================
-- VERIFICATION QUERIES - Run these to check the results
-- ============================================================================

-- Check your campaign spend
SELECT 
  title,
  budget,
  spent AS "recorded_spend",
  (SELECT COALESCE(SUM(cl.earnings), 0)
   FROM clip_submissions cs
   JOIN clips cl ON cl.id = cs."clipId"
   WHERE cs."campaignId" = campaigns.id
     AND cs.status = 'APPROVED'
  ) AS "actual_spend",
  (SELECT COUNT(*)
   FROM clip_submissions cs
   WHERE cs."campaignId" = campaigns.id
     AND cs.status = 'APPROVED'
  ) AS "approved_clips"
FROM campaigns
WHERE status IN ('ACTIVE', 'PAUSED', 'COMPLETED')
ORDER BY spent DESC;

-- Check your user totals
SELECT 
  email,
  "totalViews",
  "totalEarnings",
  (SELECT COUNT(*)
   FROM clip_submissions cs
   WHERE cs."userId" = users.id
     AND cs.status = 'APPROVED'
  ) AS "approved_clips"
FROM users
WHERE "totalEarnings" > 0
ORDER BY "totalEarnings" DESC;

