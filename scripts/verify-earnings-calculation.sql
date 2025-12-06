-- ============================================================
-- VERIFY EARNINGS CALCULATIONS
-- Check if earnings match: views / 1000 * payoutRate
-- ============================================================

-- 1. Show all approved clips with earnings breakdown
SELECT 
    u.name as user_name,
    cs.id as submission_id,
    cl.views,
    cs."initialViews",
    (cl.views - cs."initialViews") as tracked_views,
    cam."payoutRate" as rate_per_1k,
    cl.earnings as stored_earnings,
    -- What earnings SHOULD be: (views - initialViews) / 1000 * rate
    ROUND(((cl.views - cs."initialViews")::numeric / 1000.0) * cam."payoutRate", 2) as calculated_earnings,
    -- Difference
    ROUND(cl.earnings - (((cl.views - cs."initialViews")::numeric / 1000.0) * cam."payoutRate"), 2) as difference
FROM clip_submissions cs
JOIN users u ON u.id = cs."userId"
JOIN clips cl ON cl.id = cs."clipId"
JOIN campaigns cam ON cam.id = cs."campaignId"
WHERE cs.status = 'APPROVED'
ORDER BY cl.views DESC;


-- 2. Summary totals
SELECT 
    'Total views' as metric,
    SUM(cl.views)::text as value
FROM clip_submissions cs
JOIN clips cl ON cl.id = cs."clipId"
WHERE cs.status = 'APPROVED'
UNION ALL
SELECT 
    'Total stored earnings',
    '$' || ROUND(SUM(cl.earnings)::numeric, 2)::text
FROM clip_submissions cs
JOIN clips cl ON cl.id = cs."clipId"
WHERE cs.status = 'APPROVED'
UNION ALL
SELECT 
    'Campaign payout rate',
    '$' || cam."payoutRate"::text || '/1K'
FROM campaigns cam
WHERE cam."isTest" = false
LIMIT 1;


-- 3. What earnings SHOULD be based on current views
SELECT 
    SUM(cl.views) as total_views,
    cam."payoutRate" as rate,
    ROUND((SUM(cl.views)::numeric / 1000.0) * cam."payoutRate", 2) as expected_earnings,
    SUM(cl.earnings) as stored_earnings,
    ROUND(SUM(cl.earnings) - ((SUM(cl.views)::numeric / 1000.0) * cam."payoutRate"), 2) as difference
FROM clip_submissions cs
JOIN clips cl ON cl.id = cs."clipId"
JOIN campaigns cam ON cam.id = cs."campaignId"
WHERE cs.status = 'APPROVED'
GROUP BY cam."payoutRate";


-- 4. Check campaign budget vs spent
SELECT 
    c.title,
    c.budget,
    c.spent as stored_spent,
    (SELECT COALESCE(SUM(cl.earnings), 0) FROM clip_submissions cs JOIN clips cl ON cl.id = cs."clipId" WHERE cs."campaignId" = c.id AND cs.status = 'APPROVED') as actual_earnings_sum,
    c.budget - c.spent as remaining
FROM campaigns c
WHERE c."isTest" = false;

