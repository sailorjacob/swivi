# X API Integration for View Tracking

This document outlines the X API integration that replaces the Apify Twitter scraper for fetching tweet view counts (impressions) in the Swivi platform.

## 🚀 Features

- **Real-time View Tracking**: Fetches actual impression counts from X/Twitter posts
- **Conservative Rate Limiting**: Respects X API rate limits with built-in delays
- **Active Campaign Focus**: Only processes submissions from ACTIVE campaigns
- **Automatic Payout Calculation**: Updates campaign budgets and user earnings based on real views
- **Live Progress Bars**: Campaign progress updates in real-time based on actual data

## 📋 Setup

### 1. Install Dependencies

The required dependency has already been installed:
```bash
npm install twitter-api-v2
```

### 2. Configure Environment Variables

Your X API credentials have been automatically configured in `.env.local`:

```env
X_API_KEY="ikkoq6Ht6K4NRS45eCNxwXKmJ"
X_API_SECRET="lMUfYBh8EDyhdY4XUGq1x6h4Ty5pNtk03iwgR9LeWjJmmgchIO"
X_ACCESS_TOKEN="1874248691021979648-XK1EZAUqYNxko4jymAaZfjB5nazChS"
X_ACCESS_TOKEN_SECRET="LxZd55harlB2hdvnHNCPCOHTcqv6an7QhB5v1UQUAM7PF"
X_BEARER_TOKEN="AAAAAAAAAAAAAAAAAAAAAIFi4wEAAAAAYwTgxEK9jJgrPcyPtvNM9%2FGoJT4%3D1QeciJS6zGOqGaFpkiQsnIUVEsyz2VvOD6wxalKF92ltRAJ1Pi"
```

### 3. Test the Integration

```bash
# Test X API connection
curl http://localhost:3000/api/debug/test-x-api

# Test with a specific tweet
curl -X POST http://localhost:3000/api/debug/test-x-api \
  -H "Content-Type: application/json" \
  -d '{"tweetUrl": "https://x.com/username/status/1234567890"}'
```

## 🔧 How It Works

### 1. View Tracking Service (`lib/x-view-tracking.ts`)

The `XViewTrackingService` class handles:
- Fetching view counts from X API for Twitter submissions
- Using Apify for other platforms (TikTok, YouTube, Instagram)
- Only processing submissions from ACTIVE campaigns
- Updating database with new view counts
- Calculating and updating payouts

### 2. X API Client (`lib/x-api-client.ts`)

The `XApiClient` class provides:
- Tweet ID extraction from various URL formats
- Fetching tweet metrics (impressions, likes, retweets, etc.)
- Rate limiting (3 seconds between requests)
- Error handling for API limits and authentication

### 3. Automated Cron Job (`app/api/cron/view-tracking/route.ts`)

The cron endpoint:
- Runs automatically via Vercel cron jobs
- Updates views for all active campaigns only
- Calculates payouts and updates campaign progress
- Provides detailed logging for monitoring

## 📊 Real-time Campaign Progress

### Campaign Stats API (`app/api/campaigns/stats/route.ts`)

Provides real-time statistics:
- Total views across all active campaigns
- Budget utilization percentages
- Platform-specific breakdowns
- Top performing submissions

### Updated UI Components

The campaign components now display:
- **Real-time view counts**: Fetched from actual X API data
- **Live budget progress**: Based on calculated payouts from real views
- **Platform breakdowns**: Shows performance across different social platforms
- **Refresh button**: Manually update live data

## 🔄 Usage

### Automatic Updates

The system automatically updates view counts via cron jobs. The cron job runs at scheduled intervals and:

1. Fetches all ACTIVE campaigns
2. Gets submissions from those campaigns only
3. Updates view counts using X API (for Twitter) and Apify (for other platforms)
4. Calculates new payouts based on updated views
5. Updates campaign progress and user earnings

### Manual Updates

For testing or immediate updates:

```bash
# Update all active campaigns
curl http://localhost:3000/api/debug/manual-view-update

# Update specific campaign
curl -X POST http://localhost:3000/api/debug/manual-view-update \
  -H "Content-Type: application/json" \
  -d '{"campaignId": "campaign_id_here"}'
```

### View Campaign Stats

```bash
# Get stats for all active campaigns
curl http://localhost:3000/api/campaigns/stats

# Get stats for specific campaign
curl http://localhost:3000/api/campaigns/stats?campaignId=campaign_id_here
```

## 🛡️ Rate Limiting & Best Practices

### X API Rate Limits

- **Tweet Lookup**: 300 requests per 15 minutes
- **Implementation**: 3-second delay between requests (conservative)
- **Monitoring**: Rate limit status available via debug endpoint

### Conservative Approach

The system is designed to be conservative:
- Only processes ACTIVE campaigns (not old/completed ones)
- Only updates relevant platforms for each submission
- Implements proper error handling and retries
- Logs all operations for monitoring

## 🐛 Debugging

### Test Endpoints

1. **Test X API Connection**:
   ```bash
   GET /api/debug/test-x-api
   ```

2. **Test Specific Tweet**:
   ```bash
   POST /api/debug/test-x-api
   Body: {"tweetUrl": "https://x.com/user/status/123"}
   ```

3. **Manual View Update**:
   ```bash
   GET /api/debug/manual-view-update
   ```

### Common Issues

1. **Authentication Errors**: Check environment variables
2. **Rate Limit Exceeded**: Wait 15 minutes or reduce frequency
3. **Tweet Not Found**: Verify URL format and tweet accessibility
4. **No Active Campaigns**: Ensure campaigns have status "ACTIVE"

## 📈 Monitoring

### Logs

The system provides detailed logging:
- Campaign processing status
- View count updates
- Payout calculations
- Error handling

### Metrics

Track these key metrics:
- Total views generated across campaigns
- Budget utilization percentages
- Platform performance breakdowns
- API rate limit usage

## 🔮 Future Enhancements

Potential improvements:
1. **Batch Processing**: Process multiple tweets in single API call
2. **Caching**: Cache view counts to reduce API calls
3. **Webhooks**: Real-time updates via X API webhooks
4. **Analytics**: Advanced analytics and reporting
5. **Alerts**: Notifications for campaign milestones

## 📞 Support

For issues or questions:
1. Check the debug endpoints for connection status
2. Review logs in the development console
3. Verify environment variables are correctly set
4. Ensure campaigns are in "ACTIVE" status

The integration is now ready to use and will provide real-time view tracking for your Twitter/X submissions while maintaining conservative API usage!
