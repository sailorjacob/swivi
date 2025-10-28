-- Quick check to see if payout system migration has been applied
-- Run this in your Supabase SQL editor or psql

-- Check 1: Does PayoutRequest table exist?
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'payout_requests'
) as payout_requests_exists;

-- Check 2: Does ClipSubmission have initialViews column?
SELECT EXISTS (
  SELECT FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND table_name = 'clip_submissions' 
  AND column_name = 'initialViews'
) as initial_views_exists;

-- Check 3: Does ClipSubmission have finalEarnings column?
SELECT EXISTS (
  SELECT FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND table_name = 'clip_submissions' 
  AND column_name = 'finalEarnings'
) as final_earnings_exists;

-- If all three return 'true', you're good to go!
-- If any return 'false', you need to run the migration.

