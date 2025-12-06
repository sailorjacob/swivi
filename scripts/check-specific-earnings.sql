-- ============================================================
-- CHECK SPECIFIC CLIP EARNINGS
-- Find the 300K views clip and verify calculation
-- ============================================================

-- 1. Find clips with ~300K views
SELECT 
    u.name as user_name,
    cs.id as submission_id,
    cs.status,
    cs."initialViews",
    cl.views as db_views,
    cl.earnings as db_earnings,
    cam."payoutRate" as rate_per_1k,
    cam.budget as campaign_budget,
    cam.spent as campaign_spent,
    -- Expected calculation: views / 1000 * rate
    ROUND((cl.views::numeric / 1000.0) * cam."payoutRate", 2) as expected_earnings,
    -- 30% budget cap per clip
    ROUND(cam.budget * 0.30, 2) as max_per_clip_cap,
    -- Difference
    ROUND(cl.earnings - ((cl.views::numeric / 1000.0) * cam."payoutRate"), 2) as difference
FROM clip_submissions cs
JOIN users u ON u.id = cs."userId"
JOIN clips cl ON cl.id = cs."clipId"
JOIN campaigns cam ON cam.id = cs."campaignId"
WHERE cl.views >= 250000
ORDER BY cl.views DESC;


-- 2. Check ALL approved clips with their expected earnings
SELECT 
    u.name,
    cl.views,
    cl.earnings as stored,
    cam."payoutRate" as rate,
    ROUND((cl.views::numeric / 1000.0) * cam."payoutRate", 2) as expected,
    CASE 
        WHEN cl.earnings = ROUND((cl.views::numeric / 1000.0) * cam."payoutRate", 2) 
        THEN '✅ MATCH'
        ELSE '❌ MISMATCH'
    END as status
FROM clip_submissions cs
JOIN users u ON u.id = cs."userId"
JOIN clips cl ON cl.id = cs."clipId"
JOIN campaigns cam ON cam.id = cs."campaignId"
WHERE cs.status = 'APPROVED'
ORDER BY cl.views DESC;


-- 3. Recalculate ALL earnings NOW (run this to fix)
-- This will update clip.earnings = views / 1000 * payoutRate
UPDATE clips cl
SET earnings = COALESCE((
    SELECT ROUND((cl.views::numeric / 1000.0) * cam."payoutRate", 2)
    FROM clip_submissions cs
    JOIN campaigns cam ON cam.id = cs."campaignId"
    WHERE cs."clipId" = cl.id
    AND cs.status = 'APPROVED'
    LIMIT 1
), 0)
WHERE id IN (
    SELECT "clipId" FROM clip_submissions WHERE status = 'APPROVED' AND "clipId" IS NOT NULL
);

-- Also update user totals
UPDATE users u
SET "totalEarnings" = COALESCE((
    SELECT SUM(cl.earnings)
    FROM clip_submissions cs
    JOIN clips cl ON cl.id = cs."clipId"
    WHERE cs."userId" = u.id
    AND cs.status = 'APPROVED'
), 0)
WHERE role = 'CLIPPER';

-- And campaign spent
UPDATE campaigns c
SET spent = COALESCE((
    SELECT SUM(cl.earnings)
    FROM clip_submissions cs
    JOIN clips cl ON cl.id = cs."clipId"
    WHERE cs."campaignId" = c.id
    AND cs.status = 'APPROVED'
), 0);


-- 4. Verify after fix
SELECT 
    u.name,
    cl.views,
    cl.earnings as new_earnings,
    cam."payoutRate" as rate,
    ROUND((cl.views::numeric / 1000.0) * cam."payoutRate", 2) as expected
FROM clip_submissions cs
JOIN users u ON u.id = cs."userId"
JOIN clips cl ON cl.id = cs."clipId"
JOIN campaigns cam ON cam.id = cs."campaignId"
WHERE cs.status = 'APPROVED'
ORDER BY cl.views DESC;

