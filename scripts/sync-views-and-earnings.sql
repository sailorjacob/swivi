-- ============================================================
-- SYNC VIEWS AND EARNINGS
-- Fix the mismatch where earnings is higher than views would suggest
-- Views should be the HIGHEST ever tracked, earnings = views / 1000 * rate
-- ============================================================

-- 1. See current state
SELECT 
    u.name,
    cl.views as current_clip_views,
    (SELECT MAX(vt.views) FROM view_tracking vt WHERE vt."clipId" = cl.id) as max_tracking_views,
    (SELECT vt.views FROM view_tracking vt WHERE vt."clipId" = cl.id ORDER BY vt."scrapedAt" DESC LIMIT 1) as latest_tracking_views,
    cl.earnings,
    cam."payoutRate" as rate
FROM clip_submissions cs
JOIN users u ON u.id = cs."userId"
JOIN clips cl ON cl.id = cs."clipId"
JOIN campaigns cam ON cam.id = cs."campaignId"
WHERE cs.status = 'APPROVED'
ORDER BY cl.views DESC;


-- 2. Set clip.views to the MAXIMUM tracked views (views should never go down)
UPDATE clips cl
SET views = COALESCE((
    SELECT MAX(vt.views)
    FROM view_tracking vt
    WHERE vt."clipId" = cl.id
), cl.views)
WHERE id IN (SELECT "clipId" FROM clip_submissions WHERE "clipId" IS NOT NULL);


-- 3. Recalculate earnings based on the synced views
-- earnings = views / 1000 * payoutRate
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


-- 4. Recalculate user totalEarnings
UPDATE users u
SET "totalEarnings" = COALESCE((
    SELECT SUM(cl.earnings)
    FROM clip_submissions cs
    JOIN clips cl ON cl.id = cs."clipId"
    WHERE cs."userId" = u.id
    AND cs.status = 'APPROVED'
), 0)
WHERE role = 'CLIPPER';


-- 5. Recalculate user totalViews (sum of all their clip views)
UPDATE users u
SET "totalViews" = COALESCE((
    SELECT SUM(cl.views)
    FROM clip_submissions cs
    JOIN clips cl ON cl.id = cs."clipId"
    WHERE cs."userId" = u.id
    AND cs.status = 'APPROVED'
), 0)
WHERE role = 'CLIPPER';


-- 6. Recalculate campaign spent
UPDATE campaigns c
SET spent = COALESCE((
    SELECT SUM(cl.earnings)
    FROM clip_submissions cs
    JOIN clips cl ON cl.id = cs."clipId"
    WHERE cs."campaignId" = c.id
    AND cs.status = 'APPROVED'
), 0);


-- 7. VERIFY everything is now consistent
SELECT 
    u.name,
    cl.views,
    cl.earnings,
    cam."payoutRate" as rate,
    ROUND((cl.views::numeric / 1000.0) * cam."payoutRate", 2) as expected_earnings,
    CASE 
        WHEN cl.earnings = ROUND((cl.views::numeric / 1000.0) * cam."payoutRate", 2)
        THEN '✅ MATCH'
        ELSE '❌'
    END as status
FROM clip_submissions cs
JOIN users u ON u.id = cs."userId"
JOIN clips cl ON cl.id = cs."clipId"
JOIN campaigns cam ON cam.id = cs."campaignId"
WHERE cs.status = 'APPROVED'
ORDER BY cl.views DESC;


-- 8. Show totals
SELECT 'Total views' as metric, SUM(cl.views)::text as value
FROM clip_submissions cs
JOIN clips cl ON cl.id = cs."clipId"
WHERE cs.status = 'APPROVED'
UNION ALL
SELECT 'Total earnings', '$' || ROUND(SUM(cl.earnings)::numeric, 2)::text
FROM clip_submissions cs
JOIN clips cl ON cl.id = cs."clipId"
WHERE cs.status = 'APPROVED';

