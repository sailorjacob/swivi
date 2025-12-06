-- ============================================================
-- VERIFY RESET WAS COMPLETE
-- Run this after the reset script to see all submissions
-- ============================================================

-- 1. ALL submissions with their current state
SELECT 
    cs.id as submission_id,
    u.name as user_name,
    cs.status,
    cs."initialViews",
    cl.views as current_views,
    cl.earnings,
    cs."createdAt"
FROM clip_submissions cs
JOIN users u ON u.id = cs."userId"
LEFT JOIN clips cl ON cl.id = cs."clipId"
ORDER BY cs."createdAt" DESC;


-- 2. Count summary
SELECT 
    'Total submissions' as metric,
    COUNT(*) as value
FROM clip_submissions
UNION ALL
SELECT 
    'With initialViews = 0',
    COUNT(*)
FROM clip_submissions
WHERE "initialViews" = 0
UNION ALL
SELECT 
    'With initialViews > 0 (SHOULD BE 0!)',
    COUNT(*)
FROM clip_submissions
WHERE "initialViews" > 0
UNION ALL
SELECT 
    'Approved submissions',
    COUNT(*)
FROM clip_submissions
WHERE status = 'APPROVED'
UNION ALL
SELECT 
    'Pending submissions',
    COUNT(*)
FROM clip_submissions
WHERE status = 'PENDING';


-- 3. User earnings summary
SELECT 
    u.name,
    u.email,
    u."totalEarnings",
    (SELECT COUNT(*) FROM clip_submissions cs WHERE cs."userId" = u.id) as total_submissions,
    (SELECT COUNT(*) FROM clip_submissions cs WHERE cs."userId" = u.id AND cs.status = 'APPROVED') as approved,
    (SELECT COALESCE(SUM(cl.earnings), 0) FROM clip_submissions cs JOIN clips cl ON cl.id = cs."clipId" WHERE cs."userId" = u.id AND cs.status = 'APPROVED') as sum_clip_earnings
FROM users u
WHERE u.role = 'CLIPPER'
ORDER BY u."totalEarnings" DESC;


-- 4. Campaign budget status
SELECT 
    c.title,
    c.budget,
    c.spent,
    c.budget - c.spent as remaining,
    (SELECT COUNT(*) FROM clip_submissions cs WHERE cs."campaignId" = c.id AND cs.status = 'APPROVED') as approved_clips
FROM campaigns c
WHERE c."isTest" = false
ORDER BY c.spent DESC;

