-- ============================================================================
-- COMPREHENSIVE VIEW & EARNINGS AUDIT
-- Run this in Supabase SQL Editor to identify discrepancies
-- ============================================================================

-- ============================================================================
-- AUDIT 1: Campaign Spent vs Actual Clip Earnings
-- This checks if campaign.spent matches the sum of clip.earnings
-- ============================================================================
SELECT 
  'CAMPAIGN SPENT AUDIT' as audit_type,
  c.id as campaign_id,
  c.title,
  c.status,
  c.budget,
  c.spent as stored_spent,
  COALESCE(SUM(cl.earnings), 0) as actual_clip_earnings,
  ABS(c.spent - COALESCE(SUM(cl.earnings), 0)) as discrepancy,
  CASE 
    WHEN ABS(c.spent - COALESCE(SUM(cl.earnings), 0)) > 0.01 THEN '⚠️ MISMATCH'
    ELSE '✅ OK'
  END as status
FROM campaigns c
LEFT JOIN clip_submissions cs ON cs.campaign_id = c.id AND cs.status = 'APPROVED'
LEFT JOIN clips cl ON cs.clip_id = cl.id
WHERE c.deleted_at IS NULL
GROUP BY c.id, c.title, c.status, c.budget, c.spent
ORDER BY discrepancy DESC;

-- ============================================================================
-- AUDIT 2: User Total Earnings vs Sum of Their Clip Earnings
-- This checks if user.totalEarnings matches sum of their clips' earnings (minus payouts)
-- ============================================================================
SELECT 
  'USER EARNINGS AUDIT' as audit_type,
  u.id as user_id,
  u.name,
  u.email,
  u.total_earnings as stored_total,
  COALESCE(clip_sum.total, 0) as clip_earnings_sum,
  COALESCE(payout_sum.total, 0) as total_paid_out,
  COALESCE(clip_sum.total, 0) - COALESCE(payout_sum.total, 0) as expected_balance,
  ABS(u.total_earnings - (COALESCE(clip_sum.total, 0) - COALESCE(payout_sum.total, 0))) as discrepancy,
  CASE 
    WHEN ABS(u.total_earnings - (COALESCE(clip_sum.total, 0) - COALESCE(payout_sum.total, 0))) > 0.01 THEN '⚠️ MISMATCH'
    ELSE '✅ OK'
  END as status
FROM users u
LEFT JOIN (
  SELECT 
    cs.user_id,
    SUM(cl.earnings) as total
  FROM clip_submissions cs
  JOIN clips cl ON cs.clip_id = cl.id
  WHERE cs.status = 'APPROVED'
  GROUP BY cs.user_id
) clip_sum ON u.id = clip_sum.user_id
LEFT JOIN (
  SELECT 
    user_id,
    SUM(amount) as total
  FROM payouts
  WHERE status = 'COMPLETED'
  GROUP BY user_id
) payout_sum ON u.id = payout_sum.user_id
WHERE u.role = 'CLIPPER'
ORDER BY discrepancy DESC;

-- ============================================================================
-- AUDIT 3: View Count Consistency
-- Checks clip.views vs latest view_tracking entry
-- ============================================================================
SELECT 
  'VIEW COUNT AUDIT' as audit_type,
  cl.id as clip_id,
  cl.url,
  cl.views as clip_views,
  latest_vt.views as latest_tracking_views,
  ABS(cl.views - COALESCE(latest_vt.views, 0)) as discrepancy,
  CASE 
    WHEN cl.views < COALESCE(latest_vt.views, 0) THEN '⚠️ CLIP VIEWS LOWER'
    WHEN cl.views > COALESCE(latest_vt.views, 0) + 10000 THEN '⚠️ BIG GAP'
    ELSE '✅ OK'
  END as status
FROM clips cl
LEFT JOIN LATERAL (
  SELECT views 
  FROM view_tracking vt 
  WHERE vt.clip_id = cl.id 
  ORDER BY scraped_at DESC 
  LIMIT 1
) latest_vt ON true
WHERE cl.id IN (
  SELECT clip_id FROM clip_submissions WHERE status = 'APPROVED' AND clip_id IS NOT NULL
)
ORDER BY discrepancy DESC
LIMIT 50;

