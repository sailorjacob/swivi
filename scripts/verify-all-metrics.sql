-- ============================================================
-- COMPREHENSIVE METRICS VERIFICATION SCRIPT
-- Run this in Supabase SQL Editor to verify all platform metrics
-- ============================================================

-- 1. CAMPAIGN SUBMISSIONS VERIFICATION
-- ============================================================
SELECT 
    '=== CAMPAIGN SUBMISSIONS VERIFICATION ===' as section;

-- Check if submissions counts match across different queries
SELECT 
    c.id as campaign_id,
    c.title as campaign_title,
    c.status,
    -- Total submissions
    (SELECT COUNT(*) FROM "ClipSubmission" WHERE "campaignId" = c.id) as total_submissions,
    -- By status breakdown
    (SELECT COUNT(*) FROM "ClipSubmission" WHERE "campaignId" = c.id AND status = 'PENDING') as pending_submissions,
    (SELECT COUNT(*) FROM "ClipSubmission" WHERE "campaignId" = c.id AND status = 'APPROVED') as approved_submissions,
    (SELECT COUNT(*) FROM "ClipSubmission" WHERE "campaignId" = c.id AND status = 'REJECTED') as rejected_submissions,
    (SELECT COUNT(*) FROM "ClipSubmission" WHERE "campaignId" = c.id AND status = 'PAID') as paid_submissions,
    -- Verify total = sum of statuses
    CASE WHEN 
        (SELECT COUNT(*) FROM "ClipSubmission" WHERE "campaignId" = c.id) = 
        (SELECT COUNT(*) FROM "ClipSubmission" WHERE "campaignId" = c.id AND status = 'PENDING') +
        (SELECT COUNT(*) FROM "ClipSubmission" WHERE "campaignId" = c.id AND status = 'APPROVED') +
        (SELECT COUNT(*) FROM "ClipSubmission" WHERE "campaignId" = c.id AND status = 'REJECTED') +
        (SELECT COUNT(*) FROM "ClipSubmission" WHERE "campaignId" = c.id AND status = 'PAID') +
        (SELECT COUNT(*) FROM "ClipSubmission" WHERE "campaignId" = c.id AND status = 'FLAGGED')
    THEN '✅ OK' ELSE '❌ MISMATCH' END as status_check
FROM "Campaign" c
WHERE c."isTest" = false
ORDER BY c."createdAt" DESC;


-- 2. VIEW TRACKING VERIFICATION
-- ============================================================
SELECT 
    '=== VIEW TRACKING VERIFICATION ===' as section;

-- Compare stored totalViews vs calculated from view_tracking
SELECT 
    u.id as user_id,
    u.name as user_name,
    u.email,
    u."totalViews" as stored_total_views,
    COALESCE(
        (SELECT SUM(
            GREATEST(0, 
                COALESCE((SELECT vt.views FROM "ViewTracking" vt WHERE vt."clipId" = cs.clips.id ORDER BY vt.date DESC LIMIT 1), 0) - 
                COALESCE(cs."initialViews", 0)
            )
        )
        FROM "ClipSubmission" cs
        JOIN "Clip" ON "Clip".id = cs."clipId"
        WHERE cs."userId" = u.id AND cs.status IN ('APPROVED', 'PAID')
        ), 0
    ) as calculated_views_gained,
    CASE WHEN u."totalViews" > 0 THEN 'Has stored views' ELSE 'No stored views' END as views_status
FROM "User" u
WHERE u.role = 'CLIPPER'
AND EXISTS (SELECT 1 FROM "ClipSubmission" WHERE "userId" = u.id AND status IN ('APPROVED', 'PAID'))
ORDER BY u."totalViews" DESC
LIMIT 20;


-- 3. EARNINGS VERIFICATION
-- ============================================================
SELECT 
    '=== EARNINGS VERIFICATION ===' as section;

