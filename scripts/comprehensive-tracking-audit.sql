-- ============================================================
-- COMPREHENSIVE VIEW TRACKING AUDIT
-- Run this in Supabase SQL Editor to diagnose all tracking issues
-- ============================================================

-- 1. CHECK VIEW TRACKING RECORDS PER CLIP
-- How many scrape records does each clip have? Should be multiple if cron is working
-- ============================================================
SELECT 
    '=== VIEW TRACKING RECORDS PER CLIP ===' as section;

SELECT 
    cs.id as submission_id,
    cs."clipUrl",
    cs.status,
    cs."initialViews",
    cs."processingStatus",
    cl.id as clip_id,
    cl.views as current_clip_views,
    COUNT(vt.id) as scrape_count,
    MIN(vt."scrapedAt") as first_scrape,
    MAX(vt."scrapedAt") as last_scrape,
    -- Check if views are changing
    MIN(vt.views) as min_views_recorded,
    MAX(vt.views) as max_views_recorded,
    (MAX(vt.views) - MIN(vt.views)) as view_growth_recorded
FROM clip_submissions cs
LEFT JOIN clips cl ON cl.id = cs."clipId"
LEFT JOIN view_tracking vt ON vt."clipId" = cl.id
WHERE cs."createdAt" > NOW() - INTERVAL '3 days'
GROUP BY cs.id, cs."clipUrl", cs.status, cs."initialViews", cs."processingStatus", cl.id, cl.views
ORDER BY cs."createdAt" DESC;


-- 2. CHECK FOR CLIPS WITH ONLY 1 SCRAPE (stagnant tracking)
-- ============================================================
SELECT 
    '=== CLIPS WITH ONLY 1 SCRAPE (STAGNANT) ===' as section;

SELECT 
    cs.id,
    cs."clipUrl",
    cs.status,
    cs."initialViews",
    cs."processingStatus",
    cs."createdAt" as submitted_at,
    COUNT(vt.id) as scrape_count
FROM clip_submissions cs
LEFT JOIN clips cl ON cl.id = cs."clipId"
LEFT JOIN view_tracking vt ON vt."clipId" = cl.id
WHERE cs."createdAt" > NOW() - INTERVAL '3 days'
GROUP BY cs.id, cs."clipUrl", cs.status, cs."initialViews", cs."processingStatus", cs."createdAt"
HAVING COUNT(vt.id) <= 1
ORDER BY cs."createdAt" DESC;


-- 3. CHECK CLIPS WITH initialViews = 0 (missed initial scrape)
-- ============================================================
SELECT 
    '=== CLIPS WITH MISSING INITIAL VIEWS ===' as section;

SELECT 
    cs.id,
    cs."clipUrl",
    cs.platform,
    cs.status,
    cs."initialViews",
    cs."processingStatus",
    cs."createdAt" as submitted_at,
    cl.views as current_views
FROM clip_submissions cs
LEFT JOIN clips cl ON cl.id = cs."clipId"
WHERE (cs."initialViews" IS NULL OR cs."initialViews" = 0)
AND cs."createdAt" > NOW() - INTERVAL '7 days'
ORDER BY cs."createdAt" DESC;


-- 4. CHECK CRON JOB EXECUTION HISTORY
-- ============================================================
SELECT 
    '=== CRON JOB HISTORY (Last 24 hours) ===' as section;

SELECT 
    id,
    "jobType",
    status,
    "startedAt",
    "completedAt",
    EXTRACT(EPOCH FROM ("completedAt" - "startedAt")) as duration_seconds,
    details,
    "errorMessage"
FROM "CronJobHistory"
WHERE "startedAt" > NOW() - INTERVAL '24 hours'
ORDER BY "startedAt" DESC;


-- 5. CHECK FOR DUPLICATE VIEW TRACKING RECORDS (same timestamp)
-- ============================================================
SELECT 
    '=== DUPLICATE/SAME-TIME SCRAPES ===' as section;

SELECT 
    "clipId",
    date,
    COUNT(*) as records_on_same_day,
    MIN("scrapedAt") as first_scrape_of_day,
    MAX("scrapedAt") as last_scrape_of_day
