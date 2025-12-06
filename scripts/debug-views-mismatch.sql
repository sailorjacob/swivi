-- ============================================================
-- DEBUG: Views Mismatch Investigation
-- Find why displayed views don't match earnings
-- ============================================================

-- 1. Compare ALL view sources for each clip
SELECT 
    u.name,
    cs.status,
    cs."initialViews" as initial,
    cl.views as clip_views_stored,
    -- Latest view_tracking record
    (SELECT vt.views FROM view_tracking vt WHERE vt."clipId" = cl.id ORDER BY vt."scrapedAt" DESC LIMIT 1) as latest_tracking_views,
    -- Count of tracking records
    (SELECT COUNT(*) FROM view_tracking vt WHERE vt."clipId" = cl.id) as scrape_count,
    cl.earnings,
    cam."payoutRate" as rate,
    -- What views SHOULD be based on earnings (earnings / rate * 1000)
    CASE 
        WHEN cam."payoutRate" > 0 THEN ROUND((cl.earnings / cam."payoutRate") * 1000)
        ELSE 0 
    END as implied_views_from_earnings
FROM clip_submissions cs
JOIN users u ON u.id = cs."userId"
JOIN clips cl ON cl.id = cs."clipId"
JOIN campaigns cam ON cam.id = cs."campaignId"
WHERE cs.status = 'APPROVED'
ORDER BY cl.earnings DESC;


-- 2. Show the actual tracking history for highest earner
SELECT 
    u.name,
    vt.views,
    vt."scrapedAt",
    vt.platform
FROM view_tracking vt
JOIN clips cl ON cl.id = vt."clipId"
JOIN clip_submissions cs ON cs."clipId" = cl.id
JOIN users u ON u.id = cs."userId"
WHERE cs.status = 'APPROVED'
ORDER BY cl.earnings DESC, vt."scrapedAt" DESC
LIMIT 20;


-- 3. Check if clip.views matches latest tracking
SELECT 
    u.name,
    cl.views as clip_views,
    (SELECT vt.views FROM view_tracking vt WHERE vt."clipId" = cl.id ORDER BY vt."scrapedAt" DESC LIMIT 1) as latest_tracking,
    CASE 
        WHEN cl.views = (SELECT vt.views FROM view_tracking vt WHERE vt."clipId" = cl.id ORDER BY vt."scrapedAt" DESC LIMIT 1)
        THEN '✅ MATCH'
        ELSE '❌ MISMATCH'
    END as status
FROM clip_submissions cs
JOIN users u ON u.id = cs."userId"
JOIN clips cl ON cl.id = cs."clipId"
WHERE cs.status = 'APPROVED'
ORDER BY cl.views DESC;


-- 4. FIX: Sync clip.views to latest tracking record
UPDATE clips cl
SET views = COALESCE((
    SELECT vt.views 
    FROM view_tracking vt 
    WHERE vt."clipId" = cl.id 
    ORDER BY vt."scrapedAt" DESC 
    LIMIT 1
), cl.views)
WHERE id IN (SELECT "clipId" FROM clip_submissions WHERE status = 'APPROVED');


-- 5. NOW recalculate earnings based on synced views
UPDATE clips cl
SET earnings = ROUND((
    SELECT (cl.views::numeric / 1000.0) * cam."payoutRate"
    FROM clip_submissions cs
    JOIN campaigns cam ON cam.id = cs."campaignId"
    WHERE cs."clipId" = cl.id
    AND cs.status = 'APPROVED'
    LIMIT 1
), 2)
WHERE id IN (
    SELECT "clipId" FROM clip_submissions WHERE status = 'APPROVED' AND "clipId" IS NOT NULL
);


-- 6. Update user totals
UPDATE users u
SET "totalEarnings" = COALESCE((
    SELECT SUM(cl.earnings)
    FROM clip_submissions cs
    JOIN clips cl ON cl.id = cs."clipId"
    WHERE cs."userId" = u.id
    AND cs.status = 'APPROVED'
), 0)
WHERE role = 'CLIPPER';


-- 7. Update campaign spent
UPDATE campaigns c
SET spent = COALESCE((
    SELECT SUM(cl.earnings)
    FROM clip_submissions cs
    JOIN clips cl ON cl.id = cs."clipId"
    WHERE cs."campaignId" = c.id
    AND cs.status = 'APPROVED'
), 0);


-- 8. VERIFY - Everything should now match
SELECT 
    u.name,
    cl.views as views,
    cl.earnings as earnings,
    cam."payoutRate" as rate,
    ROUND((cl.views::numeric / 1000.0) * cam."payoutRate", 2) as expected_earnings,
    CASE 
        WHEN cl.earnings = ROUND((cl.views::numeric / 1000.0) * cam."payoutRate", 2)
        THEN '✅'
        ELSE '❌'
    END as match
FROM clip_submissions cs
JOIN users u ON u.id = cs."userId"
JOIN clips cl ON cl.id = cs."clipId"
JOIN campaigns cam ON cam.id = cs."campaignId"
WHERE cs.status = 'APPROVED'
ORDER BY cl.views DESC;

