-- FIND ORPHANED DATA - Where your $4546.32 is hiding
-- Run each query separately in Supabase SQL Editor

-- ============================================================================
-- 1. FIND ALL CLIPS WITH EARNINGS (regardless of submission status)
-- ============================================================================
SELECT 
  cl.id as clip_id,
  cl.earnings::numeric,
  cl.views::numeric,
  u.email as clip_owner,
  cs.id as submission_id,
  cs.status as submission_status,
  c.title as campaign_title,
  c.id as campaign_id,
  c.status as campaign_status
FROM clips cl
JOIN users u ON u.id = cl."userId"
LEFT JOIN clip_submissions cs ON cs."clipId" = cl.id
LEFT JOIN campaigns c ON c.id = cs."campaignId"
WHERE cl.earnings > 0
ORDER BY cl.earnings DESC;

-- ============================================================================
-- 2. FIND SUBMISSIONS WITHOUT CLIPS (broken links)
-- ============================================================================
SELECT 
  cs.id as submission_id,
  cs."clipId",
  cs."clipUrl",
  cs.status,
  u.email as submitter,
  c.title as campaign
FROM clip_submissions cs
JOIN users u ON u.id = cs."userId"
JOIN campaigns c ON c.id = cs."campaignId"
WHERE cs.status = 'APPROVED'
  AND cs."clipId" IS NULL;

-- ============================================================================
-- 3. FIND YOUR ACTUAL APPROVED SUBMISSIONS
-- ============================================================================
SELECT 
  cs.id as submission_id,
  cs.status,
  cs."clipId",
  cs."clipUrl",
  c.title as campaign,
  c.status as campaign_status,
  COALESCE(cl.earnings::numeric, 0) as clip_earnings,
  COALESCE(cl.views::numeric, 0) as clip_views,
  u.email as your_email
FROM clip_submissions cs
JOIN users u ON u.id = cs."userId"
JOIN campaigns c ON c.id = cs."campaignId"
LEFT JOIN clips cl ON cl.id = cs."clipId"
WHERE u.role = 'CLIPPER'
ORDER BY cs."createdAt" DESC;

-- ============================================================================
-- 4. COUNT EVERYTHING BY STATUS
-- ============================================================================
SELECT 
  'Total Clips' as metric,
  COUNT(*) as count,
  COALESCE(SUM(earnings::numeric), 0) as total_earnings
FROM clips
UNION ALL
SELECT 
  'Clips with Earnings',
  COUNT(*),
  COALESCE(SUM(earnings::numeric), 0)
FROM clips WHERE earnings > 0
UNION ALL
SELECT 
  'Approved Submissions',
  COUNT(*),
  0
FROM clip_submissions WHERE status = 'APPROVED'
UNION ALL
SELECT 
  'Approved WITH Clips',
  COUNT(*),
  COALESCE(SUM(cl.earnings::numeric), 0)
FROM clip_submissions cs
LEFT JOIN clips cl ON cl.id = cs."clipId"
WHERE cs.status = 'APPROVED' AND cs."clipId" IS NOT NULL;

-- ============================================================================
-- 5. FIND CAMPAIGN SPENT SOURCE (where did $3075.93 come from?)
-- ============================================================================
SELECT 
  c.title as campaign,
  c.spent::numeric as campaign_spent,
  COUNT(cs.id) FILTER (WHERE cs.status = 'APPROVED') as approved_count,
  COUNT(cs.id) FILTER (WHERE cs."clipId" IS NOT NULL) as with_clip_count,
  COALESCE(SUM(cl.earnings::numeric) FILTER (WHERE cs.status = 'APPROVED'), 0) as actual_earnings_from_approved
FROM campaigns c
LEFT JOIN clip_submissions cs ON cs."campaignId" = c.id
LEFT JOIN clips cl ON cl.id = cs."clipId"
WHERE c.title = 'Ultimate Test Campaign'
GROUP BY c.id, c.title, c.spent;

-- ============================================================================
-- 6. CHECK IF CLIPS ARE OWNED BY DIFFERENT USER
-- ============================================================================
SELECT 
  u.email as clip_owner,
  COUNT(cl.id) as clips_count,
  SUM(cl.earnings::numeric) as total_earnings,
  COUNT(cs.id) FILTER (WHERE cs.status = 'APPROVED') as approved_submissions
FROM clips cl
JOIN users u ON u.id = cl."userId"
LEFT JOIN clip_submissions cs ON cs."clipId" = cl.id
WHERE cl.earnings > 0
GROUP BY u.id, u.email;

