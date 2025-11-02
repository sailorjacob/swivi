-- FIX ORPHANED CLIPS AND DATA INCONSISTENCIES
-- Run these AFTER diagnosing with FIND_ORPHANED_DATA.sql

-- ============================================================================
-- OPTION 1: Reset campaign.spent to match actual approved clip earnings
-- ============================================================================
-- This recalculates campaign.spent from scratch based on approved submissions

WITH actual_campaign_spend AS (
  SELECT 
    c.id as campaign_id,
    COALESCE(SUM(cl.earnings::numeric), 0) as actual_spent
  FROM campaigns c
  LEFT JOIN clip_submissions cs ON cs."campaignId" = c.id
  LEFT JOIN clips cl ON cl.id = cs."clipId"
  WHERE cs.status = 'APPROVED'
  GROUP BY c.id
)
UPDATE campaigns c
SET spent = acs.actual_spent
FROM actual_campaign_spend acs
WHERE c.id = acs.campaign_id;

-- Verify the fix:
SELECT 
  c.title,
  c.spent::numeric as updated_spent,
  COALESCE(SUM(cl.earnings::numeric), 0) as clip_earnings_sum,
  COUNT(cs.id) FILTER (WHERE cs.status = 'APPROVED') as approved_count
FROM campaigns c
LEFT JOIN clip_submissions cs ON cs."campaignId" = c.id AND cs.status = 'APPROVED'
LEFT JOIN clips cl ON cl.id = cs."clipId"
GROUP BY c.id, c.title, c.spent;

-- ============================================================================
-- OPTION 2: Delete orphaned clips (clips with no approved submission)
-- ============================================================================
-- WARNING: This will permanently delete clips that aren't linked to submissions

-- First, see what would be deleted:
SELECT 
  cl.id,
  cl.earnings::numeric,
  cl.views::numeric,
  cl."createdAt",
  u.email as owner
FROM clips cl
JOIN users u ON u.id = cl."userId"
LEFT JOIN clip_submissions cs ON cs."clipId" = cl.id AND cs.status = 'APPROVED'
WHERE cs.id IS NULL
  AND cl.earnings > 0;

-- If you're sure, uncomment to delete:
-- DELETE FROM clips 
-- WHERE id IN (
--   SELECT cl.id
--   FROM clips cl
--   LEFT JOIN clip_submissions cs ON cs."clipId" = cl.id AND cs.status = 'APPROVED'
--   WHERE cs.id IS NULL
-- );

-- ============================================================================
-- OPTION 3: Fix broken submission links
-- ============================================================================
-- If submissions have clipUrl but no clipId, try to match them

-- Find submissions with URL but no clip:
SELECT 
  cs.id as submission_id,
  cs."clipUrl",
  cs.status,
  c.title as campaign
FROM clip_submissions cs
JOIN campaigns c ON c.id = cs."campaignId"
WHERE cs."clipId" IS NULL
  AND cs.status = 'APPROVED';

-- If clips exist with matching URL, link them:
-- (This is tricky - clips don't store URLs, so this won't work)
-- You'd need to manually fix these

-- ============================================================================
-- OPTION 4: NUCLEAR - Reset everything for this campaign
-- ============================================================================
-- Use this if data is completely corrupted

-- See what would be reset:
SELECT 
  'Campaign' as item_type,
  c.title as item,
  c.spent::numeric as current_value
FROM campaigns c
WHERE c.title = 'Ultimate Test Campaign'
UNION ALL
SELECT 
  'Submissions',
  CAST(COUNT(*) AS TEXT),
  COALESCE(SUM(cl.earnings::numeric), 0)
FROM clip_submissions cs
LEFT JOIN clips cl ON cl.id = cs."clipId"
WHERE cs."campaignId" IN (SELECT id FROM campaigns WHERE title = 'Ultimate Test Campaign')
UNION ALL
SELECT 
  'Your User Total',
  u.email,
  u."totalEarnings"::numeric
FROM users u
WHERE u.role = 'CLIPPER';

-- To reset (UNCOMMENT TO RUN):
-- 
-- -- Reset campaign spent
-- UPDATE campaigns 
-- SET spent = 0 
-- WHERE title = 'Ultimate Test Campaign';
-- 
-- -- Reset all clips earnings for this campaign
-- UPDATE clips 
-- SET earnings = 0
-- WHERE id IN (
--   SELECT cs."clipId" 
--   FROM clip_submissions cs
--   WHERE cs."campaignId" IN (SELECT id FROM campaigns WHERE title = 'Ultimate Test Campaign')
-- );
-- 
-- -- Reset user total earnings
-- UPDATE users
-- SET "totalEarnings" = 0, "totalViews" = 0
-- WHERE role = 'CLIPPER';

