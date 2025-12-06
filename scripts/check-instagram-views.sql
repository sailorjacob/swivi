-- Check the Instagram clip with views discrepancy (23K actual vs 7K showing)
SELECT 
    cs.id as submission_id,
    cs."clipUrl",
    cs.platform,
    cs.status,
    cs."initialViews",
    cs."createdAt",
    cl.id as clip_id,
    cl.views as clip_views,
    cl.earnings,
    (SELECT COUNT(*) FROM view_tracking vt WHERE vt."clipId" = cl.id) as scrape_count,
    (SELECT vt.views FROM view_tracking vt WHERE vt."clipId" = cl.id ORDER BY vt."scrapedAt" DESC LIMIT 1) as latest_tracked_views,
    (SELECT vt."scrapedAt" FROM view_tracking vt WHERE vt."clipId" = cl.id ORDER BY vt."scrapedAt" DESC LIMIT 1) as last_scraped_at
FROM clip_submissions cs
LEFT JOIN clips cl ON cl.id = cs."clipId"
WHERE cs.platform = 'INSTAGRAM'
AND cs."createdAt" > NOW() - INTERVAL '3 days'
ORDER BY cs."createdAt" DESC;

-- Show all view tracking records for recent Instagram clips
SELECT 
    vt.id,
    vt."clipId",
    vt.views,
    vt.date,
    vt."scrapedAt",
    cs."clipUrl"
FROM view_tracking vt
JOIN clips cl ON cl.id = vt."clipId"
JOIN clip_submissions cs ON cs."clipId" = cl.id
WHERE cs.platform = 'INSTAGRAM'
AND cs."createdAt" > NOW() - INTERVAL '3 days'
ORDER BY vt."scrapedAt" DESC;

