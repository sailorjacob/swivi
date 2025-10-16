-- Performance indexes for better query optimization

-- Users table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "users_supabaseAuthId_idx" ON "users"("supabaseAuthId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "users_email_idx" ON "users"("email");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "users_role_idx" ON "users"("role");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "users_verified_idx" ON "users"("verified");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "users_createdAt_idx" ON "users"("createdAt");

-- Campaigns table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "campaigns_status_idx" ON "campaigns"("status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "campaigns_startDate_idx" ON "campaigns"("startDate");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "campaigns_createdAt_idx" ON "campaigns"("createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "campaigns_status_startDate_idx" ON "campaigns"("status", "startDate");

-- Clip submissions table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "clip_submissions_userId_idx" ON "clip_submissions"("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "clip_submissions_campaignId_idx" ON "clip_submissions"("campaignId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "clip_submissions_status_idx" ON "clip_submissions"("status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "clip_submissions_platform_idx" ON "clip_submissions"("platform");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "clip_submissions_createdAt_idx" ON "clip_submissions"("createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "clip_submissions_userId_status_idx" ON "clip_submissions"("userId", "status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "clip_submissions_campaignId_status_idx" ON "clip_submissions"("campaignId", "status");

-- Clips table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "clips_userId_idx" ON "clips"("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "clips_submissionId_idx" ON "clips"("submissionId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "clips_platform_idx" ON "clips"("platform");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "clips_createdAt_idx" ON "clips"("createdAt");

-- Payouts table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "payouts_userId_idx" ON "payouts"("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "payouts_campaignId_idx" ON "payouts"("campaignId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "payouts_submissionId_idx" ON "payouts"("submissionId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "payouts_status_idx" ON "payouts"("status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "payouts_createdAt_idx" ON "payouts"("createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "payouts_userId_status_idx" ON "payouts"("userId", "status");

-- View tracking table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "view_tracking_clipId_idx" ON "view_tracking"("clipId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "view_tracking_userId_idx" ON "view_tracking"("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "view_tracking_platform_idx" ON "view_tracking"("platform");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "view_tracking_date_idx" ON "view_tracking"("date");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "view_tracking_clipId_date_idx" ON "view_tracking"("clipId", "date");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "view_tracking_platform_date_idx" ON "view_tracking"("platform", "date");

-- Social accounts table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "social_accounts_userId_idx" ON "social_accounts"("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "social_accounts_platform_idx" ON "social_accounts"("platform");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "social_accounts_verified_idx" ON "social_accounts"("verified");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "social_accounts_userId_platform_idx" ON "social_accounts"("userId", "platform");

-- Social verifications table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "social_verifications_userId_idx" ON "social_verifications"("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "social_verifications_platform_idx" ON "social_verifications"("platform");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "social_verifications_verified_idx" ON "social_verifications"("verified");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "social_verifications_expiresAt_idx" ON "social_verifications"("expiresAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "social_verifications_createdAt_idx" ON "social_verifications"("createdAt");

-- Referrals table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "referrals_referrerId_idx" ON "referrals"("referrerId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "referrals_referredId_idx" ON "referrals"("referredId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "referrals_status_idx" ON "referrals"("status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "referrals_createdAt_idx" ON "referrals"("createdAt");

-- Notification indexes (already created in previous migration, but ensuring they exist)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "notifications_userId_idx" ON "notifications"("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "notifications_createdAt_idx" ON "notifications"("createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "notifications_read_idx" ON "notifications"("read");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "notifications_type_idx" ON "notifications"("type");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "notifications_userId_read_idx" ON "notifications"("userId", "read");
