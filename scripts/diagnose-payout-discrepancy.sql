-- ============================================================================
-- PAYOUT DISCREPANCY DIAGNOSTIC
-- Investigating: $18,000 campaign budget vs $17,548.28 total user balances
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. CAMPAIGN OVERVIEW - Check budget, spent, reserved amounts
-- ============================================================================
SELECT 
  '=== CAMPAIGN OVERVIEW ===' as section;

SELECT 
  c.id,
  c.title,
  c.status,
  c.budget::numeric as total_budget,
  c.spent::numeric as recorded_spent,
  COALESCE(c."reservedAmount"::numeric, 0) as reserved_amount,
  (c.budget::numeric - COALESCE(c."reservedAmount"::numeric, 0)) as effective_budget,
  c."completionReason",
  c."completedAt"
FROM campaigns c
WHERE c.status = 'COMPLETED' OR c.budget >= 10000
ORDER BY c.budget DESC;

-- ============================================================================
-- 2. EARNINGS SOURCES COMPARISON - Where is the money?
-- ============================================================================
SELECT 
  '=== EARNINGS SOURCES COMPARISON ===' as section;

SELECT 
  (SELECT SUM("totalEarnings"::numeric) FROM users WHERE "totalEarnings" > 0) as sum_user_total_earnings,
  (SELECT SUM(earnings::numeric) FROM clips WHERE earnings > 0) as sum_all_clip_earnings,
  (SELECT SUM(cl.earnings::numeric) 
   FROM clips cl 
   JOIN clip_submissions cs ON cs."clipId" = cl.id 
   WHERE cs.status = 'APPROVED') as sum_approved_clip_earnings,
  (SELECT spent::numeric FROM campaigns WHERE status = 'COMPLETED' LIMIT 1) as campaign_spent,
  (SELECT budget::numeric FROM campaigns WHERE status = 'COMPLETED' LIMIT 1) as campaign_budget,
  (SELECT COALESCE("reservedAmount"::numeric, 0) FROM campaigns WHERE status = 'COMPLETED' LIMIT 1) as campaign_reserved;

-- ============================================================================
-- 3. USERS BELOW MINIMUM PAYOUT ($20) - Are there unpayable amounts?
-- ============================================================================
SELECT 
  '=== USERS BELOW $20 MINIMUM PAYOUT ===' as section;

SELECT 
  u.id,
  u.name,
  u.email,
  u."totalEarnings"::numeric as balance,
  COUNT(cs.id) as approved_clips,
  '$20 minimum payout threshold' as note
FROM users u
LEFT JOIN clip_submissions cs ON cs."userId" = u.id AND cs.status = 'APPROVED'
WHERE u."totalEarnings" > 0 AND u."totalEarnings" < 20
GROUP BY u.id, u.name, u.email, u."totalEarnings"
ORDER BY u."totalEarnings" DESC;

-- Summary of below-minimum users
SELECT 
  COUNT(*) as users_below_minimum,
  SUM("totalEarnings"::numeric) as total_trapped_amount,
  '$20 minimum threshold' as threshold
FROM users 
WHERE "totalEarnings" > 0 AND "totalEarnings" < 20;

-- ============================================================================
-- 4. ALL USERS WITH EARNINGS - Full breakdown
-- ============================================================================
SELECT 
  '=== ALL USERS WITH EARNINGS ===' as section;

SELECT 
  u.id,
  u.name,
  u.email,
  u."totalEarnings"::numeric as user_balance,
  COALESCE(SUM(cl.earnings::numeric), 0) as sum_clip_earnings,
  (u."totalEarnings"::numeric - COALESCE(SUM(cl.earnings::numeric), 0)) as difference,
  COUNT(cs.id) as approved_clips,
  CASE 
    WHEN u."totalEarnings" >= 20 THEN 'CAN REQUEST PAYOUT'
    ELSE 'BELOW $20 MINIMUM'
  END as payout_status
FROM users u
LEFT JOIN clip_submissions cs ON cs."userId" = u.id AND cs.status = 'APPROVED'
LEFT JOIN clips cl ON cl.id = cs."clipId"
WHERE u."totalEarnings" > 0
GROUP BY u.id, u.name, u.email, u."totalEarnings"
ORDER BY u."totalEarnings" DESC;

-- ============================================================================
-- 5. GRAND TOTALS - Where does the money go?
-- ============================================================================
SELECT 
  '=== GRAND TOTALS ===' as section;

SELECT
  (SELECT SUM("totalEarnings"::numeric) FROM users WHERE "totalEarnings" > 0) as total_user_balances,
  (SELECT SUM("totalEarnings"::numeric) FROM users WHERE "totalEarnings" >= 20) as payable_balances_over_20,
  (SELECT SUM("totalEarnings"::numeric) FROM users WHERE "totalEarnings" > 0 AND "totalEarnings" < 20) as trapped_below_20,
  (SELECT COUNT(*) FROM users WHERE "totalEarnings" > 0) as users_with_balance,
  (SELECT COUNT(*) FROM users WHERE "totalEarnings" >= 20) as users_can_request_payout,
  (SELECT COUNT(*) FROM users WHERE "totalEarnings" > 0 AND "totalEarnings" < 20) as users_below_minimum;

