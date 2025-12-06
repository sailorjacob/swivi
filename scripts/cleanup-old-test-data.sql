-- ============================================================
-- CLEANUP OLD TEST CAMPAIGN DATA
-- ============================================================
-- Real Campaign ID (PROTECTED): cd9ad190-a97a-4113-b263-0d391431fba3
-- This script safely removes old test campaigns and related data
-- while preserving your current real live campaign
--
-- Run each section step-by-step, reviewing results before deletions
-- ============================================================

-- ============================================================
-- STEP 1: VERIFY YOUR REAL CAMPAIGN EXISTS
-- ============================================================
SELECT 
  id,
  title,
  status,
  "isTest",
  budget::numeric,
  spent::numeric,
  "createdAt"::date,
  (SELECT COUNT(*) FROM clip_submissions cs WHERE cs."campaignId" = c.id) as submission_count
FROM campaigns c
WHERE id = 'cd9ad190-a97a-4113-b263-0d391431fba3';

-- ============================================================
-- STEP 2: IDENTIFY OLD/TEST CAMPAIGNS TO DELETE
-- ============================================================
SELECT 
  id,
  title,
  status,
  "isTest",
  budget::numeric,
  spent::numeric,
  "deletedAt",
  "createdAt"::date,
  (SELECT COUNT(*) FROM clip_submissions cs WHERE cs."campaignId" = c.id) as submission_count
FROM campaigns c
WHERE id != 'cd9ad190-a97a-4113-b263-0d391431fba3'  -- Exclude real campaign
ORDER BY "createdAt" DESC;

-- ============================================================
-- STEP 3: PREVIEW DATA TO BE DELETED
-- ============================================================

-- 3a. Preview clip submissions from OLD campaigns (NOT your real one)
SELECT 
  cs.id as submission_id,
  cs."userId",
  u.email,
  cs."clipUrl",
  cs.status,
  cs."finalEarnings"::numeric,
  c.title as campaign_title,
  c.status as campaign_status
FROM clip_submissions cs
JOIN campaigns c ON cs."campaignId" = c.id
JOIN users u ON cs."userId" = u.id
WHERE c.id != 'cd9ad190-a97a-4113-b263-0d391431fba3';

-- 3b. Preview clips linked to OLD campaigns
SELECT 
  cl.id as clip_id,
  cl."userId",
  u.email,
  cl.url,
  cl.views::numeric,
  cl.earnings::numeric,
  c.title as campaign_title
FROM clips cl
JOIN clip_submissions cs ON cs."clipId" = cl.id
JOIN campaigns c ON cs."campaignId" = c.id
JOIN users u ON cl."userId" = u.id
WHERE c.id != 'cd9ad190-a97a-4113-b263-0d391431fba3';

-- 3c. Preview ALL payout data (will all be deleted)
SELECT 
  p.id as payout_id,
  p."userId",
  u.email,
  p.amount::numeric,
  p.status,
  p."createdAt"::date
FROM payouts p
JOIN users u ON p."userId" = u.id
ORDER BY p."createdAt" DESC;

-- 3d. Preview ALL payout requests (will all be deleted)
SELECT 
  pr.id,
  pr."userId",
  u.email,
  pr.amount::numeric,
  pr.status,
  pr."requestedAt"::date
FROM payout_requests pr
JOIN users u ON pr."userId" = u.id
ORDER BY pr."requestedAt" DESC;

-- 3e. Preview user earnings - show what they SHOULD have from real campaign only
SELECT 
  u.id,
  u.email,
  u."totalEarnings"::numeric as current_earnings,
  u."totalViews"::numeric as current_views,
  COALESCE((
    SELECT SUM(cl.earnings::numeric)
    FROM clips cl
    JOIN clip_submissions cs ON cs."clipId" = cl.id
    WHERE cl."userId" = u.id
      AND cs.status = 'APPROVED'
      AND cs."campaignId" = 'cd9ad190-a97a-4113-b263-0d391431fba3'
  ), 0) as real_earnings_should_be,
  COALESCE((
    SELECT SUM(cl.views::numeric)
    FROM clips cl
    JOIN clip_submissions cs ON cs."clipId" = cl.id
    WHERE cl."userId" = u.id
      AND cs.status = 'APPROVED'
      AND cs."campaignId" = 'cd9ad190-a97a-4113-b263-0d391431fba3'
  ), 0) as real_views_should_be
FROM users u
WHERE u."totalEarnings" > 0 OR u."totalViews" > 0;

-- ============================================================
-- STEP 4: EXECUTE CLEANUP (RUN AFTER REVIEWING STEP 3!)
-- ============================================================
-- ⚠️ DANGER ZONE - Uncomment and run ONLY after reviewing Step 3
-- Run each statement ONE AT A TIME in order

