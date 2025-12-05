-- =====================================================
-- DIAGNOSTIC: View Tracking Investigation
-- Run these queries in your Supabase SQL editor
-- =====================================================

-- 1. Check for STUCK running cron jobs (this blocks new runs!)
-- If you see any "RUNNING" jobs, they need to be marked as failed
SELECT 
  id,
  job_name,
  status,
  started_at,
  completed_at,
  clips_processed,
  error_message,
  NOW() - started_at as time_running
FROM cron_job_logs
WHERE job_name = 'view-tracking'
ORDER BY started_at DESC
LIMIT 20;

-- 2. FIX: Mark any stuck RUNNING jobs as FAILED (run this if you find stuck jobs)
-- UPDATE cron_job_logs
-- SET status = 'FAILED', 
--     completed_at = NOW(),
--     error_message = 'Manually marked as failed - was stuck in RUNNING state'
-- WHERE job_name = 'view-tracking' 
--   AND status = 'RUNNING'
--   AND started_at < NOW() - INTERVAL '15 minutes';

-- 3. Check ACTIVE campaigns with APPROVED submissions
SELECT 
  c.id as campaign_id,
  c.title,
  c.status as campaign_status,
  c.budget,
  c.spent,
  c.is_test,
  c.deleted_at,
  COUNT(DISTINCT cs.id) as approved_submissions,
  COUNT(DISTINCT cl.id) as clips_with_data
FROM campaigns c
LEFT JOIN clip_submissions cs ON cs.campaign_id = c.id AND cs.status = 'APPROVED'
LEFT JOIN clips cl ON cl.id = cs.clip_id
WHERE c.status = 'ACTIVE'
  AND c.is_test = false
  AND c.deleted_at IS NULL
GROUP BY c.id
ORDER BY c.created_at DESC;

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
  cs.initial_views,
  c.id as campaign_id,
  c.title as campaign_title,
  c.status as campaign_status,
  (SELECT MAX(vt.date) FROM view_tracking vt WHERE vt.clip_id = cl.id) as last_tracked
FROM clips cl
JOIN clip_submissions cs ON cs.clip_id = cl.id
JOIN campaigns c ON c.id = cs.campaign_id
WHERE cs.status = 'APPROVED'
  AND c.status IN ('ACTIVE', 'PAUSED')
  AND c.is_test = false
  AND c.deleted_at IS NULL
  AND cl.status = 'ACTIVE'
ORDER BY last_tracked ASC NULLS FIRST
LIMIT 50;

-- 5. Check view tracking records in the last 48 hours
SELECT 
  vt.date,
  COUNT(*) as tracking_count,
  SUM(vt.views::bigint) as total_views_tracked
FROM view_tracking vt
WHERE vt.date > NOW() - INTERVAL '48 hours'
GROUP BY vt.date
ORDER BY vt.date DESC;

-- 6. Identify clips that haven't been tracked in 24+ hours (should be tracked every 5 min!)
SELECT 
  cl.id as clip_id,
  cl.url,
  c.title as campaign,
  cl.status as clip_status,
  c.status as campaign_status,
  MAX(vt.date) as last_tracked,
  NOW() - MAX(vt.date) as hours_since_tracked
FROM clips cl
JOIN clip_submissions cs ON cs.clip_id = cl.id
JOIN campaigns c ON c.id = cs.campaign_id
LEFT JOIN view_tracking vt ON vt.clip_id = cl.id
WHERE cs.status = 'APPROVED'
  AND c.status = 'ACTIVE'
  AND c.is_test = false
  AND cl.status = 'ACTIVE'
GROUP BY cl.id, cl.url, c.title, cl.status, c.status
HAVING MAX(vt.date) IS NULL OR MAX(vt.date) < NOW() - INTERVAL '24 hours'
ORDER BY last_tracked ASC NULLS FIRST;

