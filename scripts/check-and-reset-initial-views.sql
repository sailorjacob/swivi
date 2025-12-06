-- ============================================================
-- CHECK AND RESET INITIAL VIEWS
-- Shows all submissions with non-zero initialViews
-- Then provides script to reset them all to 0
-- ============================================================

-- 1. CHECK: Which submissions have non-zero initialViews?
SELECT 
    '=== SUBMISSIONS WITH NON-ZERO INITIAL VIEWS ===' as section;

SELECT 
    cs.id as submission_id,
    u.name as user_name,
    u.email,
    cs.platform,
    cs."initialViews",
    cl.views as current_views,
    cl.earnings,
    cs.status,
    cs."createdAt" as submitted_at,
    cam.title as campaign
FROM clip_submissions cs
JOIN users u ON u.id = cs."userId"
LEFT JOIN clips cl ON cl.id = cs."clipId"
JOIN "Campaign" cam ON cam.id = cs."campaignId"
WHERE cs."initialViews" > 0
ORDER BY cs."initialViews" DESC;


-- 2. SUMMARY: Count by status
SELECT 
    '=== SUMMARY BY STATUS ===' as section;

SELECT 
    status,
    COUNT(*) as count,
    SUM(CASE WHEN "initialViews" > 0 THEN 1 ELSE 0 END) as with_initial_views,
    SUM(CASE WHEN "initialViews" = 0 THEN 1 ELSE 0 END) as zero_initial_views
FROM clip_submissions
GROUP BY status;


-- ============================================================
-- RESET SCRIPT (UNCOMMENT TO RUN)
-- This will set ALL initialViews to 0
-- ============================================================

/*
-- STEP 1: Reset all initialViews to 0
UPDATE clip_submissions
SET "initialViews" = 0
WHERE "initialViews" > 0;

-- STEP 2: Recalculate earnings for all approved clips
-- Earnings = (currentViews - initialViews) / 1000 * payoutRate
-- Since initialViews is now 0, earnings = currentViews / 1000 * payoutRate
UPDATE clips cl
SET earnings = (
    SELECT ROUND((cl.views::numeric / 1000.0) * cam."payoutRate", 2)
    FROM clip_submissions cs
    JOIN "Campaign" cam ON cam.id = cs."campaignId"
    WHERE cs."clipId" = cl.id
    AND cs.status = 'APPROVED'
    LIMIT 1
)
WHERE EXISTS (
    SELECT 1 FROM clip_submissions cs
    WHERE cs."clipId" = cl.id
    AND cs.status = 'APPROVED'
);

-- STEP 3: Recalculate user totalEarnings
UPDATE users u
SET "totalEarnings" = COALESCE((
    SELECT SUM(cl.earnings)
    FROM clip_submissions cs
    JOIN clips cl ON cl.id = cs."clipId"
    WHERE cs."userId" = u.id
    AND cs.status = 'APPROVED'
), 0)
WHERE role = 'CLIPPER';

-- STEP 4: Recalculate campaign spent
UPDATE "Campaign" c
SET spent = COALESCE((
    SELECT SUM(cl.earnings)
    FROM clip_submissions cs
    JOIN clips cl ON cl.id = cs."clipId"
    WHERE cs."campaignId" = c.id
    AND cs.status = 'APPROVED'
), 0);
*/


-- ============================================================
-- VERIFY AFTER RESET (run after uncommenting above)
-- ============================================================

/*
SELECT 
    '=== VERIFICATION AFTER RESET ===' as section;

SELECT 
    COUNT(*) as total_submissions,
    SUM(CASE WHEN "initialViews" > 0 THEN 1 ELSE 0 END) as still_have_initial_views,
    SUM(CASE WHEN "initialViews" = 0 THEN 1 ELSE 0 END) as reset_to_zero
FROM clip_submissions;
*/