FROM view_tracking
WHERE date > NOW() - INTERVAL '3 days'
GROUP BY "clipId", date
HAVING COUNT(*) > 1
ORDER BY date DESC, records_on_same_day DESC;


-- 6. VIEW TRACKING TIMELINE FOR A SPECIFIC CLIP
-- Shows all scrapes in chronological order to verify growth tracking
-- ============================================================
SELECT 
    '=== VIEW TRACKING TIMELINE (Sample Clip) ===' as section;

-- Get the clip with the most tracking records
WITH clip_with_most_tracking AS (
    SELECT "clipId", COUNT(*) as cnt
    FROM view_tracking
    WHERE "scrapedAt" > NOW() - INTERVAL '3 days'
    GROUP BY "clipId"
    ORDER BY cnt DESC
    LIMIT 1
)
SELECT 
    vt.id,
    vt."clipId",
    vt.views,
    vt.date,
    vt."scrapedAt",
    LAG(vt.views) OVER (ORDER BY vt."scrapedAt") as previous_views,
    vt.views - COALESCE(LAG(vt.views) OVER (ORDER BY vt."scrapedAt"), 0) as view_change
FROM view_tracking vt
WHERE vt."clipId" = (SELECT "clipId" FROM clip_with_most_tracking)
ORDER BY vt."scrapedAt" ASC;


-- 7. CHECK CAMPAIGN STATUS AND ACTIVE CLIPS
-- ============================================================
SELECT 
    '=== CAMPAIGN STATUS AND CLIPS TO TRACK ===' as section;

SELECT 
    c.id as campaign_id,
    c.title,
    c.status,
    c.budget,
    c.spent,
    (SELECT COUNT(*) FROM clip_submissions cs WHERE cs."campaignId" = c.id) as total_submissions,
    (SELECT COUNT(*) FROM clip_submissions cs WHERE cs."campaignId" = c.id AND cs.status = 'APPROVED') as approved_submissions,
    (SELECT COUNT(*) FROM clip_submissions cs JOIN clips cl ON cl.id = cs."clipId" WHERE cs."campaignId" = c.id AND cs.status = 'APPROVED') as clips_created
FROM "Campaign" c
WHERE c."isTest" = false
ORDER BY c."createdAt" DESC;


-- 8. PROCESSING STATUS BREAKDOWN
-- ============================================================
SELECT 
    '=== PROCESSING STATUS BREAKDOWN ===' as section;

SELECT 
    "processingStatus",
    COUNT(*) as count
FROM clip_submissions
WHERE "createdAt" > NOW() - INTERVAL '7 days'
GROUP BY "processingStatus"
ORDER BY count DESC;


-- 9. SCRAPES PER HOUR (to verify cron frequency)
-- ============================================================
SELECT 
    '=== SCRAPES PER HOUR ===' as section;

SELECT 
    DATE_TRUNC('hour', "scrapedAt") as hour,
    COUNT(*) as scrapes_in_hour,
    COUNT(DISTINCT "clipId") as unique_clips_scraped
FROM view_tracking
WHERE "scrapedAt" > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', "scrapedAt")
ORDER BY hour DESC;


-- 10. CHECK IF VIEWS ARE ACTUALLY INCREASING
-- ============================================================
SELECT 
    '=== CLIPS WHERE VIEWS INCREASED ===' as section;

SELECT 
    vt."clipId",
    cs."clipUrl",
    MIN(vt.views) as min_views,
    MAX(vt.views) as max_views,
    MAX(vt.views) - MIN(vt.views) as total_growth,
    COUNT(*) as scrape_count
FROM view_tracking vt
JOIN clips cl ON cl.id = vt."clipId"
JOIN clip_submissions cs ON cs."clipId" = cl.id
WHERE vt."scrapedAt" > NOW() - INTERVAL '3 days'
GROUP BY vt."clipId", cs."clipUrl"
HAVING MAX(vt.views) > MIN(vt.views)
ORDER BY total_growth DESC;

