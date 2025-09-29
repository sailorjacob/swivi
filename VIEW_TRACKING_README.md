# 🎯 View Tracking System

## Overview
The View Tracking System automatically scrapes TikTok view counts for submitted content and updates the database with real-time metrics. This replaces mock data with live, accurate view counts.

## Architecture

### Components
- **Apify TikTok Scraper** (`lib/apify-tiktok-scraper.ts`) - Handles API communication with Apify
- **View Tracking Service** (`lib/view-tracking.ts`) - Core business logic for updating views
- **API Endpoints** (`app/api/view-tracking/`) - HTTP endpoints for manual triggers
- **Periodic Jobs** (`scripts/update-view-tracking.js`) - Automated background updates

### Data Flow
1. Clipper submits TikTok URL via `/api/clippers/submissions`
2. Admin approves submission via `/api/admin/submissions/[id]`
3. View tracking job runs periodically (every 30 minutes)
4. Apify scrapes current view count from TikTok
5. Database updated with new view counts
6. UI displays real-time metrics

## Setup

### 1. Environment Variables
Add to your `.env.local`:
```env
APIFY_API_KEY=your_apify_token_here
```

Get your Apify token from: https://console.apify.com/account/integrations

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Migration
```bash
npx prisma migrate deploy
```

### 4. Deploy Cron Job
```bash
# Set up automated updates (every 30 minutes)
node scripts/deploy-view-tracking.js setup

# Check status
node scripts/deploy-view-tracking.js status

# Test the script
node scripts/deploy-view-tracking.js test
```

## API Endpoints

### Manual View Tracking Update
```bash
curl -X POST https://your-domain.com/api/view-tracking/update
```

**Response:**
```json
{
  "success": true,
  "message": "View tracking updated successfully"
}
```

### Test Single URL Scraping
```bash
curl "https://your-domain.com/api/view-tracking/update?testUrl=https://www.tiktok.com/t/ZTM2kqBet/"
```

## Database Schema

### ViewTracking Table
```sql
CREATE TABLE view_tracking (
  id STRING PRIMARY KEY,
  userId STRING NOT NULL,
  clipId STRING NOT NULL,
  views BIGINT NOT NULL,
  date DATE NOT NULL,
  platform SOCIAL_PLATFORM NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW()
);

-- Unique constraint prevents duplicate daily tracking
ALTER TABLE view_tracking ADD CONSTRAINT unique_user_clip_date_platform
UNIQUE (userId, clipId, date, platform);
```

### Updated User Model
- `totalViews` - Aggregated across all submissions
- `totalEarnings` - Calculated from approved payouts

### Updated Campaign Model
- `spent` - Total amount paid out to clippers

## Monitoring

### Logs
View tracking logs are written to: `/var/log/swivi-view-tracking.log`

### Log Rotation
Configured via logrotate to keep 30 days of logs.

### Manual Monitoring
```bash
# Check recent logs
tail -f /var/log/swivi-view-tracking.log

# Check cron job status
crontab -l

# View tracking statistics
curl https://your-domain.com/api/admin/campaigns/analytics
```

## Cost Management

### Apify Pricing
- **Free Tier**: 1,000 requests/month
- **Usage**: ~1 request per TikTok URL every 30 minutes
- **Monthly Cost**: $0 (free tier) for typical usage

### Rate Limiting
- 1-second delay between API calls
- Maximum 30 requests per minute
- Automatic retry on failures

## Troubleshooting

### Common Issues

1. **Apify API Key Invalid**
   ```bash
   # Test your API key
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        https://api.apify.com/v2/acts/clockworks~tiktok-scraper
   ```

2. **TikTok URL Not Working**
   - Verify URL format: `https://www.tiktok.com/t/ZTM2kqBet/`
   - Check if video is public and accessible
   - Try the test endpoint first

3. **Database Connection Issues**
   ```bash
   # Test database connection
   npx prisma db ping
   ```

4. **Cron Job Not Running**
   ```bash
   # Check cron service
   sudo systemctl status cron

   # View cron logs
   sudo tail -f /var/log/cron.log
   ```

### Debug Mode
Enable detailed logging:
```env
DEBUG=view-tracking
NODE_ENV=development
```

## Performance

### Optimization Tips
- Cache Apify responses (5-minute TTL)
- Batch URL processing in groups of 10
- Use database connection pooling
- Implement exponential backoff for failures

### Scalability
- Process submissions in parallel (up to 5 concurrent)
- Use Redis for caching Apify responses
- Implement queue system for high-volume updates

## Security

- API keys stored securely in environment variables
- Rate limiting prevents abuse
- Input validation on all endpoints
- HTTPS-only communication with Apify

## Future Enhancements

- [ ] Multi-platform support (YouTube, Instagram)
- [ ] Real-time WebSocket updates
- [ ] Advanced analytics dashboard
- [ ] Machine learning for view prediction
- [ ] Automated payout calculations

## Support

For issues or questions:
1. Check the logs: `/var/log/swivi-view-tracking.log`
2. Test with the debug endpoint
3. Verify Apify account limits
4. Contact support with error logs

---

**Built with**: Node.js, TypeScript, Prisma, Apify, Next.js
**Last Updated**: 2024
