-- ============================================================
-- FIX EARNINGS - $1 per 1K views
-- ============================================================

-- 1. First, see all clips with their ACTUAL vs EXPECTED earnings
SELECT 
    u.name,
    cs.status,
    cl.views as db_views,
    cl.earnings as current_earnings,
    cam."payoutRate" as rate,
    -- Expected: views / 1000 * rate
    ROUND((cl.views::numeric / 1000.0) * cam."payoutRate", 2) as should_be,
    -- Difference
    ROUND(cl.earnings - ((cl.views::numeric / 1000.0) * cam."payoutRate"), 2) as over_under
FROM clip_submissions cs
JOIN users u ON u.id = cs."userId"
JOIN clips cl ON cl.id = cs."clipId"
JOIN campaigns cam ON cam.id = cs."campaignId"
WHERE cs.status = 'APPROVED'
ORDER BY cl.views DESC;


-- 2. FIX ALL EARNINGS NOW
-- Set earnings = views / 1000 * payoutRate (for approved clips only)
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


-- 3. Recalculate user totalEarnings
UPDATE users u
SET "totalEarnings" = COALESCE((
    SELECT SUM(cl.earnings)
    FROM clip_submissions cs
    JOIN clips cl ON cl.id = cs."clipId"
    WHERE cs."userId" = u.id
    AND cs.status = 'APPROVED'
), 0)
WHERE role = 'CLIPPER';


-- 4. Recalculate campaign spent
UPDATE campaigns c
SET spent = COALESCE((
    SELECT SUM(cl.earnings)
    FROM clip_submissions cs
    JOIN clips cl ON cl.id = cs."clipId"
    WHERE cs."campaignId" = c.id
    AND cs.status = 'APPROVED'
), 0);


-- 5. VERIFY the fix
SELECT 
    u.name,
    cl.views,
    cl.earnings as new_earnings,
    cam."payoutRate" as rate,
    ROUND((cl.views::numeric / 1000.0) * cam."payoutRate", 2) as expected,
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


-- 6. Show totals
SELECT 
    'Total clip earnings' as metric,
    '$' || ROUND(SUM(cl.earnings)::numeric, 2)::text as value
FROM clip_submissions cs
JOIN clips cl ON cl.id = cs."clipId"
WHERE cs.status = 'APPROVED'
UNION ALL
SELECT 
    'Total user earnings',
    '$' || ROUND(SUM("totalEarnings")::numeric, 2)::text
FROM users
WHERE role = 'CLIPPER';

