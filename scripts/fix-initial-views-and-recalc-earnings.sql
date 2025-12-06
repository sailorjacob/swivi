-- ================================================================
-- FIX: Reset initialViews to 0 AND Recalculate Earnings
-- 
-- Problem: Some clips have initialViews set to current views,
-- meaning they're showing 0 growth and earning $0.
--
-- Solution: Reset initialViews to 0 so ALL views count for earnings,
-- then recalculate each clip's earnings based on views * payout rate.
-- ================================================================

-- STEP 1: See what we're fixing
SELECT '=== BEFORE FIX: Clips with initialViews > 0 ===' as section;

SELECT 
    u.name as clipper_name,
    c.views as current_views,
    cs."initialViews" as initial_views,
    c.views - COALESCE(cs."initialViews", 0) as views_counted,
    c.earnings as current_earnings,
    camp."payoutRate" as rate_per_1k
FROM clip_submissions cs
JOIN clips c ON cs."clipId" = c.id
JOIN users u ON cs."userId" = u.id
JOIN campaigns camp ON cs."campaignId" = camp.id
WHERE cs.status = 'APPROVED'
  AND camp."deletedAt" IS NULL
  AND camp."isTest" = false
  AND cs."initialViews" IS NOT NULL
  AND cs."initialViews" > 0
ORDER BY cs."initialViews" DESC;

-- STEP 2: Reset ALL initialViews to 0 for approved submissions
SELECT '=== FIXING: Reset initialViews to 0 ===' as section;

UPDATE clip_submissions
SET "initialViews" = 0
WHERE status = 'APPROVED'
  AND "initialViews" IS NOT NULL
  AND "initialViews" > 0;

-- Show how many were updated
SELECT 'Updated ' || COUNT(*) || ' submissions' as result
FROM clip_submissions
WHERE status = 'APPROVED'
  AND "initialViews" = 0;

-- STEP 3: Recalculate earnings for ALL approved clips
-- Formula: earnings = (views / 1000) * payoutRate
-- Capped at 30% of campaign budget per clip
SELECT '=== FIXING: Recalculate earnings ===' as section;

WITH earnings_calc AS (
    SELECT 
        c.id as clip_id,
        c.views,
        camp."payoutRate",
        camp.budget,
        -- Calculate: (views / 1000) * rate
        ROUND((c.views::numeric / 1000.0) * camp."payoutRate", 2) as calculated_earnings,
        -- Cap at 30% of budget
        ROUND(camp.budget * 0.30, 2) as max_earnings
    FROM clip_submissions cs
    JOIN clips c ON cs."clipId" = c.id
    JOIN campaigns camp ON cs."campaignId" = camp.id
    WHERE cs.status = 'APPROVED'
      AND camp."deletedAt" IS NULL
      AND camp."isTest" = false
)
UPDATE clips c
SET earnings = LEAST(ec.calculated_earnings, ec.max_earnings)
FROM earnings_calc ec
WHERE c.id = ec.clip_id;

-- STEP 4: Recalculate user totalEarnings and totalViews
SELECT '=== FIXING: Recalculate user totals ===' as section;

-- Update user totalEarnings from their clips
UPDATE users u
SET "totalEarnings" = COALESCE(sub.total_earnings, 0),
    "totalViews" = COALESCE(sub.total_views, 0)
FROM (
    SELECT 
        cs."userId",
        SUM(c.earnings) as total_earnings,
        SUM(c.views) as total_views
    FROM clip_submissions cs
    JOIN clips c ON cs."clipId" = c.id
    JOIN campaigns camp ON cs."campaignId" = camp.id
    WHERE cs.status = 'APPROVED'
      AND camp."deletedAt" IS NULL
      AND camp."isTest" = false
    GROUP BY cs."userId"
) sub
WHERE u.id = sub."userId";

-- STEP 5: Recalculate campaign spent
SELECT '=== FIXING: Recalculate campaign spent ===' as section;

UPDATE campaigns camp
SET spent = COALESCE(sub.total_spent, 0)
FROM (
    SELECT 
        cs."campaignId",
        SUM(c.earnings) as total_spent
    FROM clip_submissions cs
    JOIN clips c ON cs."clipId" = c.id
    WHERE cs.status = 'APPROVED'
    GROUP BY cs."campaignId"
) sub
WHERE camp.id = sub."campaignId"
  AND camp."deletedAt" IS NULL
  AND camp."isTest" = false;

-- STEP 6: Verify the fix
SELECT '=== AFTER FIX: Verification ===' as section;

SELECT 
    COUNT(DISTINCT c.id) as total_approved_clips,
    SUM(c.views) as total_views,
    SUM(c.earnings) as total_earnings,
    SUM(cs."initialViews") as total_initial_views_should_be_zero
FROM clip_submissions cs
JOIN clips c ON cs."clipId" = c.id
JOIN campaigns camp ON cs."campaignId" = camp.id
WHERE cs.status = 'APPROVED'
  AND camp."deletedAt" IS NULL
  AND camp."isTest" = false;

-- Show top earners after fix
SELECT '=== TOP EARNERS AFTER FIX ===' as section;

SELECT 
    u.name as clipper_name,
    SUM(c.views) as total_views,
    SUM(c.earnings) as total_earnings,
    COUNT(*) as num_clips
FROM clip_submissions cs
JOIN clips c ON cs."clipId" = c.id
JOIN users u ON cs."userId" = u.id
JOIN campaigns camp ON cs."campaignId" = camp.id
WHERE cs.status = 'APPROVED'
  AND camp."deletedAt" IS NULL
  AND camp."isTest" = false
GROUP BY u.id, u.name
ORDER BY total_earnings DESC
LIMIT 15;

