-- REDISTRIBUTE CLIP EARNINGS
-- This script restores clip.earnings based on views gained and campaign payout rate
-- Run this after clip.earnings were accidentally wiped

-- Step 1: Check the campaign details
SELECT id, title, "payoutRate", budget, spent 
FROM campaigns 
WHERE id = 'cmhb7gwov0000le047f1qg2k5';

-- Step 2: Calculate what each clip SHOULD have earned based on views gained
-- Formula: earnings = (currentViews - initialViews) * (payoutRate / 1000)
WITH clip_calculations AS (
  SELECT 
    cs."clipId",
    cs."initialViews",
    cl.views as current_views,
    (COALESCE(cl.views, 0) - COALESCE(cs."initialViews", 0)) as views_gained,
    c."payoutRate",
    -- Calculate earnings: views_gained * (payoutRate / 1000)
    ROUND(
      GREATEST(0, (COALESCE(cl.views, 0) - COALESCE(cs."initialViews", 0))) * 
      (c."payoutRate" / 1000.0),
      2
    ) as calculated_earnings,
    u.email,
    cl.earnings as current_earnings
  FROM clip_submissions cs
  JOIN clips cl ON cs."clipId" = cl.id
  JOIN campaigns c ON cs."campaignId" = c.id
  JOIN users u ON cs."userId" = u.id
  WHERE cs."campaignId" = 'cmhb7gwov0000le047f1qg2k5'
  AND cs.status = 'APPROVED'
  AND cs."clipId" IS NOT NULL
)
SELECT 
  "clipId",
  current_views,
  "initialViews",
  views_gained,
  "payoutRate" as rate_per_1k,
  calculated_earnings,
  current_earnings,
  email
FROM clip_calculations
ORDER BY calculated_earnings DESC;

-- Step 3: Check what the total would be (should be close to campaign.spent = $6000)
WITH clip_calculations AS (
  SELECT 
    cs."clipId",
    ROUND(
      GREATEST(0, (COALESCE(cl.views, 0) - COALESCE(cs."initialViews", 0))) * 
      (c."payoutRate" / 1000.0),
      2
    ) as calculated_earnings
  FROM clip_submissions cs
  JOIN clips cl ON cs."clipId" = cl.id
  JOIN campaigns c ON cs."campaignId" = c.id
  WHERE cs."campaignId" = 'cmhb7gwov0000le047f1qg2k5'
  AND cs.status = 'APPROVED'
  AND cs."clipId" IS NOT NULL
)
SELECT 
  COUNT(*) as clips_count,
  SUM(calculated_earnings) as total_calculated_earnings,
  6000.00 as campaign_spent,
  6000.00 - SUM(calculated_earnings) as difference
FROM clip_calculations;

-- Step 4: Actually update the clip.earnings (ONLY RUN AFTER VERIFYING STEP 3!)
-- This updates clips based on their views gained * payout rate
UPDATE clips
SET earnings = calculated.new_earnings
FROM (
  SELECT 
    cs."clipId",
    ROUND(
      GREATEST(0, (COALESCE(cl.views, 0) - COALESCE(cs."initialViews", 0))) * 
      (c."payoutRate" / 1000.0),
      2
    ) as new_earnings
  FROM clip_submissions cs
  JOIN clips cl ON cs."clipId" = cl.id
  JOIN campaigns c ON cs."campaignId" = c.id
  WHERE cs."campaignId" = 'cmhb7gwov0000le047f1qg2k5'
  AND cs.status = 'APPROVED'
  AND cs."clipId" IS NOT NULL
) as calculated
WHERE clips.id = calculated."clipId"
AND clips.earnings = 0;  -- Only update clips that currently have 0 earnings

-- Step 5: Also update the finalEarnings on submissions (for historical record)
UPDATE clip_submissions
SET "finalEarnings" = clips.earnings
FROM clips
WHERE clip_submissions."clipId" = clips.id
AND clip_submissions."campaignId" = 'cmhb7gwov0000le047f1qg2k5'
AND clip_submissions.status = 'APPROVED'
AND clip_submissions."finalEarnings" = 0;

-- Step 6: Verify the fix
SELECT 
  cs."clipId",
  cl.earnings,
  cs."finalEarnings",
  u.email
FROM clip_submissions cs
JOIN clips cl ON cs."clipId" = cl.id
JOIN users u ON cs."userId" = u.id
WHERE cs."campaignId" = 'cmhb7gwov0000le047f1qg2k5'
AND cs.status = 'APPROVED'
ORDER BY cl.earnings DESC;

