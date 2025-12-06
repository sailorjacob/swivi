-- Check itzm4dk1ng's clips specifically
SELECT '=== itzm4dk1ng clips status ===' as section;

SELECT 
    cs.id as submission_id,
    cs.status,
    u.name as clipper_name,
    c.views as current_views,
    cs."initialViews" as initial_views,
    c.views - COALESCE(cs."initialViews", 0) as views_counted,
    c.earnings as current_earnings,
    camp.title as campaign_title,
    SUBSTRING(cs."clipUrl", 1, 50) as clip_url
FROM clip_submissions cs
JOIN clips c ON cs."clipId" = c.id
JOIN users u ON cs."userId" = u.id
JOIN campaigns camp ON cs."campaignId" = camp.id
WHERE u.name ILIKE '%itzm4dk1ng%' OR u.name ILIKE '%itzmad%'
ORDER BY cs."createdAt" DESC;

-- Also check ALL clips with initialViews = current views (regardless of approval status)
SELECT '=== ALL clips where initialViews = views (any status) ===' as section;

SELECT 
    cs.id as submission_id,
    cs.status,
    u.name as clipper_name,
    c.views as current_views,
    cs."initialViews" as initial_views,
    c.earnings as current_earnings
FROM clip_submissions cs
JOIN clips c ON cs."clipId" = c.id
JOIN users u ON cs."userId" = u.id
WHERE cs."initialViews" IS NOT NULL
  AND cs."initialViews" > 0
  AND cs."initialViews" = c.views
ORDER BY c.views DESC;

