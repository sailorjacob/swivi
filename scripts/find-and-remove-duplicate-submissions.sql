-- ============================================================
-- DUPLICATE SUBMISSION DETECTION AND CLEANUP SCRIPT
-- ============================================================
-- This script identifies and removes duplicate clip submissions
-- to maintain data integrity and prevent double-tracking of views/earnings.
--
-- A duplicate is defined as:
-- 1. Same exact clipUrl in the same campaign
-- 2. Same user submitting the same video to multiple campaigns
-- 3. Same video URL (normalized) submitted by different users
-- ============================================================

-- ============================================================
-- PART 1: ANALYSIS - Find all duplicate submissions
-- ============================================================

-- 1A: Find exact URL duplicates within the same campaign
SELECT '=== EXACT URL DUPLICATES IN SAME CAMPAIGN ===' as analysis;

SELECT 
    cs."campaignId",
    c.title as campaign_title,
    cs."clipUrl",
    COUNT(*) as duplicate_count,
    STRING_AGG(cs.id, ', ') as submission_ids,
    STRING_AGG(u.email, ', ') as submitted_by
FROM clip_submissions cs
JOIN campaigns c ON cs."campaignId" = c.id
JOIN users u ON cs."userId" = u.id
WHERE cs.status != 'REJECTED'
GROUP BY cs."campaignId", c.title, cs."clipUrl"
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;


-- 1B: Find same user submitting same URL to multiple campaigns
SELECT '=== SAME USER - SAME URL - MULTIPLE CAMPAIGNS ===' as analysis;

SELECT 
    cs."userId",
    u.email,
    cs."clipUrl",
    COUNT(*) as campaign_count,
    STRING_AGG(DISTINCT c.title, ', ') as campaigns,
    STRING_AGG(cs.id, ', ') as submission_ids
FROM clip_submissions cs
JOIN users u ON cs."userId" = u.id
JOIN campaigns c ON cs."campaignId" = c.id
WHERE cs.status != 'REJECTED'
GROUP BY cs."userId", u.email, cs."clipUrl"
HAVING COUNT(DISTINCT cs."campaignId") > 1
ORDER BY campaign_count DESC;


-- 1C: Find potential duplicates based on video ID patterns
-- This catches URLs with slight variations (http/https, www, query params)
SELECT '=== POTENTIAL URL VARIATION DUPLICATES ===' as analysis;

-- Extract video IDs from TikTok URLs (matches /video/XXXXXXXXX pattern)
WITH tiktok_video_ids AS (
    SELECT 
        cs.id as submission_id,
        cs."userId",
        cs."campaignId",
        cs."clipUrl",
        cs.status,
        cs."createdAt",
        -- Extract the video ID from TikTok URLs
        CASE 
            WHEN cs."clipUrl" ~* '/video/([0-9]+)' 
            THEN (regexp_match(cs."clipUrl", '/video/([0-9]+)', 'i'))[1]
            WHEN cs."clipUrl" ~* '/t/([A-Za-z0-9]+)'
            THEN (regexp_match(cs."clipUrl", '/t/([A-Za-z0-9]+)', 'i'))[1]
            WHEN cs."clipUrl" ~* 'vm\.tiktok\.com/([A-Za-z0-9]+)'
            THEN (regexp_match(cs."clipUrl", 'vm\.tiktok\.com/([A-Za-z0-9]+)', 'i'))[1]
            ELSE NULL
        END as video_id
    FROM clip_submissions cs
    WHERE cs.platform = 'TIKTOK' AND cs.status != 'REJECTED'
),
-- Find duplicates by video ID within same campaign
tiktok_duplicates AS (
    SELECT 
        video_id,
        "campaignId",
        COUNT(*) as dup_count,
        STRING_AGG(submission_id, ', ') as submission_ids,
        STRING_AGG("clipUrl", ' | ') as urls
    FROM tiktok_video_ids
    WHERE video_id IS NOT NULL
    GROUP BY video_id, "campaignId"
    HAVING COUNT(*) > 1
)
SELECT * FROM tiktok_duplicates;


-- 1D: YouTube duplicates (video ID extraction)
SELECT '=== YOUTUBE DUPLICATES BY VIDEO ID ===' as analysis;

WITH youtube_video_ids AS (
    SELECT 
        cs.id as submission_id,
        cs."userId",
        cs."campaignId",
        cs."clipUrl",
        cs.status,
        CASE 
            WHEN cs."clipUrl" ~* '/shorts/([A-Za-z0-9_-]+)'
            THEN (regexp_match(cs."clipUrl", '/shorts/([A-Za-z0-9_-]+)', 'i'))[1]
            WHEN cs."clipUrl" ~* 'v=([A-Za-z0-9_-]+)'
            THEN (regexp_match(cs."clipUrl", 'v=([A-Za-z0-9_-]+)', 'i'))[1]
            WHEN cs."clipUrl" ~* 'youtu\.be/([A-Za-z0-9_-]+)'
            THEN (regexp_match(cs."clipUrl", 'youtu\.be/([A-Za-z0-9_-]+)', 'i'))[1]
            ELSE NULL
        END as video_id
    FROM clip_submissions cs
    WHERE cs.platform = 'YOUTUBE' AND cs.status != 'REJECTED'
)
SELECT 
    video_id,
    "campaignId",
    COUNT(*) as dup_count,
    STRING_AGG(submission_id, ', ') as submission_ids,
    STRING_AGG("clipUrl", ' | ') as urls
FROM youtube_video_ids
WHERE video_id IS NOT NULL
GROUP BY video_id, "campaignId"
HAVING COUNT(*) > 1;


-- 1E: Instagram duplicates (reel/post ID extraction)
SELECT '=== INSTAGRAM DUPLICATES BY POST ID ===' as analysis;

