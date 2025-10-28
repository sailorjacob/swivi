# Database Migration Guide

## What Was Fixed

### The Scenario You Asked About ✅

**Before (BROKEN):**
- Clipper submits video at **100 views** → initialViews = 0
- Admin approves 2 hours later at **2000 views** → initialViews set to 2000 ❌
- Later tracking at **5000 views** → earnings = 3000 views of growth
- **LOST 1900 views of growth!**

**Now (CORRECT):**
- Clipper submits video at **100 views** → initialViews = **100** ✅
- Admin approves 2 hours later at **2000 views** → initialViews **STAYS 100** ✅
- Later tracking at **5000 views** → earnings = **4900 views** of growth ✅
- **All view growth since submission is counted!**

### What Changed

1. **Production Submissions** (`app/api/clippers/submissions/route.ts`):
   - Now scrapes views when clipper submits
   - Sets `initialViews` immediately (the earnings baseline)

2. **Test Submissions** (`app/api/test/view-tracking/route.ts`):
   - Same behavior - scrapes at submission time

3. **Approval Process** (`lib/clip-creation-service.ts`):
   - No longer overwrites `initialViews`
   - Just changes status to APPROVED
   - Earnings start accumulating from the submission-time baseline

---

## Database Migration Required? YES

You need to add these to your production database:

1. ✅ `initialViews` column on `clip_submissions` (already in schema)
2. ✅ `finalEarnings` column on `clip_submissions` (already in schema)
3. ✅ `PayoutRequest` table (already in schema)
4. ✅ `PayoutRequestStatus` enum (already in schema)
5. ✅ Database indexes for performance (already in schema)

### How to Run the Migration

**Option 1: Using the Safe SQL Script (RECOMMENDED)**

This script handles cases where some parts might already exist:

```bash
# Connect to your production database and run:
psql $DATABASE_URL -f prisma/migrations/add_payout_system/migration_safe.sql
```

Or through Supabase dashboard:
1. Go to SQL Editor
2. Paste contents of `prisma/migrations/add_payout_system/migration_safe.sql`
3. Run query

**Option 2: Using Prisma Migrate (if safe script doesn't work)**

```bash
# Generate the Prisma client with new schema
npx prisma generate

# Push schema changes to database (use with caution in production)
npx prisma db push
```

---

## Verification After Migration

Run this SQL to verify everything is set up:

```sql
-- Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'clip_submissions' 
AND column_name IN ('initialViews', 'finalEarnings');

-- Check if PayoutRequest table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'payout_requests';

-- Check if indexes exist
SELECT indexname 
FROM pg_indexes 
WHERE tablename IN ('clip_submissions', 'view_tracking', 'payout_requests');
```

Expected results:
- ✅ `initialViews` column (BIGINT)
- ✅ `finalEarnings` column (DECIMAL)
- ✅ `payout_requests` table
- ✅ Multiple performance indexes

---

## Testing After Migration

1. **Submit a test video** at current view count
2. **Check database** - verify initialViews is set
3. **Wait 2 hours** (or trigger cron manually)
4. **Approve the submission**
5. **Track views** - verify initialViews didn't change
6. **Check earnings** - should count from submission baseline

---

## Rollback (if needed)

If something goes wrong, you can rollback with:

```sql
-- Remove new columns (WARNING: destroys data)
ALTER TABLE clip_submissions DROP COLUMN IF EXISTS "initialViews";
ALTER TABLE clip_submissions DROP COLUMN IF EXISTS "finalEarnings";

-- Remove PayoutRequest table
DROP TABLE IF EXISTS payout_requests CASCADE;

-- Remove enum type
DROP TYPE IF EXISTS "PayoutRequestStatus";
```

But you'll lose any payout request data!

---

## Next Steps

1. ✅ Run the migration (use the safe SQL script)
2. ✅ Test with a real submission on production
3. ✅ Verify earnings calculate correctly
4. ✅ Test the payout request system
5. ✅ Monitor cron jobs for any errors

All code changes are already deployed - you just need the database schema updates!

