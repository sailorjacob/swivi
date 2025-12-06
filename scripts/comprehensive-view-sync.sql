-- ============================================================
-- COMPREHENSIVE VIEW SYNC
-- Make ALL view sources consistent using MAX tracked views
-- ============================================================

-- 1. See the current mess
SELECT 
    u.name,
    cs.status,
    cl.views as clip_views,
    (SELECT MAX(vt.views) FROM view_tracking vt WHERE vt."clipId" = cl.id) as max_tracked,
    (SELECT vt.views FROM view_tracking vt WHERE vt."clipId" = cl.id ORDER BY vt."scrapedAt" DESC LIMIT 1) as latest_tracked,
    cs."initialViews",
    cl.earnings
FROM clip_submissions cs
JOIN users u ON u.id = cs."userId"
JOIN clips cl ON cl.id = cs."clipId"
ORDER BY cl.views DESC;


-- 2. SYNC clip.views to MAX ever tracked (views should never go down)
UPDATE clips cl
SET views = GREATEST(
    cl.views,
    COALESCE((SELECT MAX(vt.views) FROM view_tracking vt WHERE vt."clipId" = cl.id), cl.views)
);


-- 3. Ensure initialViews is 0 for all (clipper earns from ALL views)
UPDATE clip_submissions
SET "initialViews" = 0
WHERE "initialViews" != 0;


-- 4. Recalculate clip earnings: views / 1000 * rate
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


-- 5. Sync user totalViews = SUM of all their approved clip views
UPDATE users u
SET "totalViews" = COALESCE((
    SELECT SUM(cl.views)
    FROM clip_submissions cs
    JOIN clips cl ON cl.id = cs."clipId"
    WHERE cs."userId" = u.id
    AND cs.status = 'APPROVED'
), 0)
WHERE role = 'CLIPPER';


-- 6. Sync user totalEarnings = SUM of all their clip earnings
UPDATE users u
SET "totalEarnings" = COALESCE((
    SELECT SUM(cl.earnings)
    FROM clip_submissions cs
    JOIN clips cl ON cl.id = cs."clipId"
    WHERE cs."userId" = u.id
    AND cs.status = 'APPROVED'
), 0)
WHERE role = 'CLIPPER';


-- 7. Sync campaign spent = SUM of all clip earnings for that campaign
UPDATE campaigns c
SET spent = COALESCE((
    SELECT SUM(cl.earnings)
    FROM clip_submissions cs
    JOIN clips cl ON cl.id = cs."clipId"
    WHERE cs."campaignId" = c.id
    AND cs.status = 'APPROVED'
), 0);


-- 8. VERIFY: Everything should match now
SELECT 
    '=== VERIFICATION ===' as section,
    SUM(cl.views) as total_clip_views,
    SUM(cl.earnings) as total_earnings,
    ROUND(SUM(cl.views)::numeric / 1000.0, 2) as implied_earnings_at_1_per_k
FROM clip_submissions cs
JOIN clips cl ON cl.id = cs."clipId"
WHERE cs.status = 'APPROVED';


-- 9. Show per-user breakdown
SELECT 
    u.name,
    u."totalViews" as user_total_views,
    u."totalEarnings" as user_total_earnings,
    SUM(cl.views) as sum_clip_views,
    SUM(cl.earnings) as sum_clip_earnings,
    CASE 
        WHEN u."totalViews" = SUM(cl.views) THEN '✅'
        ELSE '❌'
    END as views_match,
    CASE 
        WHEN u."totalEarnings" = SUM(cl.earnings) THEN '✅'
        ELSE '❌'
    END as earnings_match
FROM users u
LEFT JOIN clip_submissions cs ON cs."userId" = u.id AND cs.status = 'APPROVED'
LEFT JOIN clips cl ON cl.id = cs."clipId"
WHERE u.role = 'CLIPPER'
GROUP BY u.id, u.name, u."totalViews", u."totalEarnings"
HAVING SUM(cl.views) > 0
ORDER BY u."totalEarnings" DESC;


-- 10. Campaign totals
SELECT 
    c.title,
    c.spent as campaign_spent,
    SUM(cl.earnings) as sum_clip_earnings,
    SUM(cl.views) as total_views,
    CASE 
        WHEN c.spent = SUM(cl.earnings) THEN '✅'
        ELSE '❌'
    END as spent_match
FROM campaigns c
LEFT JOIN clip_submissions cs ON cs."campaignId" = c.id AND cs.status = 'APPROVED'
LEFT JOIN clips cl ON cl.id = cs."clipId"
WHERE c."isTest" = false
GROUP BY c.id, c.title, c.spent
ORDER BY c.spent DESC;