-- Compare user totalEarnings vs sum of clip earnings
SELECT 
    u.id as user_id,
    u.name as user_name,
    u."totalEarnings" as stored_total_earnings,
    COALESCE((
        SELECT SUM(CAST(cl.earnings AS DECIMAL))
        FROM "ClipSubmission" cs
        JOIN "Clip" cl ON cl.id = cs."clipId"
        WHERE cs."userId" = u.id AND cs.status IN ('APPROVED', 'PAID')
    ), 0) as sum_of_clip_earnings,
    COALESCE((
        SELECT SUM(CAST(p.amount AS DECIMAL))
        FROM "Payout" p
        WHERE p."userId" = u.id AND p.status = 'COMPLETED'
    ), 0) as total_paid_out,
    -- Verify balance equation: stored = clips_earned - paid_out (approximately)
    ROUND(CAST(u."totalEarnings" AS DECIMAL), 2) as current_balance,
    CASE WHEN ABS(
        CAST(u."totalEarnings" AS DECIMAL) - 
        (COALESCE((SELECT SUM(CAST(cl.earnings AS DECIMAL)) FROM "ClipSubmission" cs JOIN "Clip" cl ON cl.id = cs."clipId" WHERE cs."userId" = u.id AND cs.status IN ('APPROVED', 'PAID')), 0) - 
         COALESCE((SELECT SUM(CAST(p.amount AS DECIMAL)) FROM "Payout" p WHERE p."userId" = u.id AND p.status = 'COMPLETED'), 0))
    ) < 0.01 THEN '✅ MATCHES' ELSE '⚠️ CHECK' END as balance_check
FROM "User" u
WHERE u.role = 'CLIPPER'
AND (u."totalEarnings" > 0 OR EXISTS (SELECT 1 FROM "ClipSubmission" cs JOIN "Clip" cl ON cl.id = cs."clipId" WHERE cs."userId" = u.id AND cl.earnings > 0))
ORDER BY u."totalEarnings" DESC
LIMIT 20;


-- 4. CAMPAIGN BUDGET VERIFICATION
-- ============================================================
SELECT 
    '=== CAMPAIGN BUDGET VERIFICATION ===' as section;

-- Compare campaign.spent vs sum of clip earnings for that campaign
SELECT 
    c.id as campaign_id,
    c.title,
    c.status,
    CAST(c.budget AS DECIMAL) as budget,
    CAST(c.spent AS DECIMAL) as stored_spent,
    COALESCE((
        SELECT SUM(CAST(cl.earnings AS DECIMAL))
        FROM "ClipSubmission" cs
        JOIN "Clip" cl ON cl.id = cs."clipId"
        WHERE cs."campaignId" = c.id AND cs.status IN ('APPROVED', 'PAID')
    ), 0) as sum_of_clip_earnings,
    ROUND((CAST(c.spent AS DECIMAL) / NULLIF(CAST(c.budget AS DECIMAL), 0)) * 100, 2) as budget_utilization_pct,
    CASE WHEN ABS(
        CAST(c.spent AS DECIMAL) - 
        COALESCE((SELECT SUM(CAST(cl.earnings AS DECIMAL)) FROM "ClipSubmission" cs JOIN "Clip" cl ON cl.id = cs."clipId" WHERE cs."campaignId" = c.id AND cs.status IN ('APPROVED', 'PAID')), 0)
    ) < 0.01 THEN '✅ MATCHES' ELSE '⚠️ CHECK' END as spent_check
FROM "Campaign" c
WHERE c."isTest" = false
ORDER BY c."createdAt" DESC;


-- 5. VIEW TRACKING RECORDS VERIFICATION  
-- ============================================================
SELECT 
    '=== VIEW TRACKING RECORDS VERIFICATION ===' as section;

-- Check view tracking per approved clip
SELECT 
    cs.id as submission_id,
    cs.status,
    cs."initialViews" as submission_initial_views,
    cl.id as clip_id,
    cl.views as clip_views,
    (SELECT COUNT(*) FROM "ViewTracking" WHERE "clipId" = cl.id) as tracking_record_count,
    (SELECT MAX(views) FROM "ViewTracking" WHERE "clipId" = cl.id) as max_tracked_views,
    (SELECT MIN(views) FROM "ViewTracking" WHERE "clipId" = cl.id) as min_tracked_views,
    COALESCE((SELECT MAX(views) FROM "ViewTracking" WHERE "clipId" = cl.id), 0) - COALESCE(cs."initialViews", 0) as views_gained,
    CAST(cl.earnings AS DECIMAL) as clip_earnings,
    ca.title as campaign_title
