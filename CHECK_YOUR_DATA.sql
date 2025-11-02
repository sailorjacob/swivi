-- QUICK CHECK: See ALL your campaigns and earnings
-- Run this in Supabase SQL Editor to see what's contributing to your $4,500

-- ============================================================================
-- YOUR COMPLETE EARNINGS BREAKDOWN
-- ============================================================================

SELECT 
  c.title as campaign,
  c.status as campaign_status,
  c.budget::numeric as campaign_budget,
  c.spent::numeric as campaign_spent,
  cs.status as submission_status,
  cs."clipUrl" as clip_url,
  COALESCE(cl.earnings::numeric, 0) as clip_earnings,
  COALESCE(cl.views::numeric, 0) as clip_views,
  cs."createdAt" as submitted_at
FROM clip_submissions cs
JOIN campaigns c ON c.id = cs."campaignId"
LEFT JOIN clips cl ON cl.id = cs."clipId"
WHERE cs."userId" IN (SELECT id FROM users WHERE role = 'CLIPPER')
ORDER BY cs."createdAt" DESC;

-- ============================================================================
-- SUMMARY: Total earnings by campaign
-- ============================================================================

SELECT 
  c.title as campaign,
  c.status,
  COUNT(cs.id) as submission_count,
  COUNT(CASE WHEN cs.status = 'APPROVED' THEN 1 END) as approved_count,
  COALESCE(SUM(CASE WHEN cs.status = 'APPROVED' THEN cl.earnings::numeric ELSE 0 END), 0) as total_earnings,
  c.spent::numeric as campaign_spent,
  (COALESCE(SUM(CASE WHEN cs.status = 'APPROVED' THEN cl.earnings::numeric ELSE 0 END), 0) - c.spent::numeric) as difference
FROM campaigns c
LEFT JOIN clip_submissions cs ON cs."campaignId" = c.id
LEFT JOIN clips cl ON cl.id = cs."clipId"
WHERE cs."userId" IN (SELECT id FROM users WHERE role = 'CLIPPER')
GROUP BY c.id, c.title, c.status, c.spent
ORDER BY c."createdAt" DESC;

-- ============================================================================
-- YOUR TOTAL (what dashboard should show)
-- ============================================================================

SELECT 
  'Total Across All Campaigns' as metric,
  COUNT(DISTINCT c.id) as campaign_count,
  COUNT(cs.id) as total_submissions,
  COUNT(CASE WHEN cs.status = 'APPROVED' THEN 1 END) as approved_submissions,
  COALESCE(SUM(CASE WHEN cs.status = 'APPROVED' THEN cl.earnings::numeric ELSE 0 END), 0) as total_earnings,
  COALESCE(SUM(CASE WHEN cs.status = 'APPROVED' AND c.status = 'COMPLETED' THEN cl.earnings::numeric ELSE 0 END), 0) as available_for_payout,
  COALESCE(SUM(CASE WHEN cs.status = 'APPROVED' AND c.status = 'ACTIVE' THEN cl.earnings::numeric ELSE 0 END), 0) as pending_earnings
FROM clip_submissions cs
JOIN campaigns c ON c.id = cs."campaignId"
LEFT JOIN clips cl ON cl.id = cs."clipId"
WHERE cs."userId" IN (SELECT id FROM users WHERE role = 'CLIPPER');

-- ============================================================================
-- CHECK FOR ORPHANED DATA (should be empty)
-- ============================================================================

-- Clips with earnings but no approved submission
SELECT 
  'Orphaned Clips' as issue_type,
  cl.id as clip_id,
  cl.earnings::numeric,
  cl.views::numeric,
  u.email as owner
FROM clips cl
JOIN users u ON u.id = cl."userId"
LEFT JOIN clip_submissions cs ON cs."clipId" = cl.id AND cs.status = 'APPROVED'
WHERE cl.earnings > 0 
  AND cs.id IS NULL
  AND u.role = 'CLIPPER';

-- Submissions with earnings but campaign is deleted
SELECT 
  'Submissions with no Campaign' as issue_type,
  cs.id as submission_id,
  cs."clipUrl",
  COALESCE(cl.earnings::numeric, 0) as earnings,
  cs."campaignId",
  cs.status
FROM clip_submissions cs
LEFT JOIN campaigns c ON c.id = cs."campaignId"
LEFT JOIN clips cl ON cl.id = cs."clipId"
WHERE c.id IS NULL 
  AND cs."userId" IN (SELECT id FROM users WHERE role = 'CLIPPER')
  AND cl.earnings > 0;

