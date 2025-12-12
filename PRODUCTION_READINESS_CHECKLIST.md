# 🚀 Swivi Production Readiness Checklist

## Pre-Launch Assessment: Ready for High User Volume

### ✅ What's Already Working Well

| Feature | Status | Notes |
|---------|--------|-------|
| **Rate Limiting** | ✅ Fixed | Now database-backed for serverless compatibility |
| **Fraud Detection** | ✅ Ready | Detects bot behavior, duplicate submissions, suspicious patterns |
| **Input Validation** | ✅ Ready | Zod schema validation on all submissions |
| **Database Pooling** | ✅ Ready | PgBouncer configured with prepared_statements=false |
| **Batch Processing** | ✅ Ready | View tracking processes in batches of 5 with delays |
| **Cron Jobs** | ✅ Ready | 5-min max duration, hourly schedule |
| **Error Handling** | ✅ Ready | Graceful degradation, retry logic |
| **Auth System** | ✅ Ready | Supabase Auth with database fallback |

---

## 🔧 Actions Required Before Launch

### 1. Run Database Indexes (CRITICAL)

Run this SQL in your Supabase SQL Editor:

```sql
-- Located at: scripts/add_production_indexes.sql
-- This creates 12 performance indexes for high-traffic queries
```

**Command to view the file:**
```bash
cat scripts/add_production_indexes.sql
```

### 2. Verify Cron Job Configuration

Your current `vercel.json` is configured correctly:
- View tracking runs every hour
- 5-minute max duration (requires Vercel Pro)

**Check if you're on Vercel Pro:** The 300-second timeout requires Pro plan.

### 3. Monitor Apify API Usage

Your scaling document shows:
- **Free Tier:** 5,000 requests/month (~167/day) ⚠️ Not enough for scale
- **Starter ($49/mo):** 100,000 requests/month ✅ Recommended
- **Current hourly cron:** ~2,400 requests/day (100 clips × 24 hours)

**Action:** Upgrade to Apify Starter if you expect 100+ active clips.

### 4. Set Up CRON_SECRET

Add to your Vercel environment variables:
```
CRON_SECRET=your-secure-random-string-here
```

This prevents unauthorized access to your cron endpoints.

---

## 📊 Monitoring Endpoints

### Admin Monitoring Dashboard
```
GET /api/admin/monitoring
```

Returns:
- Cron job health & success rate
- User activity metrics
- Submission volumes
- Campaign budget status
- Clips needing tracking
- Rate limit statistics

### Health Check
```
GET /api/health
```

Returns database connectivity and service status.

---

## ⚡ Capacity Estimates

### Current System Capacity

| Metric | Capacity | Notes |
|--------|----------|-------|
| **Users/day** | 10,000+ | Supabase handles auth scale |
| **Submissions/minute** | 100+ | With rate limiting |
| **Clips tracked/hour** | ~100 | Batch processing |
| **Clips tracked/day** | ~2,400 | 24 hourly runs |
| **Concurrent users** | 1,000+ | Serverless auto-scales |

### Bottlenecks to Watch

1. **Apify API Quota** - Monitor monthly usage
2. **Database Connections** - Supabase free tier: 60 connections
3. **Vercel Function Duration** - Needs Pro for 5-min cron jobs

---

## 🚨 Alert Thresholds

Watch for these in your monitoring:

| Metric | Warning | Critical |
|--------|---------|----------|
| Cron success rate | < 90% | < 80% |
| Pending submissions | > 50 | > 100 |
| Stale clips (no tracking in 8h) | > 50 | > 100 |
| Rate limit violations/hour | > 10 | > 50 |
| Failed submissions/hour | > 5% | > 10% |

---

## 💰 Infrastructure Cost Estimate

For 500+ clips/week:

| Service | Plan | Cost/month |
|---------|------|------------|
| Vercel | Pro | $20 |
| Apify | Starter | $49 |
| Supabase | Free (Pro if needed) | $0-25 |
| **Total** | | **$69-94/month** |

---

## 🔐 Security Checklist

- [x] Rate limiting on all submission endpoints
- [x] Fraud detection for suspicious activity
- [x] Input validation with Zod schemas
- [x] Auth required for protected endpoints
- [x] Admin-only access for sensitive operations
- [ ] **TODO:** Add CRON_SECRET to environment
- [ ] **TODO:** Consider adding Cloudflare for DDoS protection

---

## 📈 Scaling Path

### Phase 1: 100-500 users (Current)
- ✅ Current infrastructure handles this
- Run database indexes
- Monitor Apify usage

### Phase 2: 500-2,000 users
- Upgrade to Apify Starter ($49/mo)
- Consider Supabase Pro ($25/mo)
- Add webhook notifications for alerts

### Phase 3: 2,000+ users
- Consider Redis for rate limiting (faster)
- Add queue system for background jobs
- Implement real-time WebSocket notifications

---

## 🎯 Quick Launch Checklist

1. [ ] Run `scripts/add_production_indexes.sql` in Supabase
2. [ ] Add `CRON_SECRET` to Vercel environment
3. [ ] Verify you're on Vercel Pro (for 5-min cron timeout)
4. [ ] Monitor Apify quota, upgrade if needed
5. [ ] Test `/api/admin/monitoring` endpoint
6. [ ] Test a few submissions end-to-end
7. [ ] Verify cron job runs successfully in Vercel logs

---

## 🆘 Troubleshooting

### Submissions Timing Out
**Symptom:** Users see loading for 30+ seconds on submission  
**Solution:** Initial view scraping now has 3-second quick timeout. Cron handles the rest.

### Rate Limits Not Working
**Symptom:** Users can spam submissions  
**Solution:** Rate limiting now uses database storage. Works across all instances.

### Cron Jobs Failing
**Check:**
1. Vercel logs for errors
2. `/api/admin/monitoring` for failure details
3. Apify dashboard for API quota

### Database Connection Errors
**Check:**
1. Supabase dashboard for connection count
2. `lib/prisma.ts` has pooling configured
3. Consider upgrading Supabase if at connection limit

---

**Last Updated:** December 2024  
**Platform Version:** Ready for production scale













