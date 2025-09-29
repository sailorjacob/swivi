# 🚀 Multi-Platform View Tracking - Production Setup

## Overview
Your clipping platform now supports automated view tracking across multiple social media platforms using Apify scrapers. This guide shows how to deploy the complete system to production.

## ✅ What's Been Built

### Multi-Platform Architecture
- **TikTok**: ✅ Active (using `clockworks/tiktok-scraper`)
- **YouTube**: 🔄 Ready for Apify actor details
- **X/Twitter**: 🔄 Ready for Apify actor details
- **Instagram**: 🔄 Ready for Apify actor details

### Automated Systems
- **Cron Jobs**: Updates every 30 minutes
- **Database Integration**: Real-time view tracking
- **Admin Dashboard**: Complete campaign and submission management
- **Error Handling**: Robust failure recovery

## 🔑 Production Environment Setup

### 1. Vercel Environment Variables
Add these to your Vercel dashboard (`https://vercel.com/your-project/settings/environment-variables`):

```env
# Required for all platforms
APIFY_API_KEY=your_apify_token_here

# Database (from Supabase)
DATABASE_URL=your_database_url
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Authentication
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your_nextauth_secret

# OAuth (if using)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
```

### 2. Deploy to Vercel
```bash
# Deploy the application
npm run build
vercel --prod
```

### 3. Set Up Cron Jobs on Server
Since Vercel doesn't support cron jobs, you'll need a server or service like:
- **Railway** (recommended)
- **Render**
- **AWS EC2** or similar VPS
- **Heroku** with scheduler addon

#### Option A: Railway (Recommended)
1. Deploy your app to Railway
2. Add the cron job script to your Railway service
3. Set up a cron job in Railway dashboard

#### Option B: VPS/Server
```bash
# On your server, run:
git clone your-repo
cd your-repo
npm ci
npm run build

# Set up cron job
node scripts/deploy-view-tracking.js setup

# Check status
node scripts/deploy-view-tracking.js status
```

## 🧪 Testing the System

### 1. Test View Tracking API
```bash
# Manual trigger
curl -X POST https://your-domain.com/api/view-tracking/update

# Test with specific URL
curl "https://your-domain.com/api/view-tracking/update?testUrl=https://www.tiktok.com/t/ZTM2kqBet/"
```

### 2. Check Logs
```bash
# On your server
tail -f /var/log/swivi-view-tracking.log

# Or check Railway logs
railway logs
```

### 3. Monitor Database
```bash
# Check recent view tracking entries
npx prisma studio

# Or query directly
npx prisma db execute --file scripts/check-view-tracking.sql
```

## 📊 Adding New Platforms

When you get the Apify actor details for other platforms:

### 1. Update Multi-Platform Scraper
Edit `lib/multi-platform-scraper.ts`:

```typescript
// Add to the scrapers Map in initializeScrapers()
this.scrapers.set('YOUTUBE', new YouTubeScraper(this.apifyToken))
this.scrapers.set('TWITTER', new TwitterScraper(this.apifyToken))
this.scrapers.set('INSTAGRAM', new InstagramScraper(this.apifyToken))
```

### 2. Implement Platform Scrapers
Create individual scraper classes:

```typescript
// lib/youtube-scraper.ts
export class YouTubeScraper {
  async scrapeYouTubeVideo(url: string) {
    // Implementation with your Apify YouTube actor
  }
}
```

### 3. Update Data Transformation
Modify `transformRawData()` method to handle new platforms.

## 🔧 Maintenance

### Update Frequency
- **TikTok**: Every 30 minutes (current)
- **YouTube**: Every 2-4 hours (less frequent changes)
- **X/Twitter**: Every 1-2 hours
- **Instagram**: Every 1-2 hours

### Cost Management
- **Current**: ~$0/month (TikTok only, free tier)
- **With all platforms**: ~$5-20/month depending on volume

### Monitoring
```bash
# Check cron job status
node scripts/deploy-view-tracking.js status

# View recent logs
tail -f /var/log/swivi-view-tracking.log

# Manual update if needed
curl -X POST https://your-domain.com/api/view-tracking/update
```

## 🚨 Troubleshooting

### Common Issues

1. **Apify API Rate Limited**
   - Increase delay between requests (currently 1 second)
   - Upgrade Apify plan if needed

2. **Database Connection Issues**
   ```bash
   # Test connection
   npx prisma db ping
   ```

3. **Cron Job Not Running**
   ```bash
   # Check cron service
   sudo systemctl status cron

   # View cron logs
   sudo tail -f /var/log/cron.log
   ```

4. **Memory Issues**
   - Increase server memory
   - Process submissions in smaller batches

### Debug Mode
```env
DEBUG=view-tracking
NODE_ENV=development
```

## 📈 Scaling Considerations

### High Volume (1000+ submissions/day)
- **Queue System**: Use Redis/RabbitMQ for job queuing
- **Parallel Processing**: Process multiple URLs simultaneously
- **Caching**: Cache Apify responses (5-15 minute TTL)
- **Database Optimization**: Add indexes for view tracking queries

### Enterprise Features
- **Real-time Updates**: WebSocket notifications
- **Advanced Analytics**: Custom dashboards
- **Multi-region**: Global CDN for faster scraping
- **Backup Systems**: Redundant scraping services

## 🎯 Ready for Production

Your multi-platform view tracking system is now production-ready:

✅ **TikTok scraping** - Active and working
🔄 **Multi-platform support** - Framework ready for YouTube, X, Instagram
✅ **Automated updates** - Cron jobs every 30 minutes
✅ **Admin dashboard** - Complete campaign and submission management
✅ **Real-time data** - Live view counts in UI
✅ **Error handling** - Robust failure recovery
✅ **Monitoring** - Comprehensive logging and status checks

The system will automatically scale as you add more platforms and handle increased submission volumes. Start with TikTok, then expand to other platforms as your clipping community grows! 🚀
