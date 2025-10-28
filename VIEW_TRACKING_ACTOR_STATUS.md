# View Tracking Actor Status

## ✅ Confirmed Working: Verification Actors
Since verification works in production, we know:
- `APIFY_TOKEN` is set correctly ✅
- Apify API is accessible ✅
- These actors work:
  - `abe/tiktok-profile-scraper` ✅
  - `pratikdani/youtube-profile-scraper` ✅
  - `apify/instagram-profile-scraper` ✅
  - `fastcrawler/twitter-user-profile-fast-cheapest-scraper-2025` ✅

---

## ⚠️ View Tracking Actors (For Getting View Counts)

### Current Configuration:

**TikTok (`lib/apify-tiktok-scraper.ts`):**
```
Actor: clockworks~tiktok-scraper
Input: {
  postURLs: [url],
  resultsPerPage: 1,
  excludePinnedPosts: false,
  ...many other params
}
```

**YouTube (`lib/apify-youtube-scraper.ts`):**
```
Actor: streamers/youtube-shorts-scraper
Input: {
  channels: [videoUrl],      // ⚠️ Might be wrong parameter name
  maxResultsShorts: 1
}
```

**Instagram (`lib/apify-instagram-scraper.ts`):**
```
Actor: apify/instagram-scraper
Input: {
  directUrls: [postUrl],
  resultsLimit: 200,
  resultsType: "posts",
  searchLimit: 1,
  searchType: "hashtag"       // ⚠️ Might cause issues
}
```

---

## 🔧 What Needs Checking

### For YouTube:
The actor `streamers/youtube-shorts-scraper` likely expects:
- Single video URL, not "channels"
- Different parameter names

**Possible fix:**
```json
{
  "startUrls": [{"url": videoUrl}],  // Instead of "channels"
  "maxResults": 1                     // Instead of "maxResultsShorts"
}
```

### For Instagram:
The parameter `searchType: "hashtag"` might be causing issues since we're providing direct URLs.

**Possible fix:**
```json
{
  "directUrls": [postUrl],
  "resultsLimit": 1,           // Lower limit
  "resultsType": "posts"
  // Remove searchType and searchLimit
}
```

---

## 🧪 How to Test Each Actor

Go to Apify Console and manually test:

1. **TikTok Test:**
   - Go to: https://console.apify.com/actors/clockworks~tiktok-scraper
   - Input a TikTok video URL
   - Check what parameters it actually expects
   - Verify it returns `playCount` (views)

2. **YouTube Test:**
   - Go to: https://console.apify.com/actors/streamers~youtube-shorts-scraper
   - Input a YouTube video/short URL
   - Check what parameters it expects
   - Verify it returns `viewCount`

3. **Instagram Test:**
   - Go to: https://console.apify.com/actors/apify~instagram-scraper
   - Input an Instagram post/reel URL
   - Check what parameters it expects
   - Verify it returns `videoViewCount` or `videoPlayCount`

---

## 🚨 Quick Debug: Which Platform is Failing?

The 404 error is coming from ONE of these platforms. To find out which:

1. Go to test page
2. Try each platform one by one:
   - Submit a TikTok URL → Check if 404
   - Submit a YouTube URL → Check if 404
   - Submit an Instagram URL → Check if 404

3. Check browser console for the exact error message
   - It will show which actor/endpoint returned 404

---

## 💡 Most Likely Issue

The YouTube actor `streamers/youtube-shorts-scraper` might:
- Not exist with that exact name
- Expect different input parameters
- Only work for shorts, not regular videos

**Solution:** Check the actor in Apify console and verify:
1. The exact actor ID
2. The required input schema
3. That it returns view count data

---

## Next Steps

1. **Test each actor manually** in Apify console with real URLs
2. **Update the input parameters** to match what the actors actually expect
3. **Test on the view tracking page** one platform at a time
4. **Check which specific actor is returning 404**

The code structure is correct - we just need to ensure the actor IDs and input parameters match what Apify expects!

