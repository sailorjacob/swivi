-- ================================================================
-- FIX: Clips where initialViews equals current views
-- These clips are NOT earning for clippers because their growth = 0
-- ================================================================

-- STEP 1: Find all affected clips
SELECT '=== CLIPS WITH initialViews = currentViews (NOT EARNING) ===' as section;

SELECT 
    cs.id as submission_id,
    u.name as clipper_name,
    u.email as clipper_email,
    c.views as current_views,
    cs."initialViews" as initial_views,
    c.views - COALESCE(cs."initialViews", 0) as views_counted_for_earnings,
    c.earnings as current_earnings,
    camp.title as campaign_title,
    cs."createdAt" as submission_date,
    SUBSTRING(cs."clipUrl", 1, 60) as clip_url
FROM clip_submissions cs
JOIN clips c ON cs."clipId" = c.id
JOIN users u ON cs."userId" = u.id
JOIN campaigns camp ON cs."campaignId" = camp.id
WHERE cs.status = 'APPROVED'
  AND camp."deletedAt" IS NULL
  AND camp."isTest" = false
  AND cs."initialViews" IS NOT NULL
  AND cs."initialViews" > 0
  AND cs."initialViews" = c.views
ORDER BY c.views DESC;

-- STEP 2: Count how many are affected
SELECT '=== TOTAL AFFECTED CLIPS ===' as section;

SELECT 
    COUNT(*) as clips_not_earning,
    COALESCE(SUM(c.views), 0) as total_views_not_counted,
    -- Calculate what earnings SHOULD be (views / 1000 * $1 rate approximately)
    ROUND(COALESCE(SUM(c.views), 0)::numeric / 1000 * 1, 2) as estimated_missed_earnings
FROM clip_submissions cs
JOIN clips c ON cs."clipId" = c.id
JOIN campaigns camp ON cs."campaignId" = camp.id
WHERE cs.status = 'APPROVED'
  AND camp."deletedAt" IS NULL
  AND camp."isTest" = false
  AND cs."initialViews" IS NOT NULL
  AND cs."initialViews" > 0
  AND cs."initialViews" = c.views;

-- STEP 3: Also find clips where initialViews > 0 but less than current (partial issue)
SELECT '=== CLIPS WITH initialViews > 0 (may be missing some views) ===' as section;

SELECT 
    cs.id as submission_id,
    u.name as clipper_name,
    c.views as current_views,
    cs."initialViews" as initial_views,
    c.views - COALESCE(cs."initialViews", 0) as views_currently_counted,
    c.views as views_should_be_counted,
    cs."initialViews" as views_being_missed,
    camp.title as campaign_title
FROM clip_submissions cs
JOIN clips c ON cs."clipId" = c.id
JOIN users u ON cs."userId" = u.id
JOIN campaigns camp ON cs."campaignId" = camp.id
WHERE cs.status = 'APPROVED'
  AND camp."deletedAt" IS NULL
  AND camp."isTest" = false
  AND cs."initialViews" IS NOT NULL
  AND cs."initialViews" > 0
ORDER BY cs."initialViews" DESC;

-- ================================================================
-- FIX: Reset all initialViews to 0 for affected clips
-- This ensures ALL views count for earnings
-- ================================================================

-- STEP 4: Preview what will be fixed
SELECT '=== PREVIEW: CLIPS TO BE FIXED ===' as section;

SELECT 
    COUNT(*) as clips_to_fix,
    COALESCE(SUM(cs."initialViews"), 0) as total_initial_views_to_reset
FROM clip_submissions cs
JOIN clips c ON cs."clipId" = c.id
JOIN campaigns camp ON cs."campaignId" = camp.id
WHERE cs.status = 'APPROVED'
  AND camp."deletedAt" IS NULL
  AND camp."isTest" = false
  AND cs."initialViews" IS NOT NULL
  AND cs."initialViews" > 0;

-- ================================================================
-- UNCOMMENT THE FOLLOWING TO APPLY THE FIX:
-- ================================================================

-- STEP 5: Reset initialViews to 0 for all approved submissions
/*
UPDATE clip_submissions cs
SET "initialViews" = 0
FROM campaigns camp
WHERE cs."campaignId" = camp.id
  AND cs.status = 'APPROVED'
  AND camp."deletedAt" IS NULL
  AND camp."isTest" = false
  AND cs."initialViews" IS NOT NULL
  AND cs."initialViews" > 0;
*/

-- STEP 6: After reset, recalculate earnings for affected clips
-- This needs to be done by triggering a new scrape or running the earnings calculation

