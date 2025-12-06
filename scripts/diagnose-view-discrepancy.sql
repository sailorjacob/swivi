-- ================================================================
-- DIAGNOSE VIEW DISCREPANCY
-- Comparing dashboard totals vs activity feed vs actual data
-- Run this against your Supabase database
-- ================================================================
--
-- KEY INSIGHT: The activity feed was showing "gained +X views" where X was
-- the TOTAL views since submission (currentViews - initialViews = currentViews - 0).
-- This has been FIXED to show the actual INCREMENT from the last scrape instead.
--
-- ================================================================

-- SECTION 1: Dashboard Total Views (what the aggregate API returns)
SELECT '=== DASHBOARD TOTAL VIEWS (clip.views) ===' as section;

SELECT 
    COUNT(DISTINCT c.id) as total_clips_with_approved_submissions,
    COALESCE(SUM(c.views), 0) as total_views_clip_table,
    COALESCE(SUM(c.earnings), 0) as total_earnings_clip_table
FROM clip_submissions cs
JOIN clips c ON cs."clipId" = c.id
JOIN campaigns camp ON cs."campaignId" = camp.id
WHERE cs.status = 'APPROVED'
  AND camp."deletedAt" IS NULL
  AND camp."isTest" = false;

-- SECTION 2: Tracked Views (currentViews - initialViews)
SELECT '=== TRACKED VIEWS (views gained since submission) ===' as section;

SELECT 
    COUNT(*) as approved_submissions,
    COALESCE(SUM(c.views), 0) as total_current_views,
    COALESCE(SUM(cs."initialViews"), 0) as total_initial_views,
    COALESCE(SUM(c.views), 0) - COALESCE(SUM(cs."initialViews"), 0) as total_tracked_views
FROM clip_submissions cs
JOIN clips c ON cs."clipId" = c.id
JOIN campaigns camp ON cs."campaignId" = camp.id
WHERE cs.status = 'APPROVED'
  AND camp."deletedAt" IS NULL
  AND camp."isTest" = false;

-- SECTION 3: Recent View Tracking Records (what the activity feed pulls from)
SELECT '=== RECENT VIEW TRACKING RECORDS (last 20) ===' as section;

SELECT 
    vt.id,
    vt.views as scraped_views,
    vt."scrapedAt",
    c.views as current_clip_views,
    cs."initialViews",
    c.views - COALESCE(cs."initialViews", 0) as view_growth_since_submission,
    u.name as clipper_name,
    camp.title as campaign_title
FROM view_tracking vt
JOIN clips c ON vt."clipId" = c.id
LEFT JOIN clip_submissions cs ON c.id = cs."clipId"
LEFT JOIN users u ON vt."userId" = u.id
LEFT JOIN campaigns camp ON cs."campaignId" = camp.id
ORDER BY vt."scrapedAt" DESC
LIMIT 20;

-- SECTION 4: Compare Last Scrape vs Previous Scrape (actual increment)
SELECT '=== VIEW INCREMENTS FROM LAST SCRAPE ===' as section;

WITH ranked_tracking AS (
    SELECT 
        vt.*,
        c.views as current_clip_views,
        cs."initialViews",
        u.name as clipper_name,
        camp.title as campaign_title,
        ROW_NUMBER() OVER (PARTITION BY vt."clipId" ORDER BY vt."scrapedAt" DESC) as rn
    FROM view_tracking vt
    JOIN clips c ON vt."clipId" = c.id
    LEFT JOIN clip_submissions cs ON c.id = cs."clipId"
    LEFT JOIN users u ON vt."userId" = u.id
    LEFT JOIN campaigns camp ON cs."campaignId" = camp.id
    WHERE cs.status = 'APPROVED'
      AND camp."deletedAt" IS NULL
      AND camp."isTest" = false
),
current_and_previous AS (
    SELECT 
        r1."clipId",
        r1.clipper_name,
        r1.campaign_title,
        r1.views as current_views,
        r1."scrapedAt" as current_scraped_at,
        r2.views as previous_views,
        r2."scrapedAt" as previous_scraped_at,
        r1.views - COALESCE(r2.views, 0) as increment_from_last_scrape,
        r1.current_clip_views - COALESCE(r1."initialViews", 0) as total_growth_since_submission
    FROM ranked_tracking r1
    LEFT JOIN ranked_tracking r2 ON r1."clipId" = r2."clipId" AND r2.rn = 2
    WHERE r1.rn = 1
)
SELECT 
    clipper_name,
    campaign_title,
    current_views,
    previous_views,
    increment_from_last_scrape,
    total_growth_since_submission,
    current_scraped_at
