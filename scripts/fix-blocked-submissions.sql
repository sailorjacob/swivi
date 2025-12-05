-- Fix submissions blocked by "Post authorship verification not yet implemented"
-- Run this in Supabase SQL Editor

-- First, let's see what we're dealing with
SELECT 
  cs.id,
  cs.status,
  cs."clipUrl",
  cs.platform,
  cs."initialViews",
  cs."rejectionReason",
  cs."createdAt",
  u.email as user_email,
  c.title as campaign_title
FROM clip_submissions cs
JOIN users u ON cs."userId" = u.id
JOIN campaigns c ON cs."campaignId" = c.id
WHERE cs."rejectionReason" LIKE '%not yet implemented%'
   OR cs."rejectionReason" LIKE '%authorship verification%'
ORDER BY cs."createdAt" DESC;

-- ============================================
-- OPTION 1: Reset to PENDING for admin review
-- (Recommended - lets you approve them properly)
-- ============================================

UPDATE clip_submissions
SET 
  status = 'PENDING',
  "rejectionReason" = NULL,
  "requiresReview" = false,
  "reviewReason" = NULL,
  "processingStatus" = 'NEEDS_RESCRAPE'
WHERE "rejectionReason" LIKE '%not yet implemented%'
   OR "rejectionReason" LIKE '%authorship verification%';

-- ============================================
-- OPTION 2: Auto-approve AND set initialViews = 0
-- (Use this if you want ALL views to count as earnings)
-- WARNING: This counts ALL existing views as earnings!
-- ============================================

-- Step 2a: Update submissions to APPROVED with initialViews = 0
/*
UPDATE clip_submissions
SET 
  status = 'APPROVED',
  "rejectionReason" = NULL,
  "requiresReview" = false,
  "reviewReason" = NULL,
  "initialViews" = 0,
  "processingStatus" = 'READY_FOR_TRACKING'
WHERE "rejectionReason" LIKE '%not yet implemented%'
   OR "rejectionReason" LIKE '%authorship verification%';
*/

-- Step 2b: Create clips for each approved submission (run after 2a)
-- NOTE: This needs to be done in app code, not SQL
-- The admin approval flow will create clips automatically

-- ============================================
-- Check the results
-- ============================================
SELECT 
  status,
  COUNT(*) as count,
  SUM(CASE WHEN "clipId" IS NOT NULL THEN 1 ELSE 0 END) as has_clip
FROM clip_submissions
WHERE "createdAt" > NOW() - INTERVAL '7 days'
GROUP BY status;

