# Apify Actor Setup for View Tracking

## Critical Issue: View Tracking Not Working

The 404 error you're seeing means the Apify actors are misconfigured or don't exist. This affects **BOTH** test page **AND** production.

---

## Current Actors (BROKEN):

```typescript
// TikTok - Seems OK
'clockworks~tiktok-scraper' ✅

// YouTube - CAUSES 404 ERROR
'streamers/youtube-shorts-scraper' ❌

// Instagram - Should work
'apify/instagram-scraper' ✅

// Twitter - PLACEHOLDER (fake data)
'twitter-scraper-placeholder' ❌
```

---

## How to Find Correct Actors

### Step 1: Go to Apify Store
https://apify.com/store

### Step 2: Search for Each Platform

**For TikTok:**
- Search: "TikTok scraper"
- Look for actors with high ratings and recent updates
- Popular options:
  - `clockworks~tiktok-scraper` (current - verify it's still working)
  - `apify/tiktok-scraper` (official if available)

**For YouTube:**
- Search: "YouTube video scraper"
- Need one that works for ALL videos (not just shorts)
- Check for actors that return: `viewCount`, `likeCount`, `title`, `channelName`
- Popular options:
  - `streamers/youtube-scraper` (for regular videos)
  - `bernardo/youtube-scraper`
  - Look for "YouTube Video Scraper" in store

**For Instagram:**
- Current actor `apify/instagram-scraper` should work
- Verify it's still active and supports:
  - Posts
  - Reels
  - Returns: `videoViewCount`, `likesCount`, `commentsCount`

**For Twitter/X:**
- Search: "Twitter scraper" or "X scraper"
- Need one that returns: `viewCount`, `likeCount`, `retweetCount`
- Popular options:
  - `apidojo/tweet-scraper`
  - `vdrmota/twitter-scraper`
  - Look for "Twitter/X Scraper" with view count support

---

## Step 3: Test Each Actor

### Testing in Apify Console:

1. Go to https://console.apify.com/actors
2. Click on an actor
3. Click "Try it"
4. Enter a test URL:
   - **TikTok**: `https://www.tiktok.com/@user/video/123456`
   - **YouTube**: `https://www.youtube.com/watch?v=VIDEO_ID`
   - **Instagram**: `https://www.instagram.com/p/POST_ID/`
   - **Twitter**: `https://twitter.com/user/status/123456`

5. Click "Start" and wait for results
6. Verify you get:
   - View count
   - Like count
   - Author info
   - Other engagement metrics

---

## Step 4: Update the Code

### Files to Update:

**1. YouTube Scraper** (`lib/apify-youtube-scraper.ts`):
```typescript
// Line 27 - Update this:
private actorName = 'streamers/youtube-shorts-scraper' // OLD - BROKEN

// Replace with correct actor (example):
private actorName = 'streamers/youtube-scraper' // Or whatever works
```

**Also update the input parameters** (lines 48-51):
```typescript
body: JSON.stringify({
  // Update these parameters to match the new actor's input schema
  // Check the actor's README for correct parameters
  startUrls: [{ url: videoUrl }],
  // Or whatever the new actor expects
}),
```

**2. Twitter Scraper** (`lib/apify-twitter-scraper.ts`):
```typescript
// Line 34 - Update this:
private actorName = 'twitter-scraper-placeholder' // FAKE

// Replace with correct actor (example):
private actorName = 'apidojo/tweet-scraper' // Or whatever works
```

**And uncomment/fix the actual implementation** (lines 72-155)

---

## Step 5: Test Locally

After updating the actors:

```bash
# In terminal
cd /Users/jacob/Downloads/swivi
npm run dev
```

Then go to: `http://localhost:3000/test/view-tracking`

Try submitting a URL from each platform and see if scraping works!

---

## Quick Fix Option: Disable Broken Platforms Temporarily

If you need to test immediately, you can temporarily disable YouTube and Twitter:

**In `lib/multi-platform-scraper.ts`**:
```typescript
async scrapeContent(url: string, platform: SocialPlatform): Promise<ScrapedContentData> {
  try {
    // Temporary: Only allow TikTok and Instagram
    if (platform === 'YOUTUBE' || platform === 'TWITTER') {
      return {
        platform,
        url,
        views: 0, // Placeholder
        error: 'Platform temporarily disabled - actor not configured'
      }
    }

    // Continue with existing code...
```

This lets you test TikTok and Instagram while you find the right YouTube/Twitter actors.

---

## Environment Variables

Make sure you have:

```bash
# In .env.local and production
APIFY_TOKEN=your_apify_token_here
```

Verify your token works:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.apify.com/v2/actor-runs
```

Should return 200, not 401/403.

---

## Next Steps

1. ✅ Go to Apify Store
2. ✅ Find working actors for YouTube & Twitter
3. ✅ Test them in Apify console
4. ✅ Update `lib/apify-youtube-scraper.ts` with correct actor
5. ✅ Update `lib/apify-twitter-scraper.ts` with correct actor & remove mock data
6. ✅ Test locally on test page
7. ✅ Commit and push to production
8. ✅ Test on real domain

---

## Common Actor Input Schemas

Most actors expect something like:

### TikTok:
```json
{
  "postURLs": ["https://www.tiktok.com/..."],
  "resultsPerPage": 1
}
```

### YouTube:
```json
{
  "startUrls": [{"url": "https://www.youtube.com/watch?v=..."}],
  "maxResults": 1
}
```

### Instagram:
```json
{
  "directUrls": ["https://www.instagram.com/p/..."],
  "resultsLimit": 1
}
```

### Twitter:
```json
{
  "urls": ["https://twitter.com/.../status/..."],
  "maxTweets": 1
}
```

Check each actor's README for exact schema!

---

## Need Help?

If you can't find working actors, let me know which platforms are priority and I can help research specific actor IDs from the Apify Store.