FROM "ClipSubmission" cs
JOIN "Clip" cl ON cl.id = cs."clipId"
JOIN "Campaign" ca ON ca.id = cs."campaignId"
WHERE cs.status IN ('APPROVED', 'PAID')
AND ca."isTest" = false
ORDER BY cl.earnings DESC
LIMIT 30;


-- 6. PAYOUT REQUESTS VERIFICATION
-- ============================================================
SELECT 
    '=== PAYOUT REQUESTS VERIFICATION ===' as section;

-- Check payout request statuses
SELECT 
    status,
    COUNT(*) as count,
    SUM(CAST(amount AS DECIMAL)) as total_amount
FROM "PayoutRequest"
GROUP BY status
ORDER BY status;

-- Verify no duplicate completed payouts
SELECT 
    '=== CHECKING FOR DUPLICATE PAYOUTS ===' as check_type;
    
SELECT 
    "userId",
    u.name,
    u.email,
    COUNT(*) as completed_payout_requests,
    SUM(CAST(pr.amount AS DECIMAL)) as total_requested
FROM "PayoutRequest" pr
JOIN "User" u ON u.id = pr."userId"
WHERE pr.status = 'COMPLETED'
GROUP BY "userId", u.name, u.email
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;


-- 7. OVERALL PLATFORM STATS
-- ============================================================
SELECT 
    '=== OVERALL PLATFORM STATISTICS ===' as section;

SELECT 
    (SELECT COUNT(*) FROM "User" WHERE role = 'CLIPPER') as total_clippers,
    (SELECT COUNT(*) FROM "Campaign" WHERE "isTest" = false) as total_real_campaigns,
    (SELECT COUNT(*) FROM "Campaign" WHERE "isTest" = false AND status = 'ACTIVE') as active_campaigns,
    (SELECT COUNT(*) FROM "ClipSubmission" cs JOIN "Campaign" ca ON ca.id = cs."campaignId" WHERE ca."isTest" = false) as total_submissions,
    (SELECT COUNT(*) FROM "ClipSubmission" cs JOIN "Campaign" ca ON ca.id = cs."campaignId" WHERE ca."isTest" = false AND cs.status = 'PENDING') as pending_submissions,
    (SELECT COUNT(*) FROM "ClipSubmission" cs JOIN "Campaign" ca ON ca.id = cs."campaignId" WHERE ca."isTest" = false AND cs.status = 'APPROVED') as approved_submissions,
    (SELECT COUNT(*) FROM "ClipSubmission" cs JOIN "Campaign" ca ON ca.id = cs."campaignId" WHERE ca."isTest" = false AND cs.status = 'REJECTED') as rejected_submissions,
    (SELECT SUM(CAST(cl.earnings AS DECIMAL)) FROM "Clip" cl JOIN "ClipSubmission" cs ON cs."clipId" = cl.id JOIN "Campaign" ca ON ca.id = cs."campaignId" WHERE ca."isTest" = false AND cs.status IN ('APPROVED', 'PAID')) as total_earnings_distributed,
    (SELECT SUM(CAST(amount AS DECIMAL)) FROM "Payout" WHERE status = 'COMPLETED') as total_paid_out,
    (SELECT COUNT(*) FROM "ViewTracking") as total_view_tracking_records;


-- 8. DATA INTEGRITY CHECKS
-- ============================================================
SELECT 
    '=== DATA INTEGRITY CHECKS ===' as section;

-- Submissions without clips
SELECT 'Submissions without clips' as check_type, COUNT(*) as count
FROM "ClipSubmission" WHERE "clipId" IS NULL;

-- Clips without submissions  
SELECT 'Clips without submissions' as check_type, COUNT(*) as count
FROM "Clip" WHERE NOT EXISTS (SELECT 1 FROM "ClipSubmission" WHERE "clipId" = "Clip".id);

-- View tracking without clips
SELECT 'View tracking without clips' as check_type, COUNT(*) as count
FROM "ViewTracking" WHERE NOT EXISTS (SELECT 1 FROM "Clip" WHERE id = "ViewTracking"."clipId");

-- Negative earnings
SELECT 'Clips with negative earnings' as check_type, COUNT(*) as count
FROM "Clip" WHERE CAST(earnings AS DECIMAL) < 0;

-- Users with negative totalEarnings
SELECT 'Users with negative totalEarnings' as check_type, COUNT(*) as count
FROM "User" WHERE CAST("totalEarnings" AS DECIMAL) < 0;