WITH instagram_post_ids AS (
    SELECT 
        cs.id as submission_id,
        cs."userId",
        cs."campaignId",
        cs."clipUrl",
        cs.status,
        CASE 
            WHEN cs."clipUrl" ~* '/reel/([A-Za-z0-9_-]+)'
            THEN (regexp_match(cs."clipUrl", '/reel/([A-Za-z0-9_-]+)', 'i'))[1]
            WHEN cs."clipUrl" ~* '/p/([A-Za-z0-9_-]+)'
            THEN (regexp_match(cs."clipUrl", '/p/([A-Za-z0-9_-]+)', 'i'))[1]
            ELSE NULL
        END as post_id
    FROM clip_submissions cs
    WHERE cs.platform = 'INSTAGRAM' AND cs.status != 'REJECTED'
)
SELECT 
    post_id,
    "campaignId",
    COUNT(*) as dup_count,
    STRING_AGG(submission_id, ', ') as submission_ids,
    STRING_AGG("clipUrl", ' | ') as urls
FROM instagram_post_ids
WHERE post_id IS NOT NULL
GROUP BY post_id, "campaignId"
HAVING COUNT(*) > 1;


-- ============================================================
-- PART 2: SUMMARY COUNTS
-- ============================================================

SELECT '=== DUPLICATE SUMMARY ===' as analysis;

-- Count of exact duplicates per campaign
SELECT 
    c.title as campaign,
    COUNT(*) as total_submissions,
    COUNT(*) - COUNT(DISTINCT cs."clipUrl") as exact_duplicates
FROM clip_submissions cs
JOIN campaigns c ON cs."campaignId" = c.id
WHERE cs.status != 'REJECTED'
GROUP BY c.title
HAVING COUNT(*) > COUNT(DISTINCT cs."clipUrl")
ORDER BY exact_duplicates DESC;


-- ============================================================
-- PART 3: CLEANUP - SOFT DELETE DUPLICATES
-- ============================================================
-- This section marks duplicates as REJECTED to preserve history
-- while removing them from active tracking.
--
-- Strategy: Keep the OLDEST submission (first submitted), reject newer ones
-- ============================================================

-- Preview what will be rejected (DRY RUN)
SELECT '=== DUPLICATES TO BE REJECTED (PREVIEW) ===' as action;

WITH duplicates_to_reject AS (
    SELECT 
        cs.id,
        cs."clipUrl",
        cs."campaignId",
        cs."userId",
        cs."createdAt",
        cs.status,
        ROW_NUMBER() OVER (
            PARTITION BY cs."clipUrl", cs."campaignId" 
            ORDER BY cs."createdAt" ASC
        ) as rn
    FROM clip_submissions cs
    WHERE cs.status NOT IN ('REJECTED')
)
SELECT 
    d.id,
    d."clipUrl",
    c.title as campaign,
    u.email as submitted_by,
    d."createdAt",
    d.status as current_status,
    'Will be REJECTED (duplicate)' as action
FROM duplicates_to_reject d
JOIN campaigns c ON d."campaignId" = c.id
JOIN users u ON d."userId" = u.id
WHERE d.rn > 1
ORDER BY d."campaignId", d."clipUrl", d."createdAt";


-- ============================================================
-- PART 4: EXECUTE CLEANUP (UNCOMMENT TO RUN)
-- ============================================================

-- CAUTION: Review the preview above before running these commands!

/*
-- Step 1: Mark duplicate submissions as REJECTED (keep oldest)
UPDATE clip_submissions
SET 
    status = 'REJECTED',
    "rejectionReason" = 'Duplicate submission - same URL was already submitted',
    "autoRejected" = true,
    "updatedAt" = NOW()
WHERE id IN (
    SELECT id FROM (
        SELECT 
            cs.id,
            ROW_NUMBER() OVER (
                PARTITION BY cs."clipUrl", cs."campaignId" 
                ORDER BY cs."createdAt" ASC
            ) as rn
        FROM clip_submissions cs
        WHERE cs.status NOT IN ('REJECTED')
    ) ranked
    WHERE rn > 1
);

-- Step 2: Also handle cross-campaign duplicates (same user, same video)
-- Keep the oldest submission, reject others
UPDATE clip_submissions
SET 
    status = 'REJECTED',
    "rejectionReason" = 'Cross-campaign duplicate - video already submitted to another campaign',
    "autoRejected" = true,
    "updatedAt" = NOW()
WHERE id IN (
    SELECT id FROM (
        SELECT 
            cs.id,
            ROW_NUMBER() OVER (
                PARTITION BY cs."userId", cs."clipUrl"
                ORDER BY cs."createdAt" ASC
            ) as rn
        FROM clip_submissions cs
        WHERE cs.status NOT IN ('REJECTED')
    ) ranked
    WHERE rn > 1
);
*/


-- ============================================================
-- PART 5: VERIFY CLEANUP
-- ============================================================

SELECT '=== POST-CLEANUP VERIFICATION ===' as verification;

-- Count remaining duplicates (should be 0 after cleanup)
SELECT 
    'Remaining exact duplicates' as check_type,
    COUNT(*) as count
FROM (
    SELECT cs."clipUrl", cs."campaignId"
    FROM clip_submissions cs
    WHERE cs.status NOT IN ('REJECTED')
    GROUP BY cs."clipUrl", cs."campaignId"
    HAVING COUNT(*) > 1
) as dups;

-- Count rejected duplicates
SELECT 
    'Submissions rejected as duplicates' as check_type,
    COUNT(*) as count
FROM clip_submissions
WHERE status = 'REJECTED' 
AND "rejectionReason" LIKE '%duplicate%';

