-- FIX EARNINGS SYNC ISSUES
-- Run these queries AFTER diagnosing the issue

-- ============================================================================
-- OPTION 1: SYNC CAMPAIGN SPENT FROM ACTUAL CLIP EARNINGS
-- ============================================================================
-- This will update campaign.spent to match the actual sum of clip earnings

WITH campaign_actual_spend AS (
  SELECT 
    cs."campaignId",
    COALESCE(SUM(cl.earnings::numeric), 0) as actual_spent
  FROM clip_submissions cs
  LEFT JOIN clips cl ON cl.id = cs."clipId"
  WHERE cs.status = 'APPROVED'
  GROUP BY cs."campaignId"
)
UPDATE campaigns c
SET spent = cas.actual_spent
FROM campaign_actual_spend cas
WHERE c.id = cas."campaignId"
  AND c.spent::numeric != cas.actual_spent;

-- Check what changed:
SELECT 
  c.title,
  c.spent::numeric as new_spent,
  COALESCE(SUM(cl.earnings::numeric), 0) as clip_earnings,
  c.budget::numeric,
  (c.spent::numeric / c.budget::numeric * 100) as percent_used
FROM campaigns c
LEFT JOIN clip_submissions cs ON cs."campaignId" = c.id AND cs.status = 'APPROVED'
LEFT JOIN clips cl ON cl.id = cs."clipId"
GROUP BY c.id, c.title, c.spent, c.budget;

-- ============================================================================
-- OPTION 2: SYNC USER TOTAL EARNINGS FROM ACTUAL CLIP EARNINGS
-- ============================================================================
-- This will update user.totalEarnings to match the actual sum of their clip earnings

WITH user_actual_earnings AS (
  SELECT 
    cl."userId",
    COALESCE(SUM(cl.earnings::numeric), 0) as actual_earnings,
    COALESCE(SUM(cl.views::numeric), 0) as actual_views
  FROM clips cl
  JOIN clip_submissions cs ON cs."clipId" = cl.id
  WHERE cs.status = 'APPROVED'
  GROUP BY cl."userId"
)
UPDATE users u
SET 
  "totalEarnings" = uae.actual_earnings,
  "totalViews" = uae.actual_views
FROM user_actual_earnings uae
WHERE u.id = uae."userId"
  AND u.role = 'CLIPPER'
  AND (u."totalEarnings"::numeric != uae.actual_earnings 
       OR u."totalViews"::numeric != uae.actual_views);

-- Check what changed:
SELECT 
  u.email,
  u."totalEarnings"::numeric as synced_earnings,
  COALESCE(SUM(cl.earnings::numeric), 0) as clip_earnings,
  u."totalViews"::numeric as synced_views,
  COALESCE(SUM(cl.views::numeric), 0) as clip_views
FROM users u
LEFT JOIN clips cl ON cl."userId" = u.id
LEFT JOIN clip_submissions cs ON cs."clipId" = cl.id AND cs.status = 'APPROVED'
WHERE u.role = 'CLIPPER'
GROUP BY u.id, u.email, u."totalEarnings", u."totalViews";

-- ============================================================================
-- OPTION 3: DELETE OLD TEST DATA (USE WITH CAUTION!)
-- ============================================================================
-- If you have old test clips/campaigns you want to remove

-- First, see what would be deleted:
SELECT 
  c.title,
  c.status,
  c."createdAt",
  COUNT(cs.id) as submission_count,
  COALESCE(SUM(cl.earnings::numeric), 0) as total_earnings
FROM campaigns c
LEFT JOIN clip_submissions cs ON cs."campaignId" = c.id
LEFT JOIN clips cl ON cl.id = cs."clipId"
WHERE c."createdAt" < NOW() - INTERVAL '7 days'  -- Older than 7 days
  OR c.status = 'CANCELLED'  -- Or cancelled campaigns
GROUP BY c.id, c.title, c.status, c."createdAt"
ORDER BY c."createdAt" DESC;

-- If you're sure, delete old campaigns and their data:
-- UNCOMMENT THESE LINES TO DELETE:

-- DELETE FROM clip_submissions WHERE "campaignId" IN (
--   SELECT id FROM campaigns 
--   WHERE "createdAt" < NOW() - INTERVAL '30 days'
--     OR status = 'CANCELLED'
-- );
-- 
-- DELETE FROM campaigns 
-- WHERE "createdAt" < NOW() - INTERVAL '30 days'
--   OR status = 'CANCELLED';

-- ============================================================================
-- OPTION 4: RESET EVERYTHING FOR TESTING (NUCLEAR OPTION!)
-- ============================================================================
-- Only use this if you want to start fresh with clean data

-- UNCOMMENT TO RESET:
-- DELETE FROM view_tracking;
-- DELETE FROM clip_submissions;
-- DELETE FROM clips;
-- UPDATE campaigns SET spent = 0;
-- UPDATE users SET "totalEarnings" = 0, "totalViews" = 0 WHERE role = 'CLIPPER';

-- ============================================================================
-- VERIFICATION: Run this after any fix
-- ============================================================================

-- Check everything is in sync:
SELECT 
  'Campaign Spend vs Clip Earnings' as check_type,
  COUNT(*) as mismatched_count
FROM campaigns c
LEFT JOIN (
  SELECT "campaignId", SUM(earnings::numeric) as total_earnings
  FROM clip_submissions cs
  JOIN clips cl ON cl.id = cs."clipId"
  WHERE cs.status = 'APPROVED'
  GROUP BY "campaignId"
) ce ON ce."campaignId" = c.id
WHERE ABS(c.spent::numeric - COALESCE(ce.total_earnings, 0)) > 0.01

UNION ALL

SELECT 
  'User Earnings vs Clip Earnings',
  COUNT(*)
FROM users u
LEFT JOIN (
  SELECT cl."userId", SUM(cl.earnings::numeric) as total_earnings
  FROM clips cl
  JOIN clip_submissions cs ON cs."clipId" = cl.id
  WHERE cs.status = 'APPROVED'
  GROUP BY cl."userId"
) ce ON ce."userId" = u.id
WHERE u.role = 'CLIPPER'
  AND ABS(u."totalEarnings"::numeric - COALESCE(ce.total_earnings, 0)) > 0.01;

