-- ============================================================================
-- FIX USER BALANCES - Users are owed $451.72 more than showing
-- Clip earnings = $18,000 but user.totalEarnings = $17,548.28
-- This recalculates user.totalEarnings from actual clip earnings
-- ============================================================================

-- STEP 1: PREVIEW - See which users will get balance increases
-- ============================================================================
SELECT 
  u.name,
  u.email,
  u."totalEarnings"::numeric as current_balance,
  COALESCE(calc.correct_balance, 0) as should_be,
  (COALESCE(calc.correct_balance, 0) - u."totalEarnings"::numeric) as will_increase_by
FROM users u
LEFT JOIN (
  SELECT 
    cs."userId",
    SUM(cl.earnings::numeric) as correct_balance
  FROM clip_submissions cs
  JOIN clips cl ON cl.id = cs."clipId"
  WHERE cs.status = 'APPROVED'
  GROUP BY cs."userId"
) calc ON calc."userId" = u.id
WHERE u."totalEarnings" > 0 OR COALESCE(calc.correct_balance, 0) > 0
HAVING ABS(COALESCE(calc.correct_balance, 0) - u."totalEarnings"::numeric) > 0.01
ORDER BY (COALESCE(calc.correct_balance, 0) - u."totalEarnings"::numeric) DESC;

-- ============================================================================
-- STEP 2: APPLY THE FIX
-- This updates user.totalEarnings to match their actual clip earnings
-- ============================================================================

UPDATE users u
SET 
  "totalEarnings" = COALESCE((
    SELECT SUM(cl.earnings)
    FROM clip_submissions cs
    JOIN clips cl ON cl.id = cs."clipId"
    WHERE cs."userId" = u.id
    AND cs.status = 'APPROVED'
  ), 0),
  "updatedAt" = NOW()
WHERE u.role = 'CLIPPER';

-- ============================================================================
-- STEP 3: VERIFY - Check the totals now match
-- ============================================================================
SELECT 
  'Campaign.spent' as source,
  (SELECT spent::numeric FROM campaigns WHERE status = 'COMPLETED' LIMIT 1) as amount
UNION ALL
SELECT 
  'SUM(User.totalEarnings) - AFTER FIX',
  (SELECT SUM("totalEarnings"::numeric) FROM users WHERE "totalEarnings" > 0)
UNION ALL
SELECT 
  'SUM(Clip.earnings) - APPROVED',
  (SELECT SUM(cl.earnings::numeric) 
   FROM clips cl 
   JOIN clip_submissions cs ON cs."clipId" = cl.id 
   WHERE cs.status = 'APPROVED');

-- ============================================================================
-- STEP 4: Show updated user balances
-- ============================================================================
SELECT 
  name,
  email,
  "totalEarnings"::numeric as balance,
  CASE WHEN "totalEarnings" >= 20 THEN 'Can Request' ELSE 'Below $20' END as payout_status
FROM users 
WHERE "totalEarnings" > 0
ORDER BY "totalEarnings" DESC;