-- ============================================================================
-- AUDIT 4: Initial Views Check (should be 0 for proper earnings calc)
-- ============================================================================
SELECT 
  'INITIAL VIEWS AUDIT' as audit_type,
  cs.id as submission_id,
  c.title as campaign,
  u.name as clipper,
  cs.initial_views,
  cl.views as current_views,
  cl.earnings,
  CASE 
    WHEN cs.initial_views > 0 THEN '⚠️ NON-ZERO (may lose earnings)'
    ELSE '✅ OK (earns from all views)'
  END as status
FROM clip_submissions cs
JOIN campaigns c ON cs.campaign_id = c.id
JOIN users u ON cs.user_id = u.id
LEFT JOIN clips cl ON cs.clip_id = cl.id
WHERE cs.status = 'APPROVED'
  AND cs.initial_views > 0
ORDER BY cs.initial_views DESC
LIMIT 50;

-- ============================================================================
-- AUDIT 5: Earnings Calculation Verification
-- Recalculates what earnings SHOULD be and compares to actual
-- Formula: (views - initial_views) / 1000 * payout_rate (capped at 30% budget)
-- ============================================================================
SELECT 
  'EARNINGS CALC AUDIT' as audit_type,
  cs.id as submission_id,
  c.title as campaign,
  u.name as clipper,
  cl.views as current_views,
  cs.initial_views,
  (cl.views - COALESCE(cs.initial_views, 0)) as view_growth,
  c.payout_rate,
  c.budget,
  LEAST(
    ((cl.views - COALESCE(cs.initial_views, 0))::numeric / 1000) * c.payout_rate,
    c.budget * 0.30
  ) as expected_earnings,
  cl.earnings as actual_earnings,
  ABS(
    LEAST(
      ((cl.views - COALESCE(cs.initial_views, 0))::numeric / 1000) * c.payout_rate,
      c.budget * 0.30
    ) - cl.earnings
  ) as discrepancy,
  CASE 
    WHEN ABS(
      LEAST(
        ((cl.views - COALESCE(cs.initial_views, 0))::numeric / 1000) * c.payout_rate,
        c.budget * 0.30
      ) - cl.earnings
    ) > 1 THEN '⚠️ MISMATCH'
    ELSE '✅ OK'
  END as status
FROM clip_submissions cs
JOIN campaigns c ON cs.campaign_id = c.id
JOIN users u ON cs.user_id = u.id
JOIN clips cl ON cs.clip_id = cl.id
WHERE cs.status = 'APPROVED'
  AND c.status IN ('ACTIVE', 'COMPLETED')
  AND c.deleted_at IS NULL
ORDER BY discrepancy DESC
LIMIT 50;

-- ============================================================================
-- SUMMARY: Count of issues by type
-- ============================================================================
SELECT 'SUMMARY' as section, 
       'Campaigns with spent mismatch' as issue_type,
       COUNT(*) as count
FROM campaigns c
LEFT JOIN clip_submissions cs ON cs.campaign_id = c.id AND cs.status = 'APPROVED'
LEFT JOIN clips cl ON cs.clip_id = cl.id
WHERE c.deleted_at IS NULL
GROUP BY c.id, c.spent
HAVING ABS(c.spent - COALESCE(SUM(cl.earnings), 0)) > 0.01

UNION ALL

SELECT 'SUMMARY', 
       'Submissions with non-zero initialViews' as issue_type,
       COUNT(*)
FROM clip_submissions
WHERE status = 'APPROVED' AND initial_views > 0

UNION ALL

SELECT 'SUMMARY',
       'Total active campaign clips' as issue_type,
       COUNT(*)
FROM clip_submissions cs
JOIN campaigns c ON cs.campaign_id = c.id
WHERE cs.status = 'APPROVED' 
  AND c.status = 'ACTIVE'
  AND c.deleted_at IS NULL;

