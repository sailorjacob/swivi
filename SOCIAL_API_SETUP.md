# Social Media API Setup Guide

## Overview
This guide shows how to set up official social media APIs for reliable verification - the same approach Discord bots and professional platforms use.

## 🐦 Twitter/X API Setup

### Step 1: Create Twitter Developer Account
1. Go to [developer.twitter.com](https://developer.twitter.com)
2. Apply for developer access (usually approved within 24 hours)
3. Create a new app in the developer portal

### Step 2: Get Bearer Token
1. In your app dashboard, go to "Keys and tokens"
2. Generate a "Bearer Token"
3. Add to your environment variables:
```bash
TWITTER_BEARER_TOKEN=your_bearer_token_here
```

### Step 3: Test
```bash
curl -X POST https://www.swivimedia.com/api/social-verification/verify-api \
  -H "Content-Type: application/json" \
  -d '{"platform": "twitter", "username": "elonmusk"}'
```

## 📺 YouTube API Setup

### Step 1: Create Google Cloud Project
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project
3. Enable the YouTube Data API v3

### Step 2: Get API Key
1. Go to "Credentials" in your project
2. Create "API Key"
3. Restrict it to YouTube Data API v3
4. Add to environment variables:
```bash
YOUTUBE_API_KEY=your_api_key_here
```

### Step 3: Test
```bash
curl -X POST https://www.swivimedia.com/api/social-verification/verify-api \
  -H "Content-Type: application/json" \
  -d '{"platform": "youtube", "username": "mkbhd"}'
```

## 📸 Instagram API Setup

### Current Status: ❌ Requires Business Review
Instagram requires Meta Business API approval for bio access. This involves:
1. Business verification with Meta
2. App review process (2-4 weeks)
3. Legitimate business use case

### Alternative: Manual verification for Instagram
Use the manual verification endpoint for Instagram until API approval.

## 🎵 TikTok API Setup

### Current Status: ❌ Limited Bio Access
TikTok's API doesn't provide easy bio content access. Most platforms use manual verification for TikTok.

## 🚀 Quick Setup for Development

### Option 1: Twitter Only (Easiest)
1. Set up Twitter API (takes 1 day)
2. Use manual verification for other platforms
3. Perfect for getting started

### Option 2: Twitter + YouTube (Recommended)
1. Set up both Twitter and YouTube APIs
2. Covers most verification needs
3. Manual verification for Instagram/TikTok

### Option 3: Test Mode (Immediate)
Use the test endpoint with `testMode: true` for instant verification during development:
```bash
curl -X POST https://www.swivimedia.com/api/social-verification/verify-test \
  -H "Content-Type: application/json" \
  -d '{"platform": "twitter", "username": "test", "testMode": true}'
```

## Environment Variables Summary

Add these to your Vercel environment variables:

```bash
# Twitter API
TWITTER_BEARER_TOKEN=your_twitter_bearer_token

# YouTube API  
YOUTUBE_API_KEY=your_youtube_api_key

# Optional: Instagram (when approved)
INSTAGRAM_ACCESS_TOKEN=your_instagram_token

# Optional: TikTok (if available)
TIKTOK_CLIENT_KEY=your_tiktok_key
```

## API Endpoints

- **Production API verification**: `/api/social-verification/verify-api`
- **Test mode verification**: `/api/social-verification/verify-test`
- **Manual verification**: `/api/social-verification/verify-simple`

## Rate Limits

- **Twitter**: 300 requests per 15 minutes
- **YouTube**: 10,000 units per day (1 verification = ~2 units)
- **Instagram**: Varies by app review approval
- **TikTok**: Limited availability

## Best Practices

1. **Start with Twitter API** - easiest to get approved
2. **Use test mode** for development
3. **Manual verification fallback** for unsupported platforms
4. **Cache API responses** to avoid rate limits
5. **Graceful degradation** when APIs are down

This approach matches how Discord, Whop, and other professional platforms handle social verification! 🎯
