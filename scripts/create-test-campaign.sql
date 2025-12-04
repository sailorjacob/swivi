-- ============================================
-- TEST CAMPAIGN FOR SUBMISSION FLOW TESTING
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- ======================
-- STEP 1: Create Test Campaign
-- ======================
INSERT INTO campaigns (
  id,
  title,
  description,
  creator,
  budget,
  spent,
  "payoutRate",
  "startDate",
  status,
  "targetPlatforms",
  requirements,
  "featuredImage",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'Test Campaign — Submission Flow Testing',
  'Internal test campaign for testing the submission flow, verification, and view tracking. Small budget for controlled testing.',
  'Swivi Team',
  100.00,  -- Small test budget
  0.00,
  1.00,    -- $1 per 1K views
  NOW(),
  'ACTIVE',
  ARRAY['TIKTOK', 'YOUTUBE', 'INSTAGRAM']::"SocialPlatform"[],
  ARRAY[
    'Test requirement 1',
    'Test requirement 2'
  ],
  NULL,    -- No featured image for test
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING
RETURNING id, title, status, budget;

-- Verify campaign was created
SELECT 
  id,
  title,
  budget,
  "payoutRate",
  status,
  "createdAt"
FROM campaigns 
WHERE title ILIKE '%test campaign%submission%'
ORDER BY "createdAt" DESC
LIMIT 1;

-- ======================
-- STEP 2 (OPTIONAL): Create Test Verified Account
-- This allows testing without going through the full verification flow
-- Replace YOUR_USER_ID with your actual user ID from the users table
-- ======================

-- First, find your user ID:
SELECT id, email, name, role FROM users ORDER BY "createdAt" DESC LIMIT 10;

-- Then uncomment and run this with your user ID:
/*
-- Add a test TikTok account
INSERT INTO social_accounts (
  id, 
  "userId", 
  platform, 
  username, 
  "displayName", 
  "platformId", 
  verified, 
  "verifiedAt", 
  connected, 
  "createdAt", 
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'YOUR_USER_ID_HERE',  -- Replace with your user ID
  'TIKTOK',
  'testclipperaccount',  -- Replace with your TikTok username
  'Test TikTok Account',
  'tiktok_testclipperaccount_' || extract(epoch from now())::text,
  true,
  NOW(),
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Add a test Instagram account
INSERT INTO social_accounts (
  id, 
  "userId", 
  platform, 
  username, 
  "displayName", 
  "platformId", 
  verified, 
  "verifiedAt", 
  connected, 
  "createdAt", 
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'YOUR_USER_ID_HERE',  -- Replace with your user ID
  'INSTAGRAM',
  'testclipperaccount',  -- Replace with your IG username
  'Test Instagram Account',
  'instagram_testclipperaccount_' || extract(epoch from now())::text,
  true,
  NOW(),
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Add a test YouTube account
INSERT INTO social_accounts (
  id, 
  "userId", 
  platform, 
  username, 
  "displayName", 
  "platformId", 
  verified, 
  "verifiedAt", 
  connected, 
  "createdAt", 
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'YOUR_USER_ID_HERE',  -- Replace with your user ID
  'YOUTUBE',
  'testclipperaccount',  -- Replace with your YT username
  'Test YouTube Account',
  'youtube_testclipperaccount_' || extract(epoch from now())::text,
  true,
  NOW(),
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;
*/

-- ======================
-- STEP 3: Verify your accounts were created
-- ======================
-- Check all social accounts for a user
-- SELECT * FROM social_accounts WHERE "userId" = 'YOUR_USER_ID_HERE';

-- ======================
-- CLEANUP QUERIES (use after testing)
-- ======================
/*
-- Delete test campaign
DELETE FROM campaigns WHERE title ILIKE '%test campaign%submission%';

-- Delete test submissions (be careful!)
-- DELETE FROM clip_submissions WHERE "campaignId" IN (
--   SELECT id FROM campaigns WHERE title ILIKE '%test campaign%submission%'
-- );

-- Delete test social accounts
-- DELETE FROM social_accounts WHERE username = 'testclipperaccount';
*/
