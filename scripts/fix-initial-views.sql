-- ============================================================
-- FIX INITIAL VIEWS FOR CLIPS WITH initialViews = 0
-- This script identifies clips that need their initial views fixed
-- and provides the data needed for a rescrape
-- ============================================================

-- 1. Find all submissions that need their initial views fixed
-- (These either failed initial scrape or were set to 0 incorrectly)
SELECT 
    'NEEDS_INITIAL_VIEWS_FIX' as issue,
    cs.id as submission_id,
    cs."clipUrl",
    cs.platform,
    cs.status as submission_status,
    cs."processingStatus",
    cs."initialViews",
    cs."createdAt",
    cl.id as clip_id,
    cl.views as current_clip_views,
    -- Calculate what initial views SHOULD be
    -- If we have tracking history, use the oldest tracked value
    (SELECT MIN(vt.views) FROM view_tracking vt WHERE vt."clipId" = cl.id) as oldest_tracked_views,
    (SELECT COUNT(*) FROM view_tracking vt WHERE vt."clipId" = cl.id) as tracking_count
FROM clip_submissions cs
LEFT JOIN clips cl ON cl.id = cs."clipId"
WHERE (cs."initialViews" IS NULL OR cs."initialViews" = 0)
AND cs."clipId" IS NOT NULL
AND cs."createdAt" > NOW() - INTERVAL '7 days'
ORDER BY cs."createdAt" DESC;


-- 2. Update initial views using oldest tracking record (if available)
-- COMMENTED OUT - Review the SELECT above first, then uncomment to run
/*
UPDATE clip_submissions cs
SET "initialViews" = (
    SELECT MIN(vt.views) 
    FROM view_tracking vt 
    JOIN clips cl ON cl.id = vt."clipId"
    WHERE cl.id = cs."clipId"
),
"processingStatus" = 'COMPLETE'
WHERE (cs."initialViews" IS NULL OR cs."initialViews" = 0)
AND cs."clipId" IS NOT NULL
AND EXISTS (
    SELECT 1 FROM view_tracking vt 
    JOIN clips cl ON cl.id = vt."clipId"
    WHERE cl.id = cs."clipId"
);
*/


-- 3. Mark clips that need a rescrape (no tracking data at all)
-- COMMENTED OUT - Review first
/*
UPDATE clip_submissions
SET "processingStatus" = 'NEEDS_RESCRAPE'
WHERE (cs."initialViews" IS NULL OR cs."initialViews" = 0)
AND cs."clipId" IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM view_tracking vt 
    JOIN clips cl ON cl.id = vt."clipId"
    WHERE cl.id = cs."clipId"
)
AND "processingStatus" NOT LIKE 'NEEDS_RESCRAPE%';
*/


-- 4. Verify the fixes
SELECT 
    status,
    "processingStatus",
    COUNT(*) as count,
    SUM(CASE WHEN "initialViews" = 0 THEN 1 ELSE 0 END) as zero_initial_views
FROM clip_submissions
WHERE "createdAt" > NOW() - INTERVAL '7 days'
GROUP BY status, "processingStatus"
ORDER BY status, count DESC;

