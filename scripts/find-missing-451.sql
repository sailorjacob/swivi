-- ============================================================================
-- FIND THE MISSING $451.72
-- Campaign spent = $18,000 but user balances = $17,548.28
-- ============================================================================

-- 1. CHECK ALL EARNINGS SOURCES
SELECT 
  'Campaign.spent' as source,
  (SELECT spent::numeric FROM campaigns WHERE status = 'COMPLETED' LIMIT 1) as amount
UNION ALL
SELECT 
  'SUM(User.totalEarnings)',
  (SELECT SUM("totalEarnings"::numeric) FROM users WHERE "totalEarnings" > 0)
UNION ALL
SELECT 
  'SUM(Clip.earnings) - ALL clips',
  (SELECT SUM(earnings::numeric) FROM clips WHERE earnings > 0)
UNION ALL
SELECT 
  'SUM(Clip.earnings) - APPROVED only',
  (SELECT SUM(cl.earnings::numeric) 
   FROM clips cl 
   JOIN clip_submissions cs ON cs."clipId" = cl.id 
   WHERE cs.status = 'APPROVED');

-- 2. FIND CLIPS WITH EARNINGS BUT NOT APPROVED
SELECT 
  'Clips with earnings but NOT approved' as issue,
  COUNT(*) as count,
  SUM(cl.earnings::numeric) as lost_amount
FROM clips cl
JOIN clip_submissions cs ON cs."clipId" = cl.id
WHERE cl.earnings > 0 AND cs.status != 'APPROVED';

-- 3. FIND CLIPS WITH EARNINGS BUT NO SUBMISSION
SELECT 
  'Orphan clips (earnings but no submission)' as issue,
  COUNT(*) as count,
  SUM(cl.earnings::numeric) as lost_amount
FROM clips cl
LEFT JOIN clip_submissions cs ON cs."clipId" = cl.id
WHERE cl.earnings > 0 AND cs.id IS NULL;

-- 4. CHECK USER EARNINGS vs THEIR CLIP EARNINGS
-- Find users where cached totalEarnings doesn't match actual clip sum
SELECT 
  u.name,
  u.email,
  u."totalEarnings"::numeric as cached_balance,
  COALESCE(SUM(cl.earnings::numeric), 0) as actual_clip_sum,
  (u."totalEarnings"::numeric - COALESCE(SUM(cl.earnings::numeric), 0)) as difference
FROM users u
LEFT JOIN clip_submissions cs ON cs."userId" = u.id AND cs.status = 'APPROVED'
LEFT JOIN clips cl ON cl.id = cs."clipId"
WHERE u."totalEarnings" > 0
GROUP BY u.id, u.name, u.email, u."totalEarnings"
HAVING ABS(u."totalEarnings"::numeric - COALESCE(SUM(cl.earnings::numeric), 0)) > 0.01
ORDER BY ABS(u."totalEarnings"::numeric - COALESCE(SUM(cl.earnings::numeric), 0)) DESC;

-- 5. SUM UP THE DISCREPANCIES
SELECT 
  'Total user earnings mismatch' as issue,
  SUM(ABS(diff)) as total_discrepancy
FROM (
  SELECT 
    (u."totalEarnings"::numeric - COALESCE(SUM(cl.earnings::numeric), 0)) as diff
  FROM users u
  LEFT JOIN clip_submissions cs ON cs."userId" = u.id AND cs.status = 'APPROVED'
  LEFT JOIN clips cl ON cl.id = cs."clipId"
  WHERE u."totalEarnings" > 0
  GROUP BY u.id, u."totalEarnings"
) sub
WHERE ABS(diff) > 0.01;

-- 6. WHAT SHOULD CAMPAIGN.SPENT ACTUALLY BE?
SELECT 
  'Correct campaign.spent should be' as metric,
  SUM(cl.earnings::numeric) as correct_spent
FROM clip_submissions cs
JOIN clips cl ON cl.id = cs."clipId"
WHERE cs.status = 'APPROVED'
  AND cs."campaignId" = (SELECT id FROM campaigns WHERE status = 'COMPLETED' LIMIT 1);

