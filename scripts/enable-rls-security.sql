-- ============================================================
-- SUPABASE DATABASE SECURITY: Enable RLS on All Tables
-- ============================================================
-- 
-- WHAT THIS DOES:
-- - Enables Row Level Security (RLS) on all your tables
-- - With RLS enabled and NO policies, the Supabase REST API
--   (and anyone with your anon key) CANNOT access your data
-- - Your Prisma code continues working because it connects
--   directly to PostgreSQL and bypasses RLS entirely
--
-- WHY THIS IS SAFE:
-- - You use Prisma for all database access (lib/prisma.ts)
-- - Prisma connects via DATABASE_URL which uses the postgres role
-- - The postgres role bypasses RLS (it's a superuser)
-- - Supabase Auth still works (it uses internal tables, not these)
--
-- HOW TO RUN:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Paste this entire script
-- 3. Click "Run"
-- ============================================================

-- First, let's see what tables currently have RLS enabled/disabled
-- (This is just informational, you can skip this section)
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================
-- ENABLE RLS ON ALL YOUR TABLES
-- ============================================================

-- Users table - contains personal info, wallet addresses, earnings
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;

-- Campaigns table - your campaign data
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns FORCE ROW LEVEL SECURITY;

-- Clips table - user clip submissions
ALTER TABLE clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE clips FORCE ROW LEVEL SECURITY;

-- Clip submissions - links clips to campaigns
ALTER TABLE clip_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clip_submissions FORCE ROW LEVEL SECURITY;

-- Payouts - payment records
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts FORCE ROW LEVEL SECURITY;

-- Payout requests - user payout requests
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests FORCE ROW LEVEL SECURITY;

-- View tracking - analytics data
ALTER TABLE view_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE view_tracking FORCE ROW LEVEL SECURITY;

-- Cron job logs - internal system logs
ALTER TABLE cron_job_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cron_job_logs FORCE ROW LEVEL SECURITY;

-- Referrals - referral tracking
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals FORCE ROW LEVEL SECURITY;

-- Social accounts - connected social media
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts FORCE ROW LEVEL SECURITY;

-- Social verifications - verification codes
ALTER TABLE social_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_verifications FORCE ROW LEVEL SECURITY;

-- Notifications - user notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications FORCE ROW LEVEL SECURITY;

-- Support tickets - user support requests
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets FORCE ROW LEVEL SECURITY;

-- Verification tokens - auth tokens
ALTER TABLE verificationtokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE verificationtokens FORCE ROW LEVEL SECURITY;

-- Bounty applications - bounty program
ALTER TABLE bounty_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE bounty_applications FORCE ROW LEVEL SECURITY;

-- ============================================================
-- VERIFY RLS IS NOW ENABLED
-- ============================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE WHEN rowsecurity THEN '✅ SECURED' ELSE '❌ NOT SECURED' END as status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================
-- DONE! 
-- ============================================================
-- Your database is now secured:
-- ✅ Supabase REST API (anon key) - BLOCKED (no data access)
-- ✅ Supabase Auth - STILL WORKS (uses internal auth schema)
-- ✅ Your Next.js app via Prisma - STILL WORKS (bypasses RLS)
-- ============================================================









