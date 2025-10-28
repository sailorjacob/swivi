# View Tracking & Earnings System - Testing Guide

## System Overview

The complete view tracking and earnings system is now integrated and ready for testing. Here's how everything works together:

### Flow Diagram
```
Submission → Approval (initialViews set) → View Tracking Cron (every 4h) 
→ Earnings Calculation → Budget Check → Campaign Completion 
→ Payout Request ($20 min) → Admin Processing → Payment Sent
```

## Components Implemented

### 1. Database Schema ✅
- **PayoutRequest** model for clipper payout requests
- **ClipSubmission.initialViews** - baseline views at approval time
- **ClipSubmission.finalEarnings** - snapshot when campaign completes
- **Database indexes** on view_tracking(clipId, date) and clip_submissions(campaignId, status)

### 2. View Tracking Service ✅
**Location:** `/lib/view-tracking-service.ts`

**Features:**
- Unified service (consolidated from two duplicate services)
- Scrapes views from all 4 platforms (TikTok, YouTube, Instagram, Twitter)
- Calculates earnings from view growth: `(currentViews - initialViews) / 1000 * payoutRate`
- Enforces campaign budget limits
- Auto-completes campaigns when budget reached
- Snapshots finalEarnings on completion
- Sends notifications to clippers

### 3. Integrated Cron Job ✅
**Location:** `/app/api/cron/view-tracking/route.ts`
**Schedule:** Every 4 hours (configured in `vercel.json`)

**Process:**
1. Finds all active clips with approved submissions
2. Scrapes current view counts
3. Calculates earnings from view growth
4. Updates clip.earnings, user.totalEarnings, campaign.spent
5. Checks if campaign.spent >= budget
6. Completes campaigns and notifies clippers

### 4. Budget Enforcement ✅
- **Real-time checks**: Before adding earnings
- **Remaining budget calculation**: `campaign.budget - campaign.spent`
- **Earnings cap**: `min(calculatedEarnings, remainingBudget)`
- **Atomic updates**: All changes in database transaction

### 5. Payout System ✅

**Clipper Flow:**
- Dashboard shows available balance (from completed campaigns only)
- Request button enabled when balance >= $20
- Submit payout request with payment details
- View pending/completed requests

**Admin Flow:**
- View all payout requests at `/admin/payouts`
- Approve/Reject requests
- Mark as paid with transaction ID
- System deducts from user balance and resets clip earnings

## Testing Instructions

### Phase 1: Platform Accuracy Testing

**Test each scraping platform:**

1. **TikTok Testing**
   ```
   - Navigate to /test/view-tracking
   - Submit real TikTok video URL
   - Click "Track Views Now"
   - Verify view count matches actual platform
   ```

2. **YouTube Testing**
   ```
   - Submit YouTube video URL
   - Track views
   - Compare with actual YouTube view count
   ```

3. **Instagram Testing**
   ```
   - Submit Instagram Reel/Video URL
   - Track views
   - Verify accuracy
   ```

4. **Twitter Testing**
   ```
   - Submit Twitter video URL
   - Track views
   - Check against actual views
   ```

**Success Criteria:**
- ✅ All 4 platforms scrape successfully
- ✅ View counts match platform (within 1% tolerance)
- ✅ Error handling works for invalid URLs
- ✅ Rate limiting doesn't break scraping

### Phase 2: Earnings & Budget Testing

**Setup Test Campaign:**

1. Create campaign in admin panel:
   - Budget: $100
   - Payout Rate: $10 per 1000 views
   - Status: ACTIVE

2. Submit 5+ test clips from different accounts

3. Approve clips (initialViews will be set)

4. Manually trigger cron or wait 4 hours:
   ```bash
   curl -X GET http://localhost:3000/api/cron/view-tracking \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

5. Monitor earnings accumulation:
   - Check clip.earnings in database
   - Verify user.totalEarnings updates
   - Watch campaign.spent increase

6. Test budget enforcement:
   - Let earnings approach $100 budget
   - Verify system stops at exactly $100
   - Confirm campaign auto-completes
   - Check finalEarnings snapshot

**Success Criteria:**
- ✅ Earnings calculate correctly: (views gained / 1000) * rate
- ✅ Budget enforcement prevents overspending
- ✅ Campaign completes at budget limit
- ✅ finalEarnings captured for all submissions
- ✅ Notifications sent to clippers

### Phase 3: End-to-End Flow Testing

**Complete flow from submission to payout:**

1. **Setup** (As Admin)
   ```
   - Create test campaign: $50 budget, $10/1K views
   - Note campaign ID
   ```

2. **Submit Clips** (As Clipper)
   ```
   - Login as clipper
   - Navigate to campaigns
   - Submit 2-3 real video URLs
   - Note submission IDs
   ```

3. **Approve Submissions** (As Admin)
   ```
   - Go to /admin/submissions
   - Approve all test submissions
   - Verify initialViews are set
   ```

4. **Track Views** (Cron Job)
   ```
   - Trigger cron manually or wait
   - Check logs for earnings calculation
   - Verify earnings appear in dashboard
   ```

5. **Complete Campaign**
   ```
   - Let views accumulate to $50
   - Verify campaign auto-completes
   - Check campaign.completionReason
   - Confirm notifications sent
   ```

6. **Request Payout** (As Clipper)
   ```
   - View available balance on dashboard
   - Click "Request Payout"
   - Enter amount (>= $20)
   - Add payment details
   - Submit request
   ```

7. **Process Payout** (As Admin)
   ```
   - Go to /admin/payouts
   - See pending request
   - Approve request
   - Enter transaction ID
   - Mark as paid
   ```

8. **Verify Completion**
   ```
   - Check user.totalEarnings deducted
   - Verify clip.earnings reset to 0
   - Confirm notification sent to clipper
   - Check Payout record created
   ```

**Success Criteria:**
- ✅ Entire flow works without errors
- ✅ Earnings accurate throughout
- ✅ Budget enforcement works
- ✅ Campaign completes correctly
- ✅ Payout request succeeds
- ✅ Admin can process payout
- ✅ Balance updates correctly
- ✅ All notifications sent

## Manual Testing Checklist

### Database Verification

```sql
-- Check view tracking records
SELECT * FROM view_tracking 
WHERE clip_id = 'YOUR_CLIP_ID' 
ORDER BY date DESC;

