# Production Deployment Checklist

## Pre-Deployment Steps

### 1. Apply Database Migration

**Via Supabase Dashboard:**
1. Go to Supabase Dashboard → SQL Editor
2. Run this SQL:

```sql
-- CreateEnum
CREATE TYPE "PayoutRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'PAYOUT_REQUESTED';

-- AlterTable
ALTER TABLE "clip_submissions" 
ADD COLUMN "initialViews" BIGINT DEFAULT 0,
ADD COLUMN "finalEarnings" DECIMAL(10,2) DEFAULT 0;

-- CreateTable
CREATE TABLE "payout_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "PayoutRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(6),
    "processedBy" TEXT,
    "paymentMethod" "PayoutMethod",
    "paymentDetails" TEXT,
    "notes" TEXT,
    "transactionId" TEXT,
    "payoutId" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payout_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "clip_submissions_campaign_id_status_idx" ON "clip_submissions"("campaignId", "status");
CREATE INDEX "view_tracking_clip_id_date_idx" ON "view_tracking"("clipId", "date");
CREATE INDEX "payout_requests_user_id_status_idx" ON "payout_requests"("userId", "status");
CREATE INDEX "payout_requests_status_requested_at_idx" ON "payout_requests"("status", "requestedAt");

-- AddForeignKey
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
```

3. Verify migration:
```sql
-- Check tables exist
SELECT * FROM payout_requests LIMIT 1;
SELECT id, "initialViews", "finalEarnings" FROM clip_submissions LIMIT 1;
```

### 2. Set Environment Variables in Vercel

**Required Variables:**
```env
# Database (already set)
DATABASE_URL=postgresql://...

# Supabase (already set)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Apify for scraping (REQUIRED - ADD THIS!)
APIFY_TOKEN=apify_api_xxx

# Cron Security (RECOMMENDED)
CRON_SECRET=random-secret-string-here

# Node Environment
NODE_ENV=production
```

**How to add in Vercel:**
1. Go to your Vercel project
2. Click Settings → Environment Variables
3. Add `APIFY_TOKEN` (get from apify.com)
4. Add `CRON_SECRET` (generate random string)

### 3. Verify Cron Jobs Are Configured

**Check `vercel.json` exists:**
```json
{
  "crons": [
    {
      "path": "/api/cron/view-tracking",
      "schedule": "0 */4 * * *"
    }
  ]
}
```

**Enable Cron in Vercel:**
1. Go to Vercel Project → Settings → Crons
2. Verify "view-tracking" cron is listed
3. Cron will run every 4 hours automatically

## Deployment

### Option A: Via Git Push (Recommended)

```bash
# 1. Commit all changes
git add .
git commit -m "Add complete view tracking and payout system"

# 2. Push to main branch
git push origin main

# Vercel will automatically deploy
```

### Option B: Via Vercel CLI

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
vercel --prod
```

## Post-Deployment Verification

### 1. Check Deployment Status

- Go to Vercel Dashboard
- Verify deployment completed successfully
- Check build logs for any errors

### 2. Test Authentication

```bash
# Visit your production URL
https://your-app.vercel.app/clippers/login

# Try logging in
# Should work without errors
```

### 3. Test View Tracking System

**Step-by-step:**

1. **Login:**
   - Go to `https://your-app.vercel.app/clippers/login`
   - Login with your credentials

2. **Access Test Page:**
   - Go to `https://your-app.vercel.app/test/view-tracking`
   - Should load (now with authentication check!)

3. **Submit Test URL:**
   - Paste a TikTok video URL
   - Select "TIKTOK" platform
   - Click "Create Test Clip"
   - Should see success message

4. **Track Views:**
   - Select the clip from dropdown
   - Click "Track Views Now"
   - Should scrape and show view count

5. **Test Cron Job:**
   - Click "Test Cron Job System"
   - Should run successfully
   - Check Vercel logs for output

### 4. Verify Cron Jobs Work

**Check Vercel Cron Logs:**
1. Go to Vercel Dashboard → Your Project
2. Click "Functions" → "Cron Jobs"
3. Should see "view-tracking" listed
4. Wait for next scheduled run (or trigger manually)

**Manual Trigger (Testing):**
```bash
curl -X GET https://your-app.vercel.app/api/cron/view-tracking \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Should return JSON with stats
```

### 5. Test Complete Flow

**Create Real Campaign:**
1. Login as admin
2. Go to `/admin/campaigns`
3. Create campaign:
   - Budget: $50
   - Payout Rate: $10 per 1K views
   - Status: ACTIVE

**Submit Real Clips:**
1. Login as clipper
2. Submit 2-3 real video URLs
3. Approve them as admin

