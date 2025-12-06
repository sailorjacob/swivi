-- ============================================================
-- DEBUG SPECIFIC CLIP - Find discrepancy between Apify and actual views
-- Replace 'DR5M2vZCEYH' with the shortcode from your Instagram URL
-- ============================================================

-- 1. Find the submission by URL
SELECT 
    '=== SUBMISSION INFO ===' as section;

SELECT 
    cs.id as submission_id,
    cs."clipUrl",
    cs.platform,
    cs.status,
    cs."initialViews",
    cs."processingStatus",
    cs."createdAt" as submitted_at,
    cam.title as campaign,
    cam."payoutRate"
FROM clip_submissions cs
JOIN "Campaign" cam ON cam.id = cs."campaignId"
WHERE cs."clipUrl" LIKE '%DR5M2vZCEYH%'  -- Replace with your shortcode
   OR cs."clipUrl" LIKE '%ZCEYH%';       -- Partial match


-- 2. Find the clip and its current stats
SELECT 
    '=== CLIP INFO ===' as section;

SELECT 
    cl.id as clip_id,
    cl.views as current_views,
    cl.likes,
    cl.shares,
    cl.earnings,
    cl.status,
    cl."createdAt",
    cl."updatedAt"
FROM clips cl
JOIN clip_submissions cs ON cs."clipId" = cl.id
WHERE cs."clipUrl" LIKE '%DR5M2vZCEYH%'
   OR cs."clipUrl" LIKE '%ZCEYH%';


-- 3. View tracking history - see all scrapes
SELECT 
    '=== VIEW TRACKING HISTORY (all scrapes) ===' as section;

SELECT 
    vt.id,
    vt.views,
    vt.date,
    vt."scrapedAt",
    vt.views - LAG(vt.views) OVER (ORDER BY vt."scrapedAt") as view_change_from_prev
FROM view_tracking vt
WHERE vt."clipId" = (
    SELECT cl.id 
    FROM clips cl
    JOIN clip_submissions cs ON cs."clipId" = cl.id
    WHERE cs."clipUrl" LIKE '%DR5M2vZCEYH%'
       OR cs."clipUrl" LIKE '%ZCEYH%'
    LIMIT 1
)
ORDER BY vt."scrapedAt" ASC;


-- 4. View tracking summary
SELECT 
    '=== VIEW TRACKING SUMMARY ===' as section;

SELECT 
    COUNT(*) as total_scrapes,
    MIN(vt.views) as min_views_recorded,
    MAX(vt.views) as max_views_recorded,
    MAX(vt.views) - MIN(vt.views) as total_view_growth,
    MIN(vt."scrapedAt") as first_scrape,
    MAX(vt."scrapedAt") as last_scrape
FROM view_tracking vt
WHERE vt."clipId" = (
    SELECT cl.id 
    FROM clips cl
    JOIN clip_submissions cs ON cs."clipId" = cl.id
    WHERE cs."clipUrl" LIKE '%DR5M2vZCEYH%'
       OR cs."clipUrl" LIKE '%ZCEYH%'
    LIMIT 1
);


-- 5. Check if views are actually changing between scrapes
SELECT 
    '=== VIEW CHANGE ANALYSIS ===' as section;

WITH scrapes AS (
    SELECT 
        vt.views,
        vt."scrapedAt",
        vt.views - LAG(vt.views) OVER (ORDER BY vt."scrapedAt") as view_diff
    FROM view_tracking vt
    WHERE vt."clipId" = (
        SELECT cl.id 
        FROM clips cl
        JOIN clip_submissions cs ON cs."clipId" = cl.id
        WHERE cs."clipUrl" LIKE '%DR5M2vZCEYH%'
           OR cs."clipUrl" LIKE '%ZCEYH%'
        LIMIT 1
    )
)
SELECT 
    COUNT(*) as total_scrapes,
    SUM(CASE WHEN view_diff = 0 THEN 1 ELSE 0 END) as scrapes_with_no_change,
    SUM(CASE WHEN view_diff > 0 THEN 1 ELSE 0 END) as scrapes_with_increase,
    SUM(CASE WHEN view_diff < 0 THEN 1 ELSE 0 END) as scrapes_with_decrease,
    ROUND(AVG(view_diff)::numeric, 2) as avg_view_change_per_scrape
FROM scrapes
WHERE view_diff IS NOT NULL;