FROM current_and_previous
WHERE current_scraped_at > NOW() - INTERVAL '30 minutes'
ORDER BY current_scraped_at DESC
LIMIT 20;

-- SECTION 5: Sum of Recent Increments (what SHOULD have been added)
SELECT '=== SUM OF VIEW INCREMENTS FROM RECENT SCRAPES ===' as section;

WITH ranked_tracking AS (
    SELECT 
        vt.*,
        ROW_NUMBER() OVER (PARTITION BY vt."clipId" ORDER BY vt."scrapedAt" DESC) as rn
    FROM view_tracking vt
    JOIN clips c ON vt."clipId" = c.id
    JOIN clip_submissions cs ON c.id = cs."clipId"
    JOIN campaigns camp ON cs."campaignId" = camp.id
    WHERE cs.status = 'APPROVED'
      AND camp."deletedAt" IS NULL
      AND camp."isTest" = false
)
SELECT 
    COUNT(*) as clips_scraped_in_last_30min,
    SUM(r1.views - COALESCE(r2.views, r1.views)) as total_increment_from_last_scrapes
FROM ranked_tracking r1
LEFT JOIN ranked_tracking r2 ON r1."clipId" = r2."clipId" AND r2.rn = 2
WHERE r1.rn = 1
  AND r1."scrapedAt" > NOW() - INTERVAL '30 minutes';

-- SECTION 6: Check for Missing Clips (approved but no tracking)
SELECT '=== CLIPS WITH NO VIEW TRACKING ===' as section;

SELECT 
    COUNT(*) as approved_clips_never_tracked
FROM clip_submissions cs
JOIN clips c ON cs."clipId" = c.id
JOIN campaigns camp ON cs."campaignId" = camp.id
LEFT JOIN view_tracking vt ON c.id = vt."clipId"
WHERE cs.status = 'APPROVED'
  AND camp."deletedAt" IS NULL
  AND camp."isTest" = false
  AND vt.id IS NULL;

-- SECTION 7: Campaign-by-Campaign Breakdown
SELECT '=== VIEWS BY CAMPAIGN (for approved submissions) ===' as section;

SELECT 
    camp.title as campaign_title,
    camp.status as campaign_status,
    COUNT(DISTINCT cs.id) as approved_submissions,
    COALESCE(SUM(c.views), 0) as total_current_views,
    COALESCE(SUM(cs."initialViews"), 0) as total_initial_views,
    COALESCE(SUM(c.views), 0) - COALESCE(SUM(cs."initialViews"), 0) as tracked_views_gained,
    COALESCE(SUM(c.earnings), 0) as total_earnings
FROM campaigns camp
JOIN clip_submissions cs ON camp.id = cs."campaignId"
JOIN clips c ON cs."clipId" = c.id
WHERE cs.status = 'APPROVED'
  AND camp."deletedAt" IS NULL
  AND camp."isTest" = false
GROUP BY camp.id, camp.title, camp.status
ORDER BY tracked_views_gained DESC;

-- SECTION 8: Activity Feed Comparison (OLD behavior - showing total growth)
-- This shows what the activity feed WAS displaying before the fix
SELECT '=== WHAT ACTIVITY FEED WAS SHOWING (old behavior) ===' as section;

