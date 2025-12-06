-- ============================================================
-- VERIFY CAMPAIGN DATA BEFORE CLEANUP
-- ============================================================
-- Run this in your Supabase SQL Editor to verify the campaign ID
-- is correct and see what data will be protected vs deleted

-- ============================================================
-- STEP 1: CHECK IF YOUR CAMPAIGN ID EXISTS
-- ============================================================
SELECT 
  '✅ REAL CAMPAIGN' as check_type,
  id,
  title,
  status,
  "isTest",
  budget::numeric,
  spent::numeric,
  "createdAt"::date
FROM campaigns
WHERE id = 'cd9ad190-a97a-4113-b263-0d391431fba3';

-- ============================================================
-- STEP 2: LIST ALL CAMPAIGNS (to compare)
-- ============================================================
SELECT 
  CASE WHEN id = 'cd9ad190-a97a-4113-b263-0d391431fba3' THEN '→ PROTECT' ELSE '  DELETE' END as action,
  id,
  title,
  status,
  "isTest",
  "deletedAt" IS NOT NULL as is_soft_deleted,
  budget::numeric,
  (SELECT COUNT(*) FROM clip_submissions cs WHERE cs."campaignId" = c.id) as submissions
FROM campaigns c
ORDER BY "createdAt" DESC;

-- ============================================================
-- STEP 3: DATA TO BE PROTECTED (Real Campaign)
-- ============================================================
SELECT 
  'PROTECTED SUBMISSIONS' as category,
  cs.status,
  COUNT(*) as count
FROM clip_submissions cs
WHERE cs."campaignId" = 'cd9ad190-a97a-4113-b263-0d391431fba3'
GROUP BY cs.status;

-- Protected clips
SELECT 
  'PROTECTED CLIPS' as category,
  COUNT(*) as count
FROM clips cl
JOIN clip_submissions cs ON cs."clipId" = cl.id
WHERE cs."campaignId" = 'cd9ad190-a97a-4113-b263-0d391431fba3';

-- Protected view tracking
SELECT 
  'PROTECTED VIEW_TRACKING' as category,
  COUNT(*) as count
FROM view_tracking vt
WHERE vt."clipId" IN (
  SELECT cl.id FROM clips cl
  JOIN clip_submissions cs ON cs."clipId" = cl.id
  WHERE cs."campaignId" = 'cd9ad190-a97a-4113-b263-0d391431fba3'
);

-- ============================================================
-- STEP 4: DATA TO BE DELETED (Old Campaigns)
-- ============================================================
SELECT 
  'TO DELETE: CAMPAIGNS' as category,
  COUNT(*) as count
FROM campaigns
WHERE id != 'cd9ad190-a97a-4113-b263-0d391431fba3';

SELECT 
  'TO DELETE: SUBMISSIONS' as category,
  COUNT(*) as count
FROM clip_submissions
WHERE "campaignId" != 'cd9ad190-a97a-4113-b263-0d391431fba3';

SELECT 
  'TO DELETE: CLIPS' as category,
  COUNT(*) as count
FROM clips cl
WHERE EXISTS (
  SELECT 1 FROM clip_submissions cs 
  WHERE cs."clipId" = cl.id 
  AND cs."campaignId" != 'cd9ad190-a97a-4113-b263-0d391431fba3'
);

SELECT 
  'TO DELETE: ALL PAYOUTS' as category,
  COUNT(*) as count
FROM payouts;

SELECT 
  'TO DELETE: ALL PAYOUT_REQUESTS' as category,
  COUNT(*) as count
FROM payout_requests;

-- ============================================================
-- STEP 5: USER EARNINGS COMPARISON
-- ============================================================
-- Shows what users currently have vs what they SHOULD have from real campaign only
SELECT 
  u.email,
  u."totalEarnings"::numeric as current_earnings,
  COALESCE((
    SELECT SUM(cl.earnings::numeric)
    FROM clips cl
    JOIN clip_submissions cs ON cs."clipId" = cl.id
    WHERE cl."userId" = u.id
      AND cs.status = 'APPROVED'
      AND cs."campaignId" = 'cd9ad190-a97a-4113-b263-0d391431fba3'
  ), 0) as real_campaign_earnings,
  u."totalViews"::numeric as current_views,
  COALESCE((
    SELECT SUM(cl.views::numeric)
    FROM clips cl
    JOIN clip_submissions cs ON cs."clipId" = cl.id
    WHERE cl."userId" = u.id
      AND cs.status = 'APPROVED'
      AND cs."campaignId" = 'cd9ad190-a97a-4113-b263-0d391431fba3'
  ), 0) as real_campaign_views
FROM users u
WHERE u."totalEarnings" > 0 OR u."totalViews" > 0
ORDER BY u."totalEarnings" DESC;

