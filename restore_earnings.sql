-- RESTORE EARNINGS after accidental reset
-- This script restores clip.earnings from clip_submissions.finalEarnings
-- NOTE: Column names are camelCase (Prisma default)

-- Step 1: Check current state - see all clips that need restoration
SELECT 'Clips that may need earnings restored:' as info;

SELECT 
  cl.id as clip_id,
  cl.earnings as current_clip_earnings,
  cs."finalEarnings" as submission_final_earnings,
  cs.status as submission_status,
  c.title as campaign_title,
  c.status as campaign_status,
  u.email as user_email,
  u."totalEarnings" as user_total_earnings
FROM clips cl
JOIN clip_submissions cs ON cs."clipId" = cl.id
JOIN campaigns c ON cs."campaignId" = c.id
JOIN users u ON cl."userId" = u.id
WHERE cs."finalEarnings" > 0 OR cl.earnings > 0
ORDER BY cs."finalEarnings" DESC;

-- Step 2: Restore clip.earnings from clip_submissions.finalEarnings where it exists
-- Only updates clips where finalEarnings > current earnings (to restore lost data)
UPDATE clips
SET earnings = subq.final_earnings
FROM (
  SELECT cs."clipId", cs."finalEarnings" as final_earnings
  FROM clip_submissions cs
  WHERE cs."finalEarnings" > 0 
  AND cs."clipId" IS NOT NULL
  AND cs.status = 'APPROVED'
) as subq
WHERE clips.id = subq."clipId"
AND clips.earnings < subq.final_earnings;

-- Step 3: Check user earnings - what should their total be?
SELECT 'User earnings check:' as info;

SELECT 
  u.id,
  u.email,
  u."totalEarnings" as current_total,
  COALESCE(SUM(cl.earnings), 0) as sum_of_clip_earnings
FROM users u
LEFT JOIN clips cl ON cl."userId" = u.id
LEFT JOIN clip_submissions cs ON cs."clipId" = cl.id AND cs.status = 'APPROVED'
WHERE cl.id IS NOT NULL
GROUP BY u.id, u.email, u."totalEarnings"
HAVING COALESCE(SUM(cl.earnings), 0) > 0 OR u."totalEarnings" > 0
ORDER BY COALESCE(SUM(cl.earnings), 0) DESC;

-- Step 4: Update user.totalEarnings to match sum of their approved clip earnings
-- Only update if the calculated total is HIGHER than current (to restore lost earnings)
UPDATE users
SET "totalEarnings" = clip_totals.total_earnings
FROM (
  SELECT 
    cl."userId",
    SUM(cl.earnings) as total_earnings
  FROM clips cl
  JOIN clip_submissions cs ON cs."clipId" = cl.id
  WHERE cs.status = 'APPROVED'
  GROUP BY cl."userId"
) as clip_totals
WHERE users.id = clip_totals."userId"
AND users."totalEarnings" < clip_totals.total_earnings;

-- Step 5: Verify the restore worked
SELECT 'After restore - final state:' as info;

SELECT 
  u.email,
  u."totalEarnings" as user_total,
  COUNT(DISTINCT cl.id) as approved_clips,
  SUM(cl.earnings) as total_clip_earnings,
  CASE 
    WHEN u."totalEarnings" = SUM(cl.earnings) THEN '✅ MATCH'
    WHEN u."totalEarnings" < SUM(cl.earnings) THEN '⚠️ User total lower than clips'
    ELSE '⚠️ User total higher (may have pending payout deduction)'
  END as status
FROM users u
JOIN clips cl ON cl."userId" = u.id
JOIN clip_submissions cs ON cs."clipId" = cl.id AND cs.status = 'APPROVED'
GROUP BY u.id, u.email, u."totalEarnings"
ORDER BY u."totalEarnings" DESC;