-- 4a. Delete view_tracking for clips in OLD campaigns
DELETE FROM view_tracking
WHERE "clipId" IN (
  SELECT DISTINCT cl.id
  FROM clips cl
  JOIN clip_submissions cs ON cs."clipId" = cl.id
  WHERE cs."campaignId" != 'cd9ad190-a97a-4113-b263-0d391431fba3'
);

-- 4b. Delete clips from OLD campaigns
DELETE FROM clips
WHERE id IN (
  SELECT DISTINCT cl.id
  FROM clips cl
  JOIN clip_submissions cs ON cs."clipId" = cl.id
  WHERE cs."campaignId" != 'cd9ad190-a97a-4113-b263-0d391431fba3'
);

-- 4c. Delete ALL payout data (all from testing)
DELETE FROM payouts;

-- 4d. Delete ALL payout requests (all from testing)
DELETE FROM payout_requests;

-- 4e. Delete notifications NOT related to real campaign
DELETE FROM notifications
WHERE data IS NULL 
   OR data::text NOT LIKE '%cd9ad190-a97a-4113-b263-0d391431fba3%';

-- 4f. Recalculate user earnings from REAL campaign ONLY
UPDATE users u
SET 
  "totalEarnings" = COALESCE((
    SELECT SUM(cl.earnings::numeric)
    FROM clips cl
    JOIN clip_submissions cs ON cs."clipId" = cl.id
    WHERE cl."userId" = u.id
      AND cs.status = 'APPROVED'
      AND cs."campaignId" = 'cd9ad190-a97a-4113-b263-0d391431fba3'
  ), 0),
  "totalViews" = COALESCE((
    SELECT SUM(cl.views::numeric)
    FROM clips cl
    JOIN clip_submissions cs ON cs."clipId" = cl.id
    WHERE cl."userId" = u.id
      AND cs.status = 'APPROVED'
      AND cs."campaignId" = 'cd9ad190-a97a-4113-b263-0d391431fba3'
  ), 0);

-- 4g. Delete OLD campaigns (submissions CASCADE delete automatically)
DELETE FROM campaigns
WHERE id != 'cd9ad190-a97a-4113-b263-0d391431fba3';

-- ============================================================
-- STEP 5: VERIFY CLEANUP SUCCESS
-- ============================================================

-- 5a. Should show ONLY your real campaign
SELECT id, title, status, "isTest", budget::numeric, spent::numeric 
FROM campaigns;

-- 5b. All submissions should be from real campaign only
SELECT 
  c.title,
  cs.status,
  COUNT(*) as count
FROM clip_submissions cs
JOIN campaigns c ON cs."campaignId" = c.id
GROUP BY c.title, cs.status
ORDER BY c.title, cs.status;

-- 5c. User stats should match real campaign earnings only
SELECT 
  u.id, 
  u.email, 
  u."totalEarnings"::numeric as earnings, 
  u."totalViews"::numeric as views
FROM users u
WHERE u."totalEarnings" > 0 OR u."totalViews" > 0;

-- 5d. Data cleanup verification
SELECT 'Campaigns' as type, COUNT(*) as count FROM campaigns
UNION ALL
SELECT 'Submissions', COUNT(*) FROM clip_submissions
UNION ALL
SELECT 'Clips', COUNT(*) FROM clips
UNION ALL
SELECT 'View tracking records', COUNT(*) FROM view_tracking
UNION ALL
SELECT 'Payouts (should be 0)', COUNT(*) FROM payouts
UNION ALL
SELECT 'Payout requests (should be 0)', COUNT(*) FROM payout_requests;

-- 5e. Verify no orphaned clips
SELECT COUNT(*) as orphaned_clips 
FROM clips 
WHERE id NOT IN (
  SELECT DISTINCT "clipId" 
  FROM clip_submissions 
  WHERE "clipId" IS NOT NULL
);

-- ============================================================
-- REAL CAMPAIGN INTEGRITY CHECK
-- ============================================================
-- Run this to verify your real campaign data is intact

SELECT 
  'Real Campaign Stats' as check_type,
  c.title,
  c.status,
  c.budget::numeric as budget,
  c.spent::numeric as spent,
  (SELECT COUNT(*) FROM clip_submissions cs WHERE cs."campaignId" = c.id) as total_submissions,
  (SELECT COUNT(*) FROM clip_submissions cs WHERE cs."campaignId" = c.id AND cs.status = 'PENDING') as pending,
  (SELECT COUNT(*) FROM clip_submissions cs WHERE cs."campaignId" = c.id AND cs.status = 'APPROVED') as approved,
  (SELECT COUNT(*) FROM clip_submissions cs WHERE cs."campaignId" = c.id AND cs.status = 'REJECTED') as rejected
FROM campaigns c
WHERE c.id = 'cd9ad190-a97a-4113-b263-0d391431fba3';
