-- EARNINGS DIAGNOSTIC QUERIES
-- Run these in Supabase SQL Editor to find the discrepancy

-- ============================================================================
-- 1. CHECK CAMPAIGNS - See all campaigns and their spend vs actual
-- ============================================================================

SELECT 
  c.title,
  c.status,
  c.budget::numeric,
  c.spent::numeric as recorded_spent,
  COALESCE(SUM(cl.earnings::numeric), 0) as actual_spent_from_clips,
  (COALESCE(SUM(cl.earnings::numeric), 0) - c.spent::numeric) as difference,
  COUNT(DISTINCT cs.id) as approved_submissions
FROM campaigns c
LEFT JOIN clip_submissions cs ON cs."campaignId" = c.id AND cs.status = 'APPROVED'
LEFT JOIN clips cl ON cl.id = cs."clipId"
GROUP BY c.id, c.title, c.status, c.budget, c.spent
ORDER BY c."createdAt" DESC;

-- ============================================================================
-- 2. CHECK YOUR USER DATA - See your cached vs actual earnings
-- ============================================================================

SELECT 
  u.email,
  u.name,
  u."totalEarnings"::numeric as cached_total_earnings,
  u."totalViews"::numeric as cached_total_views,
  COALESCE(SUM(cl.earnings::numeric), 0) as actual_earnings_from_clips,
  COALESCE(SUM(cl.views::numeric), 0) as actual_views_from_clips,
  (COALESCE(SUM(cl.earnings::numeric), 0) - u."totalEarnings"::numeric) as earnings_difference,
  COUNT(DISTINCT cs.id) as approved_submissions
FROM users u
LEFT JOIN clip_submissions cs ON cs."userId" = u.id AND cs.status = 'APPROVED'
LEFT JOIN clips cl ON cl.id = cs."clipId"
WHERE u.role = 'CLIPPER'
GROUP BY u.id, u.email, u.name, u."totalEarnings", u."totalViews"
ORDER BY actual_earnings_from_clips DESC;

-- ============================================================================
-- 3. CHECK ALL CLIPS WITH EARNINGS - See which clips have earnings
-- ============================================================================

SELECT 
  cl.id,
  cl.earnings::numeric,
  cl.views::numeric,
  u.email as owner_email,
  c.title as campaign_title,
  c.status as campaign_status,
  cs.status as submission_status,
  cs."createdAt" as submitted_at
FROM clips cl
JOIN clip_submissions cs ON cs."clipId" = cl.id
JOIN campaigns c ON c.id = cs."campaignId"
JOIN users u ON u.id = cl."userId"
WHERE cl.earnings > 0
ORDER BY cl.earnings DESC;

-- ============================================================================
-- 4. BREAKDOWN BY CAMPAIGN FOR EACH USER
-- ============================================================================

SELECT 
  u.email as user_email,
  c.title as campaign_title,
  c.status as campaign_status,
  COUNT(cs.id) as submissions_count,
  COALESCE(SUM(cl.earnings::numeric), 0) as total_earnings_from_campaign,
  COALESCE(SUM(cl.views::numeric), 0) as total_views
FROM users u
JOIN clip_submissions cs ON cs."userId" = u.id
JOIN campaigns c ON c.id = cs."campaignId"
LEFT JOIN clips cl ON cl.id = cs."clipId"
WHERE cs.status = 'APPROVED' AND u.role = 'CLIPPER'
GROUP BY u.email, c.title, c.status
ORDER BY u.email, total_earnings_from_campaign DESC;

-- ============================================================================
-- 5. FIND OLD/ORPHANED CLIPS - Clips with earnings but no active submission
-- ============================================================================

SELECT 
  cl.id,
  cl.earnings::numeric,
  cl.views::numeric,
  u.email,
  COUNT(cs.id) as submission_count,
  STRING_AGG(DISTINCT c.title, ', ') as campaigns,
  STRING_AGG(DISTINCT cs.status, ', ') as submission_statuses
FROM clips cl
JOIN users u ON u.id = cl."userId"
LEFT JOIN clip_submissions cs ON cs."clipId" = cl.id
LEFT JOIN campaigns c ON c.id = cs."campaignId"
WHERE cl.earnings > 0
GROUP BY cl.id, cl.earnings, cl.views, u.email
HAVING COUNT(cs.id) = 0 OR 
       COUNT(CASE WHEN cs.status = 'APPROVED' THEN 1 END) = 0;

-- ============================================================================
-- 6. SIMPLE COUNT - How many clips, submissions, campaigns
-- ============================================================================

SELECT 
  'Total Campaigns' as metric,
  COUNT(*) as count
FROM campaigns
UNION ALL
SELECT 
  'Active Campaigns',
  COUNT(*)
FROM campaigns WHERE status = 'ACTIVE'
UNION ALL
SELECT 
  'Total Clips',
  COUNT(*)
FROM clips
UNION ALL
SELECT 
  'Clips with Earnings',
  COUNT(*)
FROM clips WHERE earnings > 0
UNION ALL
SELECT 
  'Total Submissions',
  COUNT(*)
FROM clip_submissions
UNION ALL
SELECT 
  'Approved Submissions',
  COUNT(*)
FROM clip_submissions WHERE status = 'APPROVED'
UNION ALL
SELECT 
  'Users',
  COUNT(*)
FROM users WHERE role = 'CLIPPER';

