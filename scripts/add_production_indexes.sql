-- =====================================================
-- Production Database Indexes for High-Traffic Scaling
-- Run this before launching to many users
-- =====================================================

-- 1. Index for fast clip lookups by status and platform (for view tracking)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clips_status_platform 
ON clips(status, platform) 
WHERE status = 'ACTIVE';

-- 2. Index for active campaign lookups (most common query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaigns_status_created 
ON campaigns(status, "createdAt" DESC) 
WHERE status = 'ACTIVE';

-- 3. Partial index for recent view tracking (last 30 days)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_view_tracking_recent 
ON view_tracking("clipId", date DESC) 
WHERE date > NOW() - INTERVAL '30 days';

-- 4. Index for user submissions lookup (dashboard queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_user_created 
ON clip_submissions("userId", "createdAt" DESC);

-- 5. Index for campaign submissions with status (admin approval workflow)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_campaign_status 
ON clip_submissions("campaignId", status, "createdAt" DESC);

-- 6. Index for user lookup by supabase auth ID (every authenticated request)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_supabase_auth 
ON users("supabaseAuthId");

-- 7. Index for notifications (user notifications page)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_read 
ON notifications("userId", read, "createdAt" DESC);

-- 8. Index for social accounts verification lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_social_accounts_user_platform 
ON social_accounts("userId", platform, verified);

-- 9. Index for payout requests (admin processing)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payout_requests_status 
ON payout_requests(status, "requestedAt" DESC);

-- 10. Index for cron job logs (rate limiting and monitoring)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cron_logs_job_status 
ON cron_job_logs("jobName", status, "startedAt" DESC);

-- 11. Index for clips by user (dashboard)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clips_user_created 
ON clips("userId", "createdAt" DESC);

-- 12. Index for approved submissions with clips (earnings calculation)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_approved_clip 
ON clip_submissions("clipId", status) 
WHERE status = 'APPROVED' AND "clipId" IS NOT NULL;

-- =====================================================
-- Verify indexes were created
-- =====================================================
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;