**Wait for Cron:**
- Cron runs every 4 hours
- Or trigger manually via API
- Check earnings accumulate

**Test Payout:**
1. Wait for campaign to complete
2. Go to `/clippers/dashboard`
3. Request payout
4. Process in `/admin/payouts`

## Monitoring

### Check Cron Execution

**Vercel Dashboard:**
- Functions → Cron Jobs → Executions
- Look for success/failure status
- Review logs for errors

**Example Success Log:**
```
🚀 Starting view tracking...
✅ Tracking complete: 12 successful, $47.50 earnings added
✅ Campaign completion check: 1 completed
```

### Monitor Errors

**Common Issues:**

1. **"APIFY_TOKEN not set"**
   - Add APIFY_TOKEN in Vercel environment variables
   - Redeploy

2. **"Database connection failed"**
   - Check DATABASE_URL is correct
   - Verify Supabase is not paused

3. **"Unauthorized" on cron**
   - Vercel crons are auto-authenticated
   - If using manual trigger, include CRON_SECRET

4. **"Scraping failed"**
   - Check Apify usage limits
   - Verify URL format is correct
   - Check platform is supported

### Alert Setup (Optional)

**Vercel Integrations:**
1. Go to Settings → Integrations
2. Add Slack/Discord for alerts
3. Get notified on deployment failures

## Performance Optimization

### Database Indexes

All indexes are created by the migration:
- ✅ `clip_submissions(campaignId, status)`
- ✅ `view_tracking(clipId, date)`
- ✅ `payout_requests(userId, status)`

### Cron Job Limits

Current settings:
- **Batch size:** 50 clips per run
- **Frequency:** Every 4 hours
- **Daily runs:** 6 times
- **Max clips/day:** 300

**To increase capacity:**
Edit `/app/api/cron/view-tracking/route.ts`:
```typescript
const result = await viewTrackingService.processViewTracking(100) // Increase from 50
```

### Apify Usage

**Monitor consumption:**
- Go to apify.com → Usage
- Track API calls
- Upgrade plan if needed

**Typical usage:**
- 1 scrape = 1 Apify request
- 50 clips/run × 6 runs/day = 300 requests/day
- Free tier: 5,000 requests/month (~166/day)
- Paid tier: 100,000+/month

## Rollback Plan

If something goes wrong:

### 1. Revert Deployment

```bash
# Via Vercel Dashboard
# Go to Deployments → Previous deployment → Promote to Production

# Or via CLI
vercel rollback
```

### 2. Revert Database (if needed)

**WARNING: Only if migration causes issues**

```sql
-- Drop new table
DROP TABLE IF EXISTS payout_requests CASCADE;

-- Drop new enum
DROP TYPE IF EXISTS "PayoutRequestStatus";

-- Remove new columns
ALTER TABLE clip_submissions 
DROP COLUMN IF EXISTS "initialViews",
DROP COLUMN IF EXISTS "finalEarnings";

-- Drop indexes
DROP INDEX IF EXISTS "clip_submissions_campaign_id_status_idx";
DROP INDEX IF EXISTS "view_tracking_clip_id_date_idx";
DROP INDEX IF EXISTS "payout_requests_user_id_status_idx";
DROP INDEX IF EXISTS "payout_requests_status_requested_at_idx";
```

## Success Indicators

✅ **Deployment successful**
- No build errors in Vercel
- All pages load correctly

✅ **Authentication works**
- Can login/logout
- Sessions persist
- Protected routes work

✅ **View tracking works**
- Test page loads
- URLs can be submitted
- Views are scraped successfully

✅ **Cron jobs running**
- Visible in Vercel dashboard
- Executions show success
- Logs show processing

✅ **Earnings calculate**
- Database shows earnings > 0
- User totalEarnings updates
- Campaign spent increases

✅ **Payouts functional**
- Clippers can request
- Admins can process
- Balances update correctly

## Support Resources

**Documentation:**
- `TESTING_GUIDE.md` - Comprehensive testing instructions
- `IMPLEMENTATION_SUMMARY.md` - Technical details
- `VIEW_TRACKING_TEST_SYSTEM.md` - Test system guide

**Logs:**
- Vercel: Dashboard → Deployments → View Logs
- Database: Supabase → SQL Editor
- Apify: apify.com → Runs

**Get Help:**
- Check logs first
- Review error messages
- Test components individually
- Verify environment variables

---

**Deployment Date:** ___________
**Deployed By:** ___________
**Version:** 1.0.0
**Status:** ☐ Pre-deployment ☐ Deployed ☐ Verified ☐ Monitoring

