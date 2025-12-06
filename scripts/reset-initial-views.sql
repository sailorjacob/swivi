-- Reset Initial Views Script
-- This sets initialViews to 0 for submissions so ALL views count towards earnings
-- Run this ONCE to fix submissions that had delayed initial scrapes

-- ============================================
-- STEP 1: Preview what will be changed
-- ============================================

-- See current state of submissions with their initial views
SELECT 
    cs.id as submission_id,
    u.name as user_name,
    u.email as user_email,
    c.title as campaign_title,
    cs.platform,
    cs.status,
    cs."initialViews" as current_initial_views,
    cl.views as current_total_views,
    (COALESCE(cl.views, 0) - COALESCE(cs."initialViews", 0)) as current_tracked_growth,
    COALESCE(cl.views, 0) as views_after_reset,
    cl.earnings as current_earnings
FROM clip_submissions cs
JOIN users u ON cs."userId" = u.id
JOIN campaigns c ON cs."campaignId" = c.id
LEFT JOIN clips cl ON cs."clipId" = cl.id
WHERE cs."initialViews" > 0
ORDER BY cs."initialViews" DESC;

-- Count how many submissions will be affected
SELECT 
    COUNT(*) as total_submissions_to_reset,
    SUM(cs."initialViews") as total_initial_views_being_zeroed,
    c.title as campaign_title
FROM clip_submissions cs
JOIN campaigns c ON cs."campaignId" = c.id
WHERE cs."initialViews" > 0
GROUP BY c.title;

-- ============================================
-- STEP 2: Reset ALL submissions' initialViews to 0
-- ============================================
-- UNCOMMENT THE LINE BELOW TO RUN:

-- UPDATE clip_submissions SET "initialViews" = 0 WHERE "initialViews" > 0;

-- ============================================
-- STEP 3: Reset for a SPECIFIC CAMPAIGN only
-- ============================================
-- Replace 'YOUR_CAMPAIGN_ID' with the actual campaign ID
-- UNCOMMENT TO RUN:

-- UPDATE clip_submissions 
-- SET "initialViews" = 0 
-- WHERE "campaignId" = 'YOUR_CAMPAIGN_ID' AND "initialViews" > 0;

-- ============================================
-- STEP 4: Recalculate clip earnings after reset
-- ============================================
-- After resetting initialViews, the earnings need to be recalculated
-- This updates clip.earnings based on full view count
-- UNCOMMENT TO RUN:

-- UPDATE clips cl
-- SET earnings = ROUND((COALESCE(cl.views, 0)::numeric / 1000) * c."payoutRate", 2)
-- FROM clip_submissions cs
-- JOIN campaigns c ON cs."campaignId" = c.id
-- WHERE cs."clipId" = cl.id
-- AND cs.status = 'APPROVED';

-- ============================================
-- STEP 5: Update user totalEarnings
-- ============================================
-- Recalculate user totals based on their clips
-- UNCOMMENT TO RUN:

-- UPDATE users u
-- SET "totalEarnings" = COALESCE(
--     (SELECT SUM(COALESCE(cl.earnings, 0))
--      FROM clips cl
--      JOIN clip_submissions cs ON cs."clipId" = cl.id
--      WHERE cs."userId" = u.id
--      AND cs.status IN ('APPROVED', 'PAID')),
--     0
-- );

-- ============================================
-- VERIFICATION: Check the results
-- ============================================

-- After running the updates, run this to verify:
-- SELECT 
--     cs.id,
--     u.name,
--     c.title,
--     cs."initialViews",
--     cl.views,
--     cl.earnings
-- FROM clip_submissions cs
-- JOIN users u ON cs."userId" = u.id
-- JOIN campaigns c ON cs."campaignId" = c.id
-- LEFT JOIN clips cl ON cs."clipId" = cl.id
-- WHERE cs.status = 'APPROVED'
-- ORDER BY cl.earnings DESC;

