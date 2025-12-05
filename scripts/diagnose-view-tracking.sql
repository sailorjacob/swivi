-- =====================================================
-- DIAGNOSTIC: View Tracking Investigation
-- Run these queries in your Supabase SQL editor
-- NOTE: Column names use camelCase (Prisma schema convention)
-- =====================================================

-- 1. Check for STUCK running cron jobs (this blocks new runs!)
-- If you see any "RUNNING" jobs, they need to be marked as failed
SELECT 
  id,
  "jobName",
  status,
  "startedAt",
  "completedAt",
  "clipsProcessed",
  "errorMessage",
  NOW() - "startedAt" as time_running
FROM cron_job_logs
WHERE "jobName" = 'view-tracking'
ORDER BY "startedAt" DESC
LIMIT 20;

-- 2. FIX: Mark any stuck RUNNING jobs as FAILED (run this if you find stuck jobs)
-- UPDATE cron_job_logs
-- SET status = 'FAILED', 
--     "completedAt" = NOW(),
--     "errorMessage" = 'Manually marked as failed - was stuck in RUNNING state'
-- WHERE "jobName" = 'view-tracking' 
--   AND status = 'RUNNING'
--   AND "startedAt" < NOW() - INTERVAL '15 minutes';

-- 3. Check ACTIVE campaigns with APPROVED submissions
SELECT 
  c.id as campaign_id,
  c.title,
  c.status as campaign_status,
  c.budget,
  c.spent,
  c."isTest",
  c."deletedAt",
  COUNT(DISTINCT cs.id) as approved_submissions,
  COUNT(DISTINCT cl.id) as clips_with_data
FROM campaigns c
LEFT JOIN clip_submissions cs ON cs."campaignId" = c.id AND cs.status = 'APPROVED'
LEFT JOIN clips cl ON cl.id = cs."clipId"
WHERE c.status = 'ACTIVE'
  AND c."isTest" = false
  AND c."deletedAt" IS NULL
GROUP BY c.id
ORDER BY c."createdAt" DESC;

-- 4. Check clips that SHOULD be tracked (APPROVED submissions in ACTIVE campaigns)
SELECT 
  cl.id as clip_id,
  cl.url,
  cl.platform,
  cl.status as clip_status,
  cl.views as current_views,
  cl.earnings,
  cs.id as submission_id,
  cs.status as submission_status,
  cs."initialViews",
  c.id as campaign_id,
  c.title as campaign_title,
  c.status as campaign_status,
  (SELECT MAX(vt."scrapedAt") FROM view_tracking vt WHERE vt."clipId" = cl.id) as last_scraped
FROM clips cl
JOIN clip_submissions cs ON cs."clipId" = cl.id
JOIN campaigns c ON c.id = cs."campaignId"
WHERE cs.status = 'APPROVED'
  AND c.status IN ('ACTIVE', 'PAUSED')
  AND c."isTest" = false
  AND c."deletedAt" IS NULL
  AND cl.status = 'ACTIVE'
ORDER BY last_scraped ASC NULLS FIRST
LIMIT 50;

-- 5. Check view tracking records - use scrapedAt for actual times
SELECT 
  DATE(vt."scrapedAt") as scrape_date,
  COUNT(*) as tracking_count,
  MAX(vt."scrapedAt") as last_scrape_time,
  SUM(vt.views::bigint) as total_views_tracked
FROM view_tracking vt
WHERE vt."scrapedAt" > NOW() - INTERVAL '48 hours'
GROUP BY DATE(vt."scrapedAt")
ORDER BY scrape_date DESC;

-- 6. Most recent scrapes (actual view tracking activity)
SELECT 
  vt.id,
  vt."clipId",
  vt.views,
  vt."scrapedAt",
  cl.url,
  cl.platform
FROM view_tracking vt
JOIN clips cl ON cl.id = vt."clipId"
ORDER BY vt."scrapedAt" DESC
LIMIT 30;

-- 7. Identify clips that haven't been tracked in 1+ hours (should be tracked every 5 min!)
SELECT 
  cl.id as clip_id,
  cl.url,
  c.title as campaign,
  cl.status as clip_status,
  c.status as campaign_status,
  MAX(vt."scrapedAt") as last_scraped,
  NOW() - MAX(vt."scrapedAt") as time_since_tracked
FROM clips cl
JOIN clip_submissions cs ON cs."clipId" = cl.id
JOIN campaigns c ON c.id = cs."campaignId"
LEFT JOIN view_tracking vt ON vt."clipId" = cl.id
WHERE cs.status = 'APPROVED'
  AND c.status = 'ACTIVE'
  AND c."isTest" = false
  AND cl.status = 'ACTIVE'
GROUP BY cl.id, cl.url, c.title, cl.status, c.status
HAVING MAX(vt."scrapedAt") IS NULL OR MAX(vt."scrapedAt") < NOW() - INTERVAL '1 hour'
ORDER BY last_scraped ASC NULLS FIRST;
