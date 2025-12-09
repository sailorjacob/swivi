-- ============================================
-- OWNING MANHATTAN SEASON 2 - NEW CONTENT FOLDER UPDATE
-- Run this SQL in your Supabase SQL Editor
-- Date: December 2024
-- 
-- NOTE: There are now TWO content folders for this campaign:
-- 1. Original folder (keep existing contentFolderUrl)
-- 2. New folder: https://drive.google.com/drive/folders/1PBQcFZhCJrUOGH0QyARz60GshRnbz4kH
--
-- The new folder link is shown via the Team Update dialog in the UI.
-- ============================================

-- View current campaign settings
SELECT 
  id,
  title,
  "contentFolderUrl",
  description,
  requirements
FROM campaigns 
WHERE title ILIKE '%owning manhattan%season 2%'
ORDER BY "createdAt" DESC
LIMIT 1;

-- ============================================
-- Update description to note new content available
-- Keep the original content folder URL - new folder shown in Team Update
-- ============================================

UPDATE campaigns 
SET 
  description = 'Season 2 is LIVE on Netflix! This is our biggest clipping campaign ever with a $20,000 total budget. Post clips, drive views, and earn $1 per 1,000 views automatically. Plus $2,000 in bounties for performance-based bonuses. NEW: Check the Team Update for the latest content folder with punchier moments.',
  "updatedAt" = NOW()
WHERE title ILIKE '%owning manhattan%season 2%';

-- ============================================
-- Update requirements with the new directive
-- ============================================

UPDATE campaigns 
SET 
  requirements = ARRAY[
    'NEW: Watch full videos for context before clipping',
    'NEW: Add PUNCHY on-video text - elevate the joke, drama, or relatability',
    'NEW: Focus on clever, memeable, shareable moments',
    'NEW: NO DUPLICATES - unique angles only, recycled content will be rejected',
    'Must tag @owningmanhattan in the post caption',
    'Must tag @serhant in the post caption', 
    'Must tag @ryanserhant in the post caption',
    'Must use approved content from the shared Google Drive folders',
    'Caption must include: "Season 2 now on Netflix"',
    'Recommended: Post 3-7 clips per day',
    'Best clips are 6-15 seconds with fast hooks',
    'Add subtitles and on-screen context for best results'
  ],
  "updatedAt" = NOW()
WHERE title ILIKE '%owning manhattan%season 2%';

-- Verify the update
SELECT 
  id,
  title,
  description,
  "contentFolderUrl",
  requirements,
  "updatedAt"
FROM campaigns 
WHERE title ILIKE '%owning manhattan%season 2%'
ORDER BY "createdAt" DESC
LIMIT 1;