-- ============================================================================
-- 6. CAMPAIGN MATH - Budget vs Distributed
-- ============================================================================
SELECT 
  '=== CAMPAIGN MATH ===' as section;

SELECT 
  c.title,
  c.budget::numeric as total_budget,
  COALESCE(c."reservedAmount"::numeric, 0) as reserved_for_bounties_fees,
  (c.budget::numeric - COALESCE(c."reservedAmount"::numeric, 0)) as effective_clipper_budget,
  c.spent::numeric as recorded_spent,
  (SELECT SUM(cl.earnings::numeric) 
   FROM clip_submissions cs 
   JOIN clips cl ON cl.id = cs."clipId" 
   WHERE cs."campaignId" = c.id AND cs.status = 'APPROVED') as actual_clip_earnings,
  (c.budget::numeric - COALESCE(c."reservedAmount"::numeric, 0) - c.spent::numeric) as unspent_budget,
  CASE 
    WHEN c."reservedAmount" > 0 THEN 'Has reserved amount (bounties/fees)'
    ELSE 'No reserved amount'
  END as notes
FROM campaigns c
WHERE c.status = 'COMPLETED' OR c.budget >= 10000
ORDER BY c.budget DESC;

-- ============================================================================
-- 7. CHECK FOR DATA INCONSISTENCIES
-- ============================================================================
SELECT 
  '=== DATA INCONSISTENCIES ===' as section;

-- Clips with earnings but not approved
SELECT 
  'Clips with earnings but not approved' as issue,
  COUNT(*) as count,
  SUM(cl.earnings::numeric) as amount
FROM clips cl
JOIN clip_submissions cs ON cs."clipId" = cl.id
WHERE cl.earnings > 0 AND cs.status != 'APPROVED';

-- Users where totalEarnings doesn't match clip sum
SELECT 
  'Users with mismatched earnings' as issue,
  u.email,
  u."totalEarnings"::numeric as cached,
  COALESCE(SUM(cl.earnings::numeric), 0) as actual,
  (u."totalEarnings"::numeric - COALESCE(SUM(cl.earnings::numeric), 0)) as diff
FROM users u
LEFT JOIN clip_submissions cs ON cs."userId" = u.id AND cs.status = 'APPROVED'
LEFT JOIN clips cl ON cl.id = cs."clipId"
WHERE u."totalEarnings" > 0
GROUP BY u.id, u.email, u."totalEarnings"
HAVING ABS(u."totalEarnings"::numeric - COALESCE(SUM(cl.earnings::numeric), 0)) > 0.01;

-- ============================================================================
-- 8. PENDING PAYOUT REQUESTS - Money already requested
-- ============================================================================
SELECT 
  '=== PENDING PAYOUT REQUESTS ===' as section;

SELECT 
  pr.id,
  u.name,
  u.email,
  pr.amount::numeric,
  pr.status,
  pr."requestedAt",
  u."totalEarnings"::numeric as user_balance
FROM payout_requests pr
JOIN users u ON u.id = pr."userId"
WHERE pr.status IN ('PENDING', 'APPROVED', 'PROCESSING')
ORDER BY pr."requestedAt" DESC;

-- Total pending
SELECT 
  COUNT(*) as pending_requests,
  SUM(amount::numeric) as total_pending_amount
FROM payout_requests
WHERE status IN ('PENDING', 'APPROVED', 'PROCESSING');

-- ============================================================================
-- 9. FINAL ACCOUNTING SUMMARY
-- ============================================================================
SELECT 
  '=== FINAL ACCOUNTING SUMMARY ===' as section;

WITH campaign_data AS (
  SELECT 
    budget::numeric as budget,
    COALESCE("reservedAmount"::numeric, 0) as reserved,
    spent::numeric as spent
  FROM campaigns 
  WHERE status = 'COMPLETED'
  LIMIT 1
),
user_data AS (
  SELECT 
    SUM("totalEarnings"::numeric) as total_balances
  FROM users 
  WHERE "totalEarnings" > 0
)
SELECT 
  cd.budget as campaign_budget,
  cd.reserved as reserved_amount,
  (cd.budget - cd.reserved) as effective_budget,
  cd.spent as campaign_spent,
  ud.total_balances as total_user_balances,
  (cd.budget - cd.reserved - ud.total_balances) as unexplained_gap,
  CASE 
    WHEN cd.reserved > 0 THEN 'Gap may be due to reserved amount'
    WHEN (cd.budget - ud.total_balances) > 0 THEN 'Some budget unspent or data sync issue'
    ELSE 'Balanced'
  END as explanation
FROM campaign_data cd, user_data ud;

