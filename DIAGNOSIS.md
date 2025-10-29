# 500 Error Diagnosis Guide

## Most Likely Causes (In Order)

### 1. ❗ MIGRATION NOT APPLIED (99% likely)

The code tries to save `initialViews` to the database, but the column doesn't exist.

**Quick Check:**
Go to Supabase → SQL Editor → Run:
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'clip_submissions' 
AND column_name = 'initialViews';
```

**If returns empty:** ❌ Migration not applied
**If returns row:** ✅ Migration applied

**Fix:** Run the migration SQL from `APPLY_MIGRATION.md`

---

### 2. ❗ SOCIAL_ACCOUNTS TABLE MISSING

The verification system queries `social_accounts` table. If it doesn't exist, crash.

**Quick Check:**
```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'social_accounts'
) as exists;
```

**If false:** ❌ Table missing
**If true:** ✅ Table exists

**Fix:** The table should exist from your initial schema. If not, you need to run:
```sql
CREATE TABLE IF NOT EXISTS "social_accounts" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "platform" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "displayName" TEXT,
  "platformId" TEXT NOT NULL,
  "followers" INTEGER DEFAULT 0,
  "verified" BOOLEAN DEFAULT false,
  "verifiedAt" TIMESTAMP(6),
  "connected" BOOLEAN DEFAULT true,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "expiresAt" TIMESTAMP(6),
  "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "social_accounts_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "social_accounts" 
ADD CONSTRAINT "social_accounts_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "users"("id") 
ON DELETE CASCADE ON UPDATE NO ACTION;

CREATE UNIQUE INDEX IF NOT EXISTS "social_accounts_userId_platform_username_key" 
ON "social_accounts"("userId", "platform", "username");
```

---

### 3. ❗ ADMIN CHECK NOT WORKING

Maybe your user isn't marked as ADMIN in the database.

**Quick Check:**
```sql
SELECT email, role 
FROM users 
WHERE email = 'YOUR_EMAIL_HERE';
```

**If role = 'ADMIN':** ✅ Admin check should work
**If role = 'CLIPPER' or NULL:** ❌ Not admin, verification will run

**Fix:**
```sql
UPDATE users 
SET role = 'ADMIN' 
WHERE email = 'YOUR_EMAIL_HERE';
```

---

## How to Get Exact Error

The new code (just deployed) will now show you EXACTLY what's wrong:

### Option 1: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Network tab
3. Submit a link
4. Click the failed `/api/clippers/submissions` request
5. Look at the Response

**You'll see one of:**
```json
{
  "error": "Database migration required",
  "details": "The 'initialViews' column is missing...",
  "migrationInstructions": "See APPLY_MIGRATION.md"
}
```
→ **Fix:** Run migration

```json
{
  "error": "Failed to create submission",
  "details": "relation \"social_accounts\" does not exist"
}
```
→ **Fix:** Create social_accounts table

```json
{
  "error": "Platform verification required",
  "details": "No verified TIKTOK account found..."
}
```
→ **Fix:** Either verify account OR make sure you're marked as ADMIN

---

### Option 2: Check Vercel Logs
1. Go to Vercel Dashboard
2. Your project → Deployments
3. Click latest deployment
4. Functions → Find error logs
5. Look for `❌ Database error creating submission:`

---

## Most Likely Solution

**99% chance it's #1 - migration not applied.**

### Run this in Supabase SQL Editor:

```sql
-- Quick fix - add the missing columns
ALTER TABLE "clip_submissions" 
ADD COLUMN IF NOT EXISTS "initialViews" BIGINT DEFAULT 0;

ALTER TABLE "clip_submissions" 
ADD COLUMN IF NOT EXISTS "finalEarnings" DECIMAL(10,2) DEFAULT 0;

-- Verify it worked
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'clip_submissions' 
AND column_name IN ('initialViews', 'finalEarnings');

-- Should return 2 rows showing both columns exist
```

Then try submitting again. **This will 100% fix it if it's a migration issue.**

---

## Still Getting 500?

If you've run the migration and still get 500:

1. **Refresh the page** (hard refresh: Ctrl+Shift+R or Cmd+Shift+R)
2. **Clear browser cache**
3. **Check you're logged in as the correct user**
4. **Verify you're marked as ADMIN in database**
5. **Check Vercel logs for the exact error message**

---

## Test Without Submission

To verify your database is set up correctly:

```sql
-- This should work if everything is configured correctly
INSERT INTO "clip_submissions" (
  "id",
  "userId",
  "campaignId",
  "clipUrl",
  "platform",
  "status",
  "initialViews",
  "createdAt"
) VALUES (
  'test-' || NOW()::text,
  (SELECT id FROM users LIMIT 1),
  (SELECT id FROM campaigns WHERE status = 'ACTIVE' LIMIT 1),
  'https://tiktok.com/@test/video/123',
  'TIKTOK',
  'PENDING',
  0,
  NOW()
);

-- If this works, your database is fine
-- If it fails, you'll see the exact error
```

---

## Quick Summary

| Error Message | Cause | Fix |
|--------------|-------|-----|
| "column initialViews does not exist" | Migration not applied | Run ALTER TABLE ADD COLUMN |
| "relation social_accounts does not exist" | Table missing | Create table |
| "Platform verification required" | Not marked as admin | UPDATE users SET role = 'ADMIN' |
| "Database migration required" | Migration not applied | See APPLY_MIGRATION.md |

**Most likely: Run the ALTER TABLE commands above and try again!**

