-- ============================================
-- SEND NOTIFICATION TO OWNING MANHATTAN S2 CLIPPERS
-- Run this SQL in your Supabase SQL Editor
-- This sends a one-time notification to all clippers who have
-- submitted to the Owning Manhattan Season 2 campaign
-- Date: December 2024
-- ============================================

-- First, let's see how many unique clippers we'd be notifying
SELECT 
  COUNT(DISTINCT cs."userId") as unique_clippers,
  c.title as campaign_title
FROM clip_submissions cs
JOIN campaigns c ON cs."campaignId" = c.id
WHERE c.title ILIKE '%owning manhattan%season 2%'
GROUP BY c.title;

-- Create notifications for all clippers who have submitted to this campaign
-- Using SYSTEM_UPDATE notification type

INSERT INTO notifications (id, "userId", type, title, message, data, read, "createdAt")
SELECT 
  gen_random_uuid(),
  user_campaign."userId",
  'SYSTEM_UPDATE'::"NotificationType",
  '📣 SERHANT TEAM UPDATE - New Content Available',
  'New directive from the Serhant team: Fresh batch of punchier content is now live. Push for punchy on-video text, clever memeable content, and watch full videos for context. No duplicates will be accepted. Check the campaign for the new content folder!',
  jsonb_build_object(
    'campaignId', user_campaign."campaignId",
    'campaignTitle', user_campaign.title,
    'updateType', 'NEW_CONTENT_FOLDER',
    'contentFolderUrl', 'https://drive.google.com/drive/folders/1PBQcFZhCJrUOGH0QyARz60GshRnbz4kH?usp=drive_link'
  ),
  false,
  NOW()
FROM (
  SELECT DISTINCT cs."userId", c.id as "campaignId", c.title
  FROM clip_submissions cs
  JOIN campaigns c ON cs."campaignId" = c.id
  WHERE c.title ILIKE '%owning manhattan%season 2%'
) user_campaign;

-- Alternative: If you want to notify ALL verified clippers (not just those who submitted)
/*
INSERT INTO notifications (id, "userId", type, title, message, data, read, "createdAt")
SELECT 
  gen_random_uuid(),
  u.id,
  'SYSTEM_UPDATE'::"NotificationType",
  '📣 SERHANT TEAM UPDATE - New Content Available',
  'New directive from the Serhant team: Fresh batch of punchier content is now live for Owning Manhattan Season 2. Push for punchy on-video text, clever memeable content. No duplicates will be accepted!',
  jsonb_build_object(
    'updateType', 'NEW_CONTENT_FOLDER',
    'contentFolderUrl', 'https://drive.google.com/drive/folders/1PBQcFZhCJrUOGH0QyARz60GshRnbz4kH?usp=drive_link'
  ),
  false,
  NOW()
FROM users u
WHERE u.role = 'CLIPPER' AND u.verified = true;
*/

-- Verify notifications were created
SELECT 
  n.title,
  n.message,
  COUNT(*) as notification_count
FROM notifications n
WHERE n.title LIKE '%SERHANT TEAM UPDATE%'
GROUP BY n.title, n.message;

