-- Cleanup Test Campaigns Script
-- Run this BEFORE deleting test campaigns to properly clean all related data
-- ⚠️ REVIEW THE RESULTS OF EACH SELECT BEFORE RUNNING THE DELETE STATEMENTS

-- ============================================================
-- STEP 1: IDENTIFY YOUR TEST CAMPAIGNS
-- ============================================================
-- First, let's see all campaigns to identify the ones you want to delete
SELECT 
  id,
  title,
  status,
  "isTest",
  budget,
  spent,
  "createdAt"
FROM campaigns
ORDER BY "createdAt" DESC;

-- ============================================================
-- STEP 2: SET YOUR CAMPAIGN IDS TO DELETE
-- ============================================================
-- Replace these with your actual test campaign IDs
-- You can get them from the query above

-- Example (replace with your actual IDs):
-- DO $$
-- DECLARE
--   test_campaign_ids TEXT[] := ARRAY['campaign_id_1', 'campaign_id_2'];
-- BEGIN
--   -- rest of cleanup
-- END $$;

-- ============================================================
-- STEP 3: PREVIEW WHAT WILL BE AFFECTED (RUN THESE FIRST!)
-- ============================================================

-- 3a. Preview clip submissions that will be deleted
SELECT 
  cs.id as submission_id,
  cs."userId",
  u.email,
  cs."clipUrl",
  cs."finalEarnings",
  c.title as campaign_title
FROM clip_submissions cs
JOIN campaigns c ON cs."campaignId" = c.id
JOIN users u ON cs."userId" = u.id
WHERE c.title ILIKE '%test%' -- Adjust this filter or use specific IDs
   OR c."isTest" = true;

-- 3b. Preview clips that will become orphaned
SELECT 
  cl.id as clip_id,
  cl."userId",
  u.email,
  cl.url,
  cl.views,
  cl.earnings
FROM clips cl
JOIN clip_submissions cs ON cs."clipId" = cl.id
JOIN campaigns c ON cs."campaignId" = c.id
JOIN users u ON cl."userId" = u.id
WHERE c.title ILIKE '%test%' -- Adjust this filter
   OR c."isTest" = true;

-- 3c. Preview payouts (these need manual cleanup!)
SELECT 
  p.id as payout_id,
  p."userId",
  u.email,
  p.amount,
  p.status,
  p."createdAt"
FROM payouts p
JOIN users u ON p."userId" = u.id
ORDER BY p."createdAt" DESC;

-- 3d. Preview payout requests
SELECT 
  pr.id,
  pr."userId",
  u.email,
  pr.amount,
  pr.status,
  pr."requestedAt"
FROM payout_requests pr
JOIN users u ON pr."userId" = u.id
ORDER BY pr."requestedAt" DESC;

-- 3e. Preview user earnings that will need resetting
SELECT 
  u.id,
  u.email,
  u."totalEarnings",
  u."totalViews"
FROM users u
WHERE u."totalEarnings" > 0 OR u."totalViews" > 0;

-- ============================================================
-- STEP 4: CLEANUP QUERIES (RUN AFTER REVIEWING ABOVE!)
-- ============================================================

-- ⚠️ DANGER ZONE - Only run these after reviewing the SELECT results above!
-- Uncomment and run one at a time

-- 4a. Delete all payouts (if they were all test)
-- DELETE FROM payouts;

-- 4b. Delete all payout requests (if they were all test)
-- DELETE FROM payout_requests;

-- 4c. Delete orphaned clips (clips linked to test campaign submissions)
-- DELETE FROM clips 
-- WHERE id IN (
--   SELECT DISTINCT cl.id
--   FROM clips cl
--   JOIN clip_submissions cs ON cs."clipId" = cl.id
--   JOIN campaigns c ON cs."campaignId" = c.id
--   WHERE c.title ILIKE '%test%' OR c."isTest" = true
-- );

-- 4d. Delete view tracking for test clips
-- DELETE FROM view_tracking
-- WHERE "clipId" IN (
--   SELECT DISTINCT cl.id
--   FROM clips cl
--   JOIN clip_submissions cs ON cs."clipId" = cl.id
--   JOIN campaigns c ON cs."campaignId" = c.id
--   WHERE c.title ILIKE '%test%' OR c."isTest" = true
-- );

-- 4e. Delete notifications related to test campaigns
-- DELETE FROM notifications
-- WHERE data::text ILIKE '%campaign_id_here%';

-- 4f. Reset user earnings to 0 (if all earnings were from tests)
-- UPDATE users SET "totalEarnings" = 0, "totalViews" = 0;

-- 4g. Or recalculate user earnings from remaining real data
-- UPDATE users u
-- SET "totalEarnings" = COALESCE((
--   SELECT SUM(cs."finalEarnings") 
--   FROM clip_submissions cs 
--   JOIN campaigns c ON cs."campaignId" = c.id
--   WHERE cs."userId" = u.id 
--     AND cs.status = 'APPROVED'
--     AND c."deletedAt" IS NULL
--     AND c."isTest" = false
-- ), 0);

-- 4h. Finally, delete the test campaigns (submissions cascade automatically)
-- DELETE FROM campaigns WHERE id IN ('campaign_id_1', 'campaign_id_2');
-- Or by name:
-- DELETE FROM campaigns WHERE title ILIKE '%test%';
-- Or by flag:
-- DELETE FROM campaigns WHERE "isTest" = true;

-- ============================================================
-- STEP 5: VERIFY CLEANUP
-- ============================================================

-- Check remaining campaigns
SELECT id, title, status, "isTest", budget FROM campaigns;

-- Check user stats are clean
SELECT id, email, "totalEarnings", "totalViews" FROM users;

-- Check no orphaned data
SELECT COUNT(*) as orphaned_clips FROM clips WHERE id NOT IN (SELECT DISTINCT "clipId" FROM clip_submissions WHERE "clipId" IS NOT NULL);
SELECT COUNT(*) as remaining_payouts FROM payouts;
SELECT COUNT(*) as remaining_payout_requests FROM payout_requests;