-- Check earnings calculation
SELECT 
  cs.id as submission_id,
  cs.initial_views,
  c.views as current_views,
  c.earnings,
  camp.payout_rate,
  camp.spent,
  camp.budget
FROM clip_submissions cs
JOIN clips c ON cs.clip_id = c.id
JOIN campaigns camp ON cs.campaign_id = camp.id
WHERE cs.status = 'APPROVED';

-- Check payout requests
SELECT * FROM payout_requests 
WHERE status = 'PENDING' 
ORDER BY requested_at DESC;
```

### API Endpoint Testing

```bash
# Test view tracking cron
curl -X GET http://localhost:3000/api/cron/view-tracking

# Test payout request (as clipper)
curl -X POST http://localhost:3000/api/clippers/payout-request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "amount": 25.00,
    "paymentMethod": "PAYPAL",
    "paymentDetails": "user@email.com"
  }'

# Get payout requests (as admin)
curl -X GET http://localhost:3000/api/admin/payout-requests

# Process payout (as admin)
curl -X POST http://localhost:3000/api/admin/payout-requests/REQUEST_ID/process \
  -H "Content-Type: application/json" \
  -d '{
    "action": "complete",
    "transactionId": "TXN123456",
    "notes": "Payment sent via PayPal"
  }'
```

## Common Issues & Solutions

### Issue: View tracking not running
**Solution:** 
- Check Vercel cron is configured in `vercel.json`
- Verify CRON_SECRET environment variable
- Test manually via API endpoint

### Issue: Earnings not calculating
**Solution:**
- Verify initialViews is set on submission approval
- Check campaign is ACTIVE status
- Ensure clip has associated approved submission
- Review cron job logs for errors

### Issue: Budget exceeded
**Solution:**
- Should not happen if budget enforcement working
- Check campaign.spent vs budget
- Review transaction logs
- May need to manually adjust if data corruption

### Issue: Payout request fails
**Solution:**
- Verify user has balance >= $20 from completed campaigns
- Check for existing pending requests
- Ensure payment details provided
- Review API error response

### Issue: Scraping errors
**Solution:**
- Check APIFY_TOKEN is valid
- Verify URL format is correct
- Test URL directly in Apify
- Check rate limits not exceeded

## Performance Considerations

### Cron Job Optimization
- **Current limit**: 50 clips per run
- **Run frequency**: Every 4 hours
- **Expected load**: ~200 requests/day per 1000 active clips

### Scaling Recommendations
- Monitor Apify usage and upgrade plan if needed
- Consider queueing system for high-volume tracking
- Add retry logic for failed scrapes
- Implement exponential backoff for rate limits

## Monitoring & Alerts

### Key Metrics to Monitor
1. **Cron job success rate**: Should be >95%
2. **Scraping accuracy**: View counts within 1% of actual
3. **Earnings calculation accuracy**: No budget overruns
4. **Payout processing time**: < 24 hours avg
5. **System errors**: Track and alert on failures

### Dashboard Widgets
- Active campaigns count
- Total earnings distributed
- Pending payout requests
- Failed scraping attempts
- Budget utilization rates

## Next Steps

After testing is complete:

1. **Deploy to Production**
   - Verify all environment variables set
   - Test cron jobs on Vercel
   - Monitor first 24 hours closely

2. **Documentation**
   - Update user guides
   - Create video tutorials
   - Document admin workflows

3. **Future Enhancements**
   - Real-time view tracking
   - Analytics dashboard
   - Automated payout processing
   - Multi-currency support
   - Mobile app integration

## Support

For issues or questions:
- Check logs in Vercel dashboard
- Review cron job execution history
- Test components individually
- Contact development team

---

**Last Updated:** October 27, 2025
**Version:** 1.0.0
**Status:** Ready for Testing ✅

