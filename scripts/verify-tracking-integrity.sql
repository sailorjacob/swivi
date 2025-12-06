-- ============================================================
-- VERIFY VIEW TRACKING DATA INTEGRITY
-- Run this in Supabase SQL Editor to verify the tracking system
-- ============================================================

-- 1. VERIFY HISTORICAL RECORDS ARE BEING CREATED
-- Each clip should have MULTIPLE tracking records over time
-- ============================================================
SELECT 
    '=== TRACKING RECORDS PER CLIP ===' as section;

SELECT 
    vt."clipId",
    COUNT(*) as record_count,
    MIN(vt."scrapedAt") as first_scrape,
    MAX(vt."scrapedAt") as last_scrape,
    EXTRACT(EPOCH FROM (MAX(vt."scrapedAt") - MIN(vt."scrapedAt"))) / 3600 as hours_tracked,
    MIN(vt.views) as min_views,
    MAX(vt.views) as max_views,
    MAX(vt.views) - MIN(vt.views) as view_growth
FROM view_tracking vt
GROUP BY vt."clipId"
ORDER BY record_count DESC
LIMIT 20;


-- 2. VERIFY EARNINGS CALCULATION
-- earnings should equal (current_views - initial_views) / 1000 * payout_rate
-- ============================================================
SELECT 
    '=== EARNINGS VERIFICATION ===' as section;

SELECT 
    cs.id as submission_id,
    cs."clipUrl",
    cs.status,
    cs."initialViews",
    cl.views as current_views,
    cl.views - cs."initialViews" as view_growth,
    cam."payoutRate",
    cl.earnings as stored_earnings,
    ROUND(((cl.views - cs."initialViews") / 1000.0 * cam."payoutRate")::numeric, 2) as calculated_earnings,
    CASE 
        WHEN ABS(cl.earnings - ((cl.views - cs."initialViews") / 1000.0 * cam."payoutRate")) < 0.01 
        THEN '✅ MATCH' 
        ELSE '⚠️ CHECK' 
    END as status
FROM clip_submissions cs
JOIN clips cl ON cl.id = cs."clipId"
JOIN "Campaign" cam ON cam.id = cs."campaignId"
WHERE cs.status = 'APPROVED'
AND cl.earnings > 0
ORDER BY cl.earnings DESC
LIMIT 20;


-- 3. CHECK FOR CLIPS WITH initialViews = 0 (still need fixing)
-- ============================================================
SELECT 
    '=== CLIPS WITH initialViews = 0 ===' as section;

SELECT 
    cs.id,
    cs."clipUrl",
    cs.platform,
    cs.status,
    cs."initialViews",
    cs."processingStatus",
    cl.views as current_views,
    cl.earnings,
    cs."createdAt"
FROM clip_submissions cs
LEFT JOIN clips cl ON cl.id = cs."clipId"
WHERE cs."initialViews" = 0
AND cs."clipId" IS NOT NULL
ORDER BY cs."createdAt" DESC;


-- 4. VERIFY VIEW TRACKING TIMELINE (sample clip)
-- Should show views increasing over time
-- ============================================================
SELECT 
    '=== VIEW TRACKING TIMELINE (sample) ===' as section;

WITH sample_clip AS (
    SELECT "clipId" 
    FROM view_tracking 
    GROUP BY "clipId" 
    HAVING COUNT(*) >= 3
    ORDER BY COUNT(*) DESC 
    LIMIT 1
)
SELECT 
    vt.id,
    vt."clipId",
    vt.views,
    vt."scrapedAt",
    vt.views - LAG(vt.views) OVER (ORDER BY vt."scrapedAt") as view_change
FROM view_tracking vt
WHERE vt."clipId" = (SELECT "clipId" FROM sample_clip)
ORDER BY vt."scrapedAt" ASC;


-- 5. CAMPAIGN BUDGET VS SPENT
-- Verify spent doesn't exceed budget
-- ============================================================
SELECT 
    '=== CAMPAIGN BUDGET CHECK ===' as section;

SELECT 
    c.id,
    c.title,
    c.budget,
    c.spent,
    c.budget - c.spent as remaining,
    ROUND((c.spent / c.budget * 100)::numeric, 1) as percent_spent,
    (SELECT COUNT(*) FROM clip_submissions cs WHERE cs."campaignId" = c.id AND cs.status = 'APPROVED') as approved_clips,
    CASE WHEN c.spent > c.budget THEN '❌ OVERSPENT' ELSE '✅ OK' END as status
FROM "Campaign" c
WHERE c."isTest" = false
ORDER BY c.spent DESC;


-- 6. USER EARNINGS VERIFICATION
-- Verify user.totalEarnings matches sum of their clip earnings
-- ============================================================
SELECT 
    '=== USER EARNINGS VERIFICATION ===' as section;

SELECT 
    u.id,
    u.name,
    u."totalEarnings" as stored_earnings,
    COALESCE(SUM(cl.earnings), 0) as calculated_earnings,
    CASE 
        WHEN ABS(u."totalEarnings" - COALESCE(SUM(cl.earnings), 0)) < 0.01 
        THEN '✅ MATCH' 
        ELSE '⚠️ CHECK' 
    END as status
FROM users u
LEFT JOIN clip_submissions cs ON cs."userId" = u.id AND cs.status = 'APPROVED'
LEFT JOIN clips cl ON cl.id = cs."clipId"
WHERE u.role = 'CLIPPER'
AND u."totalEarnings" > 0
GROUP BY u.id, u.name, u."totalEarnings"
ORDER BY u."totalEarnings" DESC
LIMIT 20;

