-- ============================================================================
-- QUICK PAYOUT CHECK - Run this first!
-- ============================================================================

-- 1. Campaign Budget Details (this will show the reserved amount)
SELECT 
  title,
  status,
  budget::numeric as total_budget,
  COALESCE("reservedAmount"::numeric, 0) as reserved_amount,
  (budget - COALESCE("reservedAmount", 0))::numeric as effective_clipper_budget,
  spent::numeric as spent,
  "completionReason"
FROM campaigns 
WHERE status = 'COMPLETED' OR budget >= 10000
ORDER BY budget DESC;

-- 2. Total User Balances
SELECT 
  SUM("totalEarnings"::numeric) as total_user_balances,
  COUNT(*) as users_with_balance
FROM users 
WHERE "totalEarnings" > 0;

-- 3. The Math - Where's the money?
WITH campaign_info AS (
  SELECT 
    budget::numeric as budget,
    COALESCE("reservedAmount"::numeric, 0) as reserved,
    spent::numeric as spent
  FROM campaigns 
  WHERE status = 'COMPLETED' OR budget >= 10000
  ORDER BY budget DESC
  LIMIT 1
),
user_totals AS (
  SELECT SUM("totalEarnings"::numeric) as total_balances
  FROM users WHERE "totalEarnings" > 0
)
SELECT 
  c.budget as campaign_budget,
  c.reserved as reserved_amount,
  (c.budget - c.reserved) as effective_budget,
  c.spent as campaign_spent,
  u.total_balances as total_user_balances,
  (c.budget - u.total_balances) as gap_from_budget,
  CASE 
    WHEN c.reserved > 0 THEN 'Gap explained by reserved amount (' || c.reserved || ')'
    WHEN c.spent < (c.budget - c.reserved) THEN 'Budget not fully spent'
    ELSE 'Data sync issue - run full diagnostic'
  END as explanation
FROM campaign_info c, user_totals u;

-- 4. Users Below $20 Minimum (can't request payouts yet)
SELECT 
  COUNT(*) as users_below_20,
  SUM("totalEarnings"::numeric) as total_trapped,
  '$20 minimum' as threshold
FROM users 
WHERE "totalEarnings" > 0 AND "totalEarnings" < 20;

-- 5. All Users with Earnings (to verify the $17,548.28)
SELECT 
  name,
  email,
  "totalEarnings"::numeric as balance,
  CASE WHEN "totalEarnings" >= 20 THEN 'Can Request' ELSE 'Below $20' END as payout_status
FROM users 
WHERE "totalEarnings" > 0
ORDER BY "totalEarnings" DESC;

