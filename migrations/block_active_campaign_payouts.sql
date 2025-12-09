-- Migration: Block Active Campaign Payouts
-- Date: December 9, 2025
-- Purpose: Clean existing payout requests made before campaign completion restriction was implemented
-- IMPORTANT: Run this AFTER deploying the code changes that restrict payouts to completed campaigns

-- ============================================================================
-- STEP 1: Review current payout requests before deletion
-- ============================================================================
-- Run this SELECT first to see what will be deleted:
/*
SELECT 
  pr.id,
  pr.amount,
  pr.status,
  pr.payment_method,
  pr.requested_at,
  u.name,
  u.email
FROM payout_requests pr
JOIN users u ON pr.user_id = u.id
WHERE pr.status IN ('PENDING', 'APPROVED', 'PROCESSING')
ORDER BY pr.requested_at DESC;
*/

-- ============================================================================
-- STEP 2: Delete pending payout requests (campaign not yet completed)
-- ============================================================================
-- These requests were made while campaigns are still active
-- Clippers will be notified and can re-request once campaign completes

-- Option A: Delete all pending/approved/processing requests
DELETE FROM payout_requests 
WHERE status IN ('PENDING', 'APPROVED', 'PROCESSING');

-- Option B: If you want to cancel instead of delete (keeps audit trail):
/*
UPDATE payout_requests 
SET 
  status = 'CANCELLED',
  notes = 'Cancelled: Campaign payouts restricted until campaign completion. Please re-request after campaign ends.',
  processed_at = NOW()
WHERE status IN ('PENDING', 'APPROVED', 'PROCESSING');
*/

-- ============================================================================
-- STEP 3: Verify cleanup
-- ============================================================================
-- Should return 0 rows after cleanup:
/*
SELECT COUNT(*) as pending_requests
FROM payout_requests 
WHERE status IN ('PENDING', 'APPROVED', 'PROCESSING');
*/

-- ============================================================================
-- STEP 4: Check current campaign status
-- ============================================================================
-- See which campaigns are active (clippers can't request payouts from these):
/*
SELECT 
  id,
  title,
  status,
  budget,
  spent,
  ROUND((COALESCE(spent, 0) / NULLIF(budget, 0) * 100)::numeric, 1) as budget_percent,
  created_at
FROM campaigns
WHERE status = 'ACTIVE' AND deleted_at IS NULL
ORDER BY created_at DESC;
*/

-- ============================================================================
-- STEP 5: See earnings breakdown by campaign status
-- ============================================================================
-- This shows which earnings are "locked" (active campaigns) vs "payable" (completed):
/*
SELECT 
  c.title as campaign,
  c.status as campaign_status,
  COUNT(cs.id) as submissions,
  SUM(COALESCE(cl.earnings, 0)) as total_earnings
FROM clip_submissions cs
JOIN campaigns c ON cs.campaign_id = c.id
LEFT JOIN clips cl ON cs.clip_id = cl.id
WHERE cs.status = 'APPROVED'
GROUP BY c.id, c.title, c.status
ORDER BY c.status, c.title;
*/

-- ============================================================================
-- NOTES FOR CLIPPERS
-- ============================================================================
-- When the campaign completes:
-- 1. System will automatically mark campaign as COMPLETED
-- 2. Clippers will receive notification that earnings are now available
-- 3. Clippers can then request payouts for those earnings
-- 4. This ensures clippers keep videos live until campaign ends


