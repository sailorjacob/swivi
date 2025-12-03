-- RESTORE EARNINGS after accidental reset
-- This script restores clip.earnings from clip_submissions.final_earnings

-- Step 1: Check current state
SELECT 'Current state of clips with 0 earnings that have final_earnings on their submission' as info;

SELECT 
  cl.id as clip_id,
  cl.earnings as current_earnings,
  cs.final_earnings as submission_final_earnings,
  cs.status as submission_status,
  c.title as campaign_title,
  c.status as campaign_status,
  u.email as user_email
FROM clips cl
JOIN clip_submissions cs ON cs.clip_id = cl.id
JOIN campaigns c ON cs.campaign_id = c.id
JOIN users u ON cl.user_id = u.id
WHERE cs.final_earnings > 0 OR cl.earnings > 0
ORDER BY cs.final_earnings DESC;

-- Step 2: Restore clip.earnings from clip_submissions.final_earnings where it exists
UPDATE clips
SET earnings = (
  SELECT COALESCE(cs.final_earnings, 0)
  FROM clip_submissions cs
  WHERE cs.clip_id = clips.id
  AND cs.final_earnings > 0
  LIMIT 1
)
WHERE id IN (
  SELECT clip_id 
  FROM clip_submissions 
  WHERE final_earnings > 0 
  AND clip_id IS NOT NULL
);

-- Step 3: Now restore user.total_earnings by summing their approved clip earnings
-- First check what it should be
SELECT 
  u.id,
  u.email,
  u.total_earnings as current_total,
  COALESCE(SUM(cl.earnings), 0) as should_be
FROM users u
LEFT JOIN clips cl ON cl.user_id = u.id
LEFT JOIN clip_submissions cs ON cs.clip_id = cl.id AND cs.status = 'APPROVED'
GROUP BY u.id, u.email, u.total_earnings
HAVING COALESCE(SUM(cl.earnings), 0) > 0 OR u.total_earnings > 0;

-- Step 4: Update user.total_earnings to match sum of their approved clip earnings
-- (ONLY for users where the current total is less than their actual clip earnings)
UPDATE users
SET total_earnings = (
  SELECT COALESCE(SUM(cl.earnings), 0)
  FROM clips cl
  JOIN clip_submissions cs ON cs.clip_id = cl.id
  WHERE cl.user_id = users.id
  AND cs.status = 'APPROVED'
)
WHERE id IN (
  SELECT DISTINCT cl.user_id 
  FROM clips cl
  JOIN clip_submissions cs ON cs.clip_id = cl.id
  WHERE cs.status = 'APPROVED'
);

-- Step 5: Verify the restore worked
SELECT 'After restore:' as info;

SELECT 
  u.email,
  u.total_earnings,
  COUNT(DISTINCT cl.id) as approved_clips,
  SUM(cl.earnings) as total_clip_earnings
FROM users u
JOIN clips cl ON cl.user_id = u.id
JOIN clip_submissions cs ON cs.clip_id = cl.id AND cs.status = 'APPROVED'
GROUP BY u.id, u.email, u.total_earnings
ORDER BY u.total_earnings DESC;
