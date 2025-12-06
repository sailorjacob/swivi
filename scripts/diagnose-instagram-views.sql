-- Diagnose Instagram Clip View Mismatch (23K actual vs 7K showing)
-- Run this in Supabase SQL Editor

-- 1. Find recent Instagram submissions with their view tracking data
SELECT 
    cs.id as submission_id,
    cs."clipUrl",
    cs.platform,
    cs.status,
    cs."initialViews",
    cs."createdAt" as submitted_at,
    cl.id as clip_id,
    cl.views as clip_stored_views,
    cl.earnings as clip_earnings,
    cl."createdAt" as clip_created_at,
    u.name as user_name,
    u.email as user_email
FROM clip_submissions cs
LEFT JOIN clips cl ON cl.id = cs."clipId"
LEFT JOIN users u ON u.id = cs."userId"
WHERE cs.platform = 'INSTAGRAM'
AND cs."createdAt" > NOW() - INTERVAL '7 days'
ORDER BY cs."createdAt" DESC;

-- 2. Show all view tracking records for recent Instagram clips
SELECT 
    vt.id as tracking_id,
    vt."clipId",
    vt.views as tracked_views,
    vt.date,
    vt."scrapedAt",
    vt."createdAt",
    cs."clipUrl",
    cs."initialViews"
FROM view_tracking vt
JOIN clips cl ON cl.id = vt."clipId"
JOIN clip_submissions cs ON cs."clipId" = cl.id
WHERE cs.platform = 'INSTAGRAM'
AND cs."createdAt" > NOW() - INTERVAL '7 days'
ORDER BY vt."scrapedAt" DESC;

-- 3. Compare initial vs current vs latest tracked views
SELECT 
    cs.id as submission_id,
    cs."clipUrl",
    cs."initialViews" as initial_views,
    cl.views as clip_current_views,
    (SELECT vt.views FROM view_tracking vt WHERE vt."clipId" = cl.id ORDER BY vt."scrapedAt" DESC LIMIT 1) as latest_tracked_views,
    (SELECT vt."scrapedAt" FROM view_tracking vt WHERE vt."clipId" = cl.id ORDER BY vt."scrapedAt" DESC LIMIT 1) as last_scraped_at,
    (SELECT COUNT(*) FROM view_tracking vt WHERE vt."clipId" = cl.id) as total_scrapes
FROM clip_submissions cs
JOIN clips cl ON cl.id = cs."clipId"
WHERE cs.platform = 'INSTAGRAM'
AND cs."createdAt" > NOW() - INTERVAL '7 days'
ORDER BY cs."createdAt" DESC;

-- 4. Check if there are scrape failures in cron history
SELECT 
    id,
    "jobType",
    status,
    details,
    "startedAt",
    "completedAt",
    "errorMessage"
FROM "CronJobHistory"
WHERE "jobType" = 'VIEW_TRACKING'
AND "startedAt" > NOW() - INTERVAL '2 days'
ORDER BY "startedAt" DESC
LIMIT 20;

