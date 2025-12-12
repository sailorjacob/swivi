-- ============================================================================
-- FIX EARNINGS SYNC
-- Recalculate all earnings from source of truth (clips)
-- Run AFTER diagnosing the issue with find-missing-451.sql
-- ============================================================================

-- STEP 1: Preview what will change (DO NOT RUN THE UPDATE YET)
-- ============================================================================

-- Preview: Users where totalEarnings will change
SELECT 
  u.name,
  u.email,
  u."totalEarnings"::numeric as current_balance,
  COALESCE(calculated.clip_sum, 0) as correct_balance,
  (COALESCE(calculated.clip_sum, 0) - u."totalEarnings"::numeric) as change
FROM users u
LEFT JOIN (
  SELECT 
    cs."userId",
    SUM(cl.earnings::numeric) as clip_sum
  FROM clip_submissions cs
  JOIN clips cl ON cl.id = cs."clipId"
  WHERE cs.status = 'APPROVED'
  GROUP BY cs."userId"
) calculated ON calculated."userId" = u.id
WHERE u."totalEarnings" > 0 OR COALESCE(calculated.clip_sum, 0) > 0
ORDER BY ABS(COALESCE(calculated.clip_sum, 0) - u."totalEarnings"::numeric) DESC;

-- Preview: Campaign spent will change to
SELECT 
  c.title,
  c.spent::numeric as current_spent,
  COALESCE(SUM(cl.earnings::numeric), 0) as correct_spent,
  (COALESCE(SUM(cl.earnings::numeric), 0) - c.spent::numeric) as change
FROM campaigns c
LEFT JOIN clip_submissions cs ON cs."campaignId" = c.id AND cs.status = 'APPROVED'
LEFT JOIN clips cl ON cl.id = cs."clipId"
WHERE c.status = 'COMPLETED'
GROUP BY c.id, c.title, c.spent;

-- ============================================================================
-- STEP 2: ACTUALLY FIX THE DATA (UNCOMMENT TO RUN)
-- ============================================================================

/*
-- Fix 1: Recalculate user.totalEarnings from their approved clip earnings
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

-- Fix 2: Recalculate campaign.spent from actual clip earnings
UPDATE campaigns c
SET 
  spent = COALESCE((
    SELECT SUM(cl.earnings)
    FROM clip_submissions cs
    JOIN clips cl ON cl.id = cs."clipId"
    WHERE cs."campaignId" = c.id
    AND cs.status = 'APPROVED'
  ), 0),
  "updatedAt" = NOW()
WHERE c.status = 'COMPLETED';
*/

-- ============================================================================
-- STEP 3: VERIFY AFTER FIX
-- ============================================================================

/*
-- After running the fix, verify everything matches:
SELECT 
  'Campaign.spent' as source,
  (SELECT spent::numeric FROM campaigns WHERE status = 'COMPLETED' LIMIT 1) as amount
UNION ALL
SELECT 
  'SUM(User.totalEarnings)',
  (SELECT SUM("totalEarnings"::numeric) FROM users WHERE "totalEarnings" > 0)
UNION ALL
SELECT 
  'SUM(Clip.earnings)',
  (SELECT SUM(cl.earnings::numeric) 
   FROM clips cl 
   JOIN clip_submissions cs ON cs."clipId" = cl.id 
   WHERE cs.status = 'APPROVED');
*/