WITH unique_clips AS (
    SELECT DISTINCT ON (c.url)
        vt.id,
        vt.views,
        vt."scrapedAt",
        c.url,
        cs."initialViews",
        u.name as clipper_name
    FROM view_tracking vt
    JOIN clips c ON vt."clipId" = c.id
    JOIN clip_submissions cs ON c.id = cs."clipId"
    JOIN users u ON vt."userId" = u.id
    ORDER BY c.url, vt."scrapedAt" DESC
)
SELECT 
    clipper_name,
    views as current_views,
    "initialViews" as initial_views,
    views - COALESCE("initialViews", 0) as old_view_growth_shown,
    "scrapedAt",
    SUBSTRING(url, 1, 50) as url_preview
FROM unique_clips
ORDER BY "scrapedAt" DESC
LIMIT 15;

-- SECTION 9: Activity Feed Comparison (NEW behavior - showing actual increment)
SELECT '=== WHAT ACTIVITY FEED NOW SHOWS (actual increments) ===' as section;

WITH ranked_tracking AS (
    SELECT 
        vt.*,
        c.url,
        u.name as clipper_name,
        ROW_NUMBER() OVER (PARTITION BY vt."clipId" ORDER BY vt."scrapedAt" DESC) as rn
    FROM view_tracking vt
    JOIN clips c ON vt."clipId" = c.id
    JOIN clip_submissions cs ON c.id = cs."clipId"
    JOIN users u ON vt."userId" = u.id
    WHERE cs.status = 'APPROVED'
),
unique_with_previous AS (
    SELECT DISTINCT ON (r1.url)
        r1.clipper_name,
        r1.views as current_views,
        COALESCE(r2.views, 0) as previous_views,
        r1.views - COALESCE(r2.views, 0) as new_increment_shown,
        r1."scrapedAt",
        SUBSTRING(r1.url, 1, 50) as url_preview
    FROM ranked_tracking r1
    LEFT JOIN ranked_tracking r2 ON r1."clipId" = r2."clipId" AND r2.rn = 2
    WHERE r1.rn = 1
    ORDER BY r1.url, r1."scrapedAt" DESC
)
SELECT *
FROM unique_with_previous
WHERE new_increment_shown > 0
ORDER BY "scrapedAt" DESC
LIMIT 15;

-- SECTION 10: Total Summary
SELECT '=== FINAL SUMMARY ===' as section;

SELECT
    (SELECT COALESCE(SUM(c.views), 0) 
     FROM clip_submissions cs
     JOIN clips c ON cs."clipId" = c.id
     JOIN campaigns camp ON cs."campaignId" = camp.id
     WHERE cs.status = 'APPROVED' AND camp."deletedAt" IS NULL AND camp."isTest" = false
    ) as dashboard_total_views,
    
    (SELECT COALESCE(SUM(c.views), 0) - COALESCE(SUM(cs."initialViews"), 0)
     FROM clip_submissions cs
     JOIN clips c ON cs."clipId" = c.id
     JOIN campaigns camp ON cs."campaignId" = camp.id
     WHERE cs.status = 'APPROVED' AND camp."deletedAt" IS NULL AND camp."isTest" = false
    ) as dashboard_tracked_views,
    
    (SELECT COALESCE(SUM(c.earnings), 0)
     FROM clip_submissions cs
     JOIN clips c ON cs."clipId" = c.id
     JOIN campaigns camp ON cs."campaignId" = camp.id
     WHERE cs.status = 'APPROVED' AND camp."deletedAt" IS NULL AND camp."isTest" = false
    ) as total_clip_earnings,
    
    (SELECT COUNT(DISTINCT c.id)
     FROM clip_submissions cs
     JOIN clips c ON cs."clipId" = c.id
     JOIN campaigns camp ON cs."campaignId" = camp.id
     WHERE cs.status = 'APPROVED' AND camp."deletedAt" IS NULL AND camp."isTest" = false
    ) as total_approved_clips;
