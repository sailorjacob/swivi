# 🚀 Quick Start Guide

## What Just Happened

✅ Complete view tracking & payout system is ready
✅ Dev server is running at http://localhost:3000
✅ Test page now has authentication (shows login prompt)
✅ Migration SQL is ready to apply

## Next Steps (5 minutes)

### 1. Apply Database Migration (30 seconds)

**Go to Supabase Dashboard:**
1. Open your Supabase project
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy/paste this SQL:

```sql
CREATE TYPE "PayoutRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED', 'CANCELLED');
ALTER TYPE "NotificationType" ADD VALUE 'PAYOUT_REQUESTED';
ALTER TABLE "clip_submissions" ADD COLUMN "initialViews" BIGINT DEFAULT 0, ADD COLUMN "finalEarnings" DECIMAL(10,2) DEFAULT 0;
CREATE TABLE "payout_requests" ("id" TEXT NOT NULL, "userId" TEXT NOT NULL, "amount" DECIMAL(10,2) NOT NULL, "status" "PayoutRequestStatus" NOT NULL DEFAULT 'PENDING', "requestedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "processedAt" TIMESTAMP(6), "processedBy" TEXT, "paymentMethod" "PayoutMethod", "paymentDetails" TEXT, "notes" TEXT, "transactionId" TEXT, "payoutId" TEXT, "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "payout_requests_pkey" PRIMARY KEY ("id"));
CREATE INDEX "clip_submissions_campaign_id_status_idx" ON "clip_submissions"("campaignId", "status");
CREATE INDEX "view_tracking_clip_id_date_idx" ON "view_tracking"("clipId", "date");
CREATE INDEX "payout_requests_user_id_status_idx" ON "payout_requests"("userId", "status");
CREATE INDEX "payout_requests_status_requested_at_idx" ON "payout_requests"("status", "requestedAt");
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
```

5. Click **Run** (or press Cmd/Ctrl + Enter)

### 2. Test Locally (2 minutes)

**Login:**
- Go to http://localhost:3000/clippers/login
- Login with your account (or signup if needed)

**Test Tracking:**
- Go to http://localhost:3000/test/view-tracking
- Submit a TikTok/YouTube URL
- Click "Track Views Now"
- Should scrape successfully! ✅

**Quick Test:**
```bash
# Or test via curl
curl -X POST http://localhost:3000/api/test/view-tracking \
  -H "Content-Type: application/json" \
  -d '{"action": "list_test_clips"}'
```

### 3. Deploy to Production (2 minutes)

**Option A: Git Push (Easiest)**
```bash
git add .
git commit -m "Add view tracking and payout system"
git push origin main
# Vercel auto-deploys!
```

**Option B: Vercel CLI**
```bash
vercel --prod
```

**Then:**
1. Go to Vercel Dashboard
2. Add environment variable: `APIFY_TOKEN` (get from apify.com)
3. Add environment variable: `CRON_SECRET` (any random string)
4. Redeploy if needed

### 4. Verify Production (1 minute)

**Test in production:**
- Visit https://your-app.vercel.app/test/view-tracking
- Login when prompted
- Submit test URL
- Should work! ✅

**Check cron jobs:**
- Vercel Dashboard → Functions → Crons
- Should see "view-tracking" listed
- Will run every 4 hours automatically

## That's It! 🎉

Your platform now has:
- ✅ Automated view tracking (4 platforms)
- ✅ Earnings calculation
- ✅ Budget enforcement
- ✅ Campaign auto-completion
- ✅ Payout request system
- ✅ Admin payout management

## Quick Commands

```bash
# Local development
npm run dev

# Test cron locally
curl http://localhost:3000/api/cron/view-tracking

# Check database
npx prisma studio

# View logs (production)
# Vercel Dashboard → Deployments → Logs
```

## Files to Reference

- **TESTING_GUIDE.md** - Full testing instructions
- **IMPLEMENTATION_SUMMARY.md** - Technical details
- **PRODUCTION_DEPLOYMENT.md** - Deployment checklist

## Need Help?

**Common Issues:**

**"401 Unauthorized"**
→ Login first at `/clippers/login`

**"Migration failed"**
→ Check SQL syntax, run line by line

**"Scraping failed"**
→ Check APIFY_TOKEN is set

**"Cron not running"**
→ Verify `vercel.json` exists
→ Check Vercel cron settings

---

**Status:** 🟢 Ready to Test
**Version:** 1.0.0
**Last Updated:** October 27, 2025

