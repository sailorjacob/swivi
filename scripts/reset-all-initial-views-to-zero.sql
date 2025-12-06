-- ============================================================
-- RESET ALL INITIAL VIEWS TO ZERO
-- This makes all clippers earn from their FULL view count
-- Run this in Supabase SQL Editor
-- ============================================================

-- STEP 1: See what we're about to change
SELECT 
    cs.id,
    u.name,
    cs."initialViews" as old_initial_views,
    cl.views as current_views,
    cl.earnings as old_earnings,
    -- New earnings will be: currentViews / 1000 * payoutRate
    ROUND((cl.views::numeric / 1000.0) * cam."payoutRate", 2) as new_earnings,
    cam."payoutRate"
FROM clip_submissions cs
JOIN users u ON u.id = cs."userId"
LEFT JOIN clips cl ON cl.id = cs."clipId"
JOIN "Campaign" cam ON cam.id = cs."campaignId"
WHERE cs.status = 'APPROVED'
AND cs."initialViews" > 0
ORDER BY cs."initialViews" DESC;


-- STEP 2: Reset ALL initialViews to 0
UPDATE clip_submissions
SET "initialViews" = 0;


-- STEP 3: Recalculate clip earnings based on full view count
-- earnings = currentViews / 1000 * payoutRate
UPDATE clips cl
SET earnings = COALESCE((
    SELECT ROUND((cl.views::numeric / 1000.0) * cam."payoutRate", 2)
    FROM clip_submissions cs
    JOIN "Campaign" cam ON cam.id = cs."campaignId"
    WHERE cs."clipId" = cl.id
    AND cs.status = 'APPROVED'
    LIMIT 1
), 0)
WHERE id IN (
    SELECT "clipId" FROM clip_submissions WHERE status = 'APPROVED' AND "clipId" IS NOT NULL
);


-- STEP 4: Recalculate user totalEarnings (sum of all their clip earnings)
UPDATE users u
SET "totalEarnings" = COALESCE((
    SELECT SUM(cl.earnings)
    FROM clip_submissions cs
    JOIN clips cl ON cl.id = cs."clipId"
    WHERE cs."userId" = u.id
    AND cs.status = 'APPROVED'
), 0)
WHERE role = 'CLIPPER';


-- STEP 5: Recalculate campaign spent (sum of all clip earnings for that campaign)
UPDATE "Campaign" c
SET spent = COALESCE((
    SELECT SUM(cl.earnings)
    FROM clip_submissions cs
    JOIN clips cl ON cl.id = cs."clipId"
    WHERE cs."campaignId" = c.id
    AND cs.status = 'APPROVED'
), 0);


-- STEP 6: Verify the changes
SELECT 
    '=== VERIFICATION ===' as info,
    COUNT(*) as total_submissions,
    SUM(CASE WHEN "initialViews" = 0 THEN 1 ELSE 0 END) as now_zero,
    SUM(CASE WHEN "initialViews" > 0 THEN 1 ELSE 0 END) as still_nonzero
FROM clip_submissions;

-- Show updated earnings
SELECT 
    u.name,
    u."totalEarnings" as user_total,
    COUNT(cs.id) as clips,
    SUM(cl.earnings) as sum_clip_earnings
FROM users u
LEFT JOIN clip_submissions cs ON cs."userId" = u.id AND cs.status = 'APPROVED'
LEFT JOIN clips cl ON cl.id = cs."clipId"
WHERE u.role = 'CLIPPER'
AND u."totalEarnings" > 0
GROUP BY u.id, u.name, u."totalEarnings"
ORDER BY u."totalEarnings" DESC;

