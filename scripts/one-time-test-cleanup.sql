-- ============================================================
-- ONE-TIME TEST DATA CLEANUP
-- Run this to wipe all test campaign data before launching real campaigns
-- ⚠️ This is destructive - only run once before going live!
-- ============================================================

-- STEP 1: PREVIEW - See what will be affected
-- ============================================================

-- All campaigns
SELECT id, title, status, "isTest", budget, spent, "createdAt" 
FROM campaigns ORDER BY "createdAt" DESC;

-- All payouts (should all be test)
SELECT p.id, u.email, p.amount, p.status, p."createdAt"
FROM payouts p 
JOIN users u ON p."userId" = u.id
ORDER BY p."createdAt" DESC;

-- All payout requests
SELECT pr.id, u.email, pr.amount, pr.status, pr."requestedAt"
FROM payout_requests pr
JOIN users u ON pr."userId" = u.id
ORDER BY pr."requestedAt" DESC;

-- Users with earnings
SELECT id, email, name, "totalEarnings", "totalViews", role 
FROM users 
WHERE "totalEarnings" > 0 OR "totalViews" > 0
ORDER BY "totalEarnings" DESC;

-- All clips
SELECT c.id, u.email, c.url, c.views, c.earnings
FROM clips c
JOIN users u ON c."userId" = u.id
ORDER BY c."createdAt" DESC;

-- ============================================================
-- STEP 2: WIPE EVERYTHING (uncomment and run after reviewing above)
-- ============================================================

-- 2a. Delete all payouts
-- DELETE FROM payouts;

-- 2b. Delete all payout requests  
-- DELETE FROM payout_requests;

-- 2c. Delete all view tracking records
-- DELETE FROM view_tracking;

-- 2d. Delete all clips
-- DELETE FROM clips;

-- 2e. Delete all clip submissions
-- DELETE FROM clip_submissions;

-- 2f. Delete all bounty applications
-- DELETE FROM bounty_applications;

-- 2g. Delete notifications (optional - might want to keep system ones)
-- DELETE FROM notifications WHERE type IN ('SUBMISSION_APPROVED', 'SUBMISSION_REJECTED', 'PAYOUT_PROCESSED', 'PAYOUT_REQUESTED', 'CAMPAIGN_COMPLETED', 'PAYOUT_READY');

-- 2h. Reset all user earnings to 0 (keep the users, just reset stats)
-- UPDATE users SET "totalEarnings" = 0, "totalViews" = 0;

-- 2i. Delete the test campaigns
-- Replace with your actual campaign IDs, or delete all:
-- DELETE FROM campaigns;
-- Or specific ones:
-- DELETE FROM campaigns WHERE id IN ('campaign_id_1', 'campaign_id_2');

-- ============================================================
-- STEP 3: VERIFY CLEAN SLATE
-- ============================================================

-- Should all be empty or zero:
SELECT 'campaigns' as table_name, COUNT(*) as count FROM campaigns
UNION ALL SELECT 'clip_submissions', COUNT(*) FROM clip_submissions
UNION ALL SELECT 'clips', COUNT(*) FROM clips
UNION ALL SELECT 'payouts', COUNT(*) FROM payouts
UNION ALL SELECT 'payout_requests', COUNT(*) FROM payout_requests
UNION ALL SELECT 'view_tracking', COUNT(*) FROM view_tracking;

-- Users should have 0 earnings
SELECT id, email, "totalEarnings", "totalViews" FROM users;

-- ============================================================
-- DONE! Platform is clean for first real campaign
-- ============================================================













