# Fix 500 Error - Apply Database Migration

## The Problem

You're getting a 500 error because the code is trying to save `initialViews` to the database, but that column doesn't exist yet. You need to run the migration.

---

## Solution: Apply Migration in Supabase

### Step 1: Go to Supabase Dashboard

1. Open https://supabase.com
2. Go to your project
3. Click **SQL Editor** in the left sidebar

---

### Step 2: Run This SQL

Copy and paste this entire script into the SQL editor:

```sql
-- ============================================
-- PAYOUT SYSTEM MIGRATION - SAFE TO RUN MULTIPLE TIMES
-- ============================================

-- Add PayoutRequestStatus enum (safe - won't error if exists)
DO $$ BEGIN
  CREATE TYPE "PayoutRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add PAYOUT_REQUESTED to NotificationType enum (if it exists)
DO $$ BEGIN
  ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PAYOUT_REQUESTED';
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_object THEN null;
END $$;

-- Create payout_requests table (safe - won't error if exists)
CREATE TABLE IF NOT EXISTS "payout_requests" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "status" "PayoutRequestStatus" NOT NULL DEFAULT 'PENDING',
  "requestedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(6),
  "paymentMethod" TEXT,
  "paymentDetails" TEXT,
  "notes" TEXT,
  "transactionId" TEXT,
  "payoutId" TEXT,
  "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "payout_requests_pkey" PRIMARY KEY ("id")
);

-- Add foreign key if table was just created
DO $$ BEGIN
  ALTER TABLE "payout_requests" 
  ADD CONSTRAINT "payout_requests_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "users"("id") 
  ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add columns to clip_submissions (safe - won't error if exists)
ALTER TABLE "clip_submissions" 
ADD COLUMN IF NOT EXISTS "initialViews" BIGINT DEFAULT 0;

ALTER TABLE "clip_submissions" 
ADD COLUMN IF NOT EXISTS "finalEarnings" DECIMAL(10,2) DEFAULT 0;

-- Create indexes (safe - won't error if exists)
CREATE INDEX IF NOT EXISTS "clip_submissions_campaign_id_status_idx" 
ON "clip_submissions"("campaignId", "status");

CREATE INDEX IF NOT EXISTS "view_tracking_clip_id_date_idx" 
ON "view_tracking"("clipId", "date");

CREATE INDEX IF NOT EXISTS "payout_requests_user_id_status_idx" 
ON "payout_requests"("userId", "status");

CREATE INDEX IF NOT EXISTS "payout_requests_status_requested_at_idx" 
ON "payout_requests"("status", "requestedAt");

-- Done!
SELECT 'Migration applied successfully!' as result;
```

---

### Step 3: Click "Run"

Click the **Run** button in Supabase SQL editor.

---

### Step 4: Verify Success

You should see:
```
result: "Migration applied successfully!"
```

---

### Step 5: Test Submission Again

1. Go back to your site
2. Refresh the page
3. Try submitting a link again
4. Should work now! ✅

---

## What This Migration Does

```
✅ Adds PayoutRequest table
   - For clipper payout requests
   
✅ Adds initialViews column to clip_submissions
   - Stores view count at submission time
   - THIS IS WHY YOU'RE GETTING THE ERROR
   
✅ Adds finalEarnings column to clip_submissions
   - Stores earnings snapshot when campaign ends
   
✅ Adds database indexes
   - Improves query performance
   - Speeds up view tracking
```

---

## Safe to Run Multiple Times

This script is designed to be **idempotent** - you can run it multiple times without errors. It uses:
- `IF NOT EXISTS` checks
- `DO $$ BEGIN ... EXCEPTION` blocks
- Safe enum additions

So if you're not sure if you've run it before, just run it again!

---

## Troubleshooting

### If you get "table already exists" errors:
✅ That's fine! The migration will skip those parts.

### If you get "column already exists" errors:
✅ Also fine! It means the migration was partially applied before.

### If you get permission errors:
❌ Make sure you're logged into the correct Supabase project
❌ Make sure your user has database access

---

## After Migration

Once the migration is applied, your system will have:

✅ **Submissions work** - Can save initialViews
✅ **View tracking works** - Cron job can calculate earnings
✅ **Payout requests work** - Clippers can request payouts
✅ **Admin features work** - All features enabled

---

## Quick Check

After running the migration, verify it worked:

```sql
-- Run this to check:
SELECT 
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payout_requests') as has_table,
  EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'clip_submissions' AND column_name = 'initialViews') as has_column;
```

Should return:
```
has_table: true
has_column: true
```

✅ If both are true, you're ready to go!

