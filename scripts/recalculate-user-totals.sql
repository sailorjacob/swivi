-- Recalculate User.totalViews and User.totalEarnings from actual clip data
-- This fixes the discrepancy between cached User table values and real-time clip data

-- Step 1: Create a temporary view to calculate correct values per user
CREATE TEMP VIEW user_correct_totals AS
SELECT 
  u.id AS user_id,
  u.email,
  u.name,
  -- Current cached values (INCORRECT)
  u."totalViews" AS cached_views,
  u."totalEarnings" AS cached_earnings,
  -- Calculated real values from clips (CORRECT)
  COALESCE(SUM(
    CASE 
      WHEN cs.status = 'APPROVED' AND vt.views IS NOT NULL 
      THEN vt.views 
      ELSE 0 
    END
  ), 0) AS calculated_views,
  COALESCE(SUM(
    CASE 
      WHEN cs.status = 'APPROVED' AND c.earnings IS NOT NULL 
      THEN c.earnings 
      ELSE 0 
    END
  ), 0) AS calculated_earnings,
  -- Difference (to see what needs updating)
  COALESCE(SUM(
    CASE 
      WHEN cs.status = 'APPROVED' AND vt.views IS NOT NULL 
      THEN vt.views 
      ELSE 0 
    END
  ), 0) - u."totalViews" AS views_diff,
  COALESCE(SUM(
    CASE 
      WHEN cs.status = 'APPROVED' AND c.earnings IS NOT NULL 
      THEN c.earnings 
      ELSE 0 
    END
  ), 0) - u."totalEarnings" AS earnings_diff
FROM users u
LEFT JOIN clip_submissions cs ON cs."userId" = u.id
LEFT JOIN clips c ON c.id = cs."clipId"
LEFT JOIN LATERAL (
  -- Get the latest view tracking for each clip
  SELECT views
  FROM view_tracking vt2
  WHERE vt2."clipId" = c.id
  ORDER BY vt2.date DESC
  LIMIT 1
) vt ON true
GROUP BY u.id, u.email, u.name, u."totalViews", u."totalEarnings";

-- Step 2: Show summary before updating
SELECT 
  '=== SUMMARY BEFORE UPDATE ===' AS status,
  COUNT(*) AS total_users,
  COUNT(CASE WHEN views_diff != 0 THEN 1 END) AS users_with_view_diff,
  COUNT(CASE WHEN earnings_diff != 0 THEN 1 END) AS users_with_earnings_diff,
  SUM(cached_views) AS total_cached_views,
  SUM(calculated_views) AS total_calculated_views,
  SUM(views_diff) AS total_views_difference,
  SUM(cached_earnings) AS total_cached_earnings,
  SUM(calculated_earnings) AS total_calculated_earnings,
  SUM(earnings_diff) AS total_earnings_difference
FROM user_correct_totals;

-- Step 3: Show users with significant differences (> 1000 views or > $1 earnings)
SELECT 
  email,
  name,
  cached_views,
  calculated_views,
  views_diff,
  cached_earnings,
  calculated_earnings,
  earnings_diff
FROM user_correct_totals
WHERE ABS(views_diff) > 1000 OR ABS(earnings_diff) > 1
ORDER BY ABS(views_diff) DESC, ABS(earnings_diff) DESC
LIMIT 20;

-- Step 4: Update all users with correct values from clips
UPDATE users u
SET 
  "totalViews" = uct.calculated_views,
  "totalEarnings" = uct.calculated_earnings,
  "updatedAt" = NOW()
FROM user_correct_totals uct
WHERE u.id = uct.user_id
  AND (u."totalViews" != uct.calculated_views OR u."totalEarnings" != uct.calculated_earnings);

-- Step 5: Show summary after update
SELECT 
  '=== SUMMARY AFTER UPDATE ===' AS status,
  COUNT(*) AS total_users_updated;

-- Step 6: Verify the update worked
SELECT 
  u.id,
  u.email,
  u."totalViews" AS views_in_db,
  u."totalEarnings" AS earnings_in_db,
  COUNT(DISTINCT cs.id) AS total_submissions,
  COUNT(DISTINCT CASE WHEN cs.status = 'APPROVED' THEN cs.id END) AS approved_submissions
FROM users u
LEFT JOIN clip_submissions cs ON cs."userId" = u.id
GROUP BY u.id, u.email, u."totalViews", u."totalEarnings"
HAVING COUNT(DISTINCT cs.id) > 0
ORDER BY u."totalViews" DESC
LIMIT 10;

-- Step 7: Clean up temp view
DROP VIEW user_correct_totals;

-- INSTRUCTIONS:
-- 1. Backup your database first: pg_dump $DATABASE_URL > backup.sql
-- 2. Run this script: psql $DATABASE_URL -f scripts/recalculate-user-totals.sql
-- 3. Check the output to verify changes look correct
-- 4. If something went wrong, restore from backup: psql $DATABASE_URL < backup.sql

