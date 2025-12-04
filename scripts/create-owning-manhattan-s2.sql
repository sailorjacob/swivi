-- ============================================
-- OWNING MANHATTAN SEASON 2 CAMPAIGN SETUP
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- First, let's check if a similar campaign already exists
SELECT id, title, status FROM campaigns 
WHERE title ILIKE '%owning manhattan%' 
ORDER BY "createdAt" DESC;

-- Create the Owning Manhattan Season 2 Campaign
-- IMPORTANT: Update the image URL placeholder with your actual image URL
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
  'Owning Manhattan Season 2 — Official Clipping Campaign',
  'Season 2 is LIVE on Netflix! This is our biggest clipping campaign ever with a $20,000 total budget. Post clips, drive views, and earn $1 per 1,000 views automatically. Plus $2,000 in bounties for performance-based bonuses. Move fast and start earning!',
  'Netflix × SERHANT',
  20000.00,
  0.00,
  1.00, -- $1 per 1K views
  NOW(),
  'ACTIVE',
  ARRAY['TIKTOK', 'YOUTUBE', 'INSTAGRAM']::"SocialPlatform"[],
  ARRAY[
    'Must tag @owningmanhattan in the post caption',
    'Must tag @serhant in the post caption', 
    'Must tag @ryanserhant in the post caption',
    'Must use approved content from the shared Google Drive folders',
    'If recording your own clips from Season 2, clips must be clear, relevant, and tied to Season 2 promotion',
    'Caption must include: "Season 2 now on Netflix"',
    'Recommended: Post 3-7 clips per day',
    'Best clips are 6-15 seconds with fast hooks',
    'Add subtitles and on-screen context for best results'
  ],
  'https://twejikjgxkzmphocbvpt.supabase.co/storage/v1/object/public/havensvgs/owningmanhattan.avif', -- UPDATE THIS with your actual image URL
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- Verify the campaign was created
SELECT 
  id,
  title,
  description,
  creator,
  budget,
  "payoutRate",
  status,
  "targetPlatforms",
  requirements,
  "featuredImage",
  "createdAt"
FROM campaigns 
WHERE title ILIKE '%owning manhattan%season 2%'
ORDER BY "createdAt" DESC
LIMIT 1;

-- ============================================
-- OPTIONAL: If you want to update an existing campaign
-- Uncomment and modify the ID below
-- ============================================
/*
UPDATE campaigns 
SET 
  title = 'Owning Manhattan Season 2 — Official Clipping Campaign',
  description = 'Season 2 is LIVE on Netflix! This is our biggest clipping campaign ever with a $20,000 total budget. Post clips, drive views, and earn $1 per 1,000 views automatically. Plus $2,000 in bounties for performance-based bonuses. Move fast and start earning!',
  creator = 'Netflix × SERHANT',
  budget = 20000.00,
  "payoutRate" = 1.00,
  status = 'ACTIVE',
  "targetPlatforms" = ARRAY['TIKTOK', 'YOUTUBE', 'INSTAGRAM']::"SocialPlatform"[],
  requirements = ARRAY[
    'Must tag @owningmanhattan in the post caption',
    'Must tag @serhant in the post caption', 
    'Must tag @ryanserhant in the post caption',
    'Must use approved content from the shared Google Drive folders',
    'If recording your own clips from Season 2, clips must be clear, relevant, and tied to Season 2 promotion',
    'Caption must include: "Season 2 now on Netflix"',
    'Recommended: Post 3-7 clips per day',
    'Best clips are 6-15 seconds with fast hooks',
    'Add subtitles and on-screen context for best results'
  ],
  "featuredImage" = 'YOUR_IMAGE_URL_HERE',
  "updatedAt" = NOW()
WHERE id = 'YOUR_CAMPAIGN_ID_HERE';
*/
