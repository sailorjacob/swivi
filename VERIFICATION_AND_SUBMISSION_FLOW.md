# 🔐 Verification & Submission Flow Deep Dive

## Overview

This document explains how account verification and submission ownership verification works in the Swivi platform.

---

## 🔑 Account Verification Flow

### Step 1: User Initiates Verification
1. User clicks "Verify Account" for a platform (TikTok, Instagram, YouTube, Twitter)
2. System generates a unique 6-character code
3. User is instructed to add this code to their bio

### Step 2: Bio Check
1. System scrapes the user's bio using:
   - `verify-browserql/route.ts` - BrowserQL-based scraping
   - `verify/route.ts` - Direct API/scraping
   - `verify-simple/route.ts` - Simplified verification
   
2. Searches for the verification code in the bio text

### Step 3: Account Creation
On successful verification:
```typescript
await prisma.socialAccount.create({
  data: {
    userId: dbUser.id,
    platform: platformEnum,
    username: username,
    verified: true,
    verifiedAt: new Date()
  }
})
```

**Important**: Users can verify **multiple accounts per platform** - this is intentional for clippers with multiple TikTok/IG accounts.

---

## 📝 Submission Flow

### Step 1: URL Parsing (`lib/social-url-parser.ts`)

The `SocialUrlParser` extracts:
- `platform` - Which platform (TIKTOK, INSTAGRAM, etc.)
- `username` - The account username (if available in URL)
- `postId` - The video/post ID

**URL Types and What's Extracted:**

| Platform | URL Example | Username | PostId |
|----------|-------------|----------|--------|
| TikTok | `tiktok.com/@username/video/123` | ✅ `username` | ✅ `123` |
| TikTok | `vm.tiktok.com/ABC123` | ❌ None | ✅ `ABC123` |
| Instagram | `instagram.com/reel/ABC123` | ❌ None | ✅ `ABC123` |
| YouTube | `youtube.com/shorts/ABC123` | ❌ None | ✅ `ABC123` |
| Twitter | `x.com/username/status/123` | ✅ `username` | ✅ `123` |

### Step 2: Platform Access Check
```typescript
const platformAccess = await SubmissionVerificationService.validatePlatformAccess(
  userId, 
  platform
)
```
- Checks if user has **any** verified account for this platform
- If no verified accounts → **403 Platform verification required**

### Step 3: Ownership Verification
```typescript
const verificationResult = await SubmissionVerificationService.verifySubmissionOwnership({
  userId,
  clipUrl,
  platform
})
```

**Logic:**
1. **If username is in URL**: Compare with user's verified accounts
   - Match found → ✅ Auto-verified
   - No match → ⚠️ Flagged for manual review (username mismatch)

2. **If only postId in URL** (Instagram Reels, YouTube Shorts):
   - Calls `scrapePostForAuthor()` → **Currently returns `requiresReview: true`**
   - This means these submissions always need manual review

### Step 4: Submission Creation

**For Verified Content:**
```typescript
submission = await prisma.clipSubmission.create({
  data: {
    userId: dbUser.id,
    campaignId: validatedData.campaignId,
    clipUrl: validatedData.clipUrl,
    platform: validatedData.platform,
    status: "PENDING",  // Still needs admin approval
    initialViews: BigInt(viewsToStore)  // Baseline for earnings
  }
})
```

**For Failed Verification:**
```typescript
// Creates submission with REJECTED or PENDING status
status: verificationResult.requiresReview ? "PENDING" : "REJECTED"
rejectionReason: verificationResult.reason
```

---

## 🔍 Current Verification Status

| Scenario | Auto-Verified? | Manual Review? |
|----------|---------------|----------------|
| TikTok full URL (username in URL) | ✅ Yes | No |
| TikTok short link (vm.tiktok.com) | ❌ No | ⚠️ Yes |
| Instagram Reel | ❌ No | ⚠️ Yes |
| YouTube Shorts | ❌ No | ⚠️ Yes |
| Twitter/X post | ✅ Yes | No |
| No verified account for platform | ❌ Rejected | No |
| Admin user | ✅ Bypass | No |

---

## 🎯 What This Means In Practice

### Current Safeguards:
1. ✅ Users MUST verify at least one account per platform before submitting
2. ✅ TikTok full URLs auto-match against verified usernames
3. ✅ Mismatched usernames get flagged for review
4. ✅ Admins get notified of flagged submissions
5. ✅ Admin bypass for testing

### Current Gaps:
1. ❌ Instagram/YouTube submissions can't auto-verify (no username in URL)
2. ❌ `scrapePostForAuthor()` is not implemented - always flags for review
3. ❌ TikTok short links (vm.tiktok.com, /t/) can't extract username

---

## 💡 Recommendations

### Option A: Keep Manual Review (Current)
**Pros:**
- Safe - no false positives
- Works now without code changes
- Catches edge cases

**Cons:**
- Admin overhead
- Slower approval process

### Option B: Implement Author Scraping
Add to `scrapePostForAuthor()`:
```typescript
// Scrape the post to get the actual author
const scrapedData = await scraper.scrapeContent(clipUrl, platform)
const postAuthor = scrapedData.author

// Check if post author matches any verified account
const matchingAccount = verifiedAccounts.find(
  account => account.username.toLowerCase() === postAuthor?.toLowerCase()
)
```

**Pros:**
- Auto-verify Instagram/YouTube submissions
- Faster flow

**Cons:**
- Additional API calls/scraping
- Risk of scraping failures

### Option C: Trust Verified Users (Recommended for MVP)
Since users have already verified account ownership, we can reasonably trust they're submitting their own content:

```typescript
// If user has ANY verified account for this platform, allow submission
// Manual review is still possible via admin panel
if (verifiedAccounts.length > 0) {
  return { isVerified: true }
}
```

**Pros:**
- Simple
- Fast submissions
- Still have manual review capability

**Cons:**
- Technically allows submitting other accounts' content
- Relies on manual review as safety net

---

## 📊 Background Scraping Flow

### On Submission:
```typescript
// Async scraping with 10-second timeout
const scrapePromise = (async () => {
  const scrapedData = await scraper.scrapeContent(clipUrl, platform)
  return scrapedData.views || 0
})()

// Wait max 3 seconds for quick result
const quickResult = await Promise.race([
  scrapePromise,
  new Promise(resolve => setTimeout(() => resolve(0), 3000))
])
```

### What This Means:
1. ✅ Submissions don't fail if scraping is slow
2. ✅ Initial views captured if scrape is fast
3. ✅ Cron job catches up later if initial scrape fails
4. ✅ Good UX - fast submission response

---

## 🧪 Testing Checklist

### Account Verification
- [ ] Verify TikTok account - add code to bio, verify
- [ ] Verify Instagram account - add code to bio, verify
- [ ] Verify YouTube account - add code to bio, verify
- [ ] Verify multiple accounts on same platform

### Submission Flow
- [ ] Submit TikTok full URL (should auto-verify username)
- [ ] Submit TikTok short URL (should flag for review)
- [ ] Submit Instagram Reel (should flag for review)
- [ ] Submit YouTube Short (should flag for review)
- [ ] Submit without verified account (should reject)
- [ ] Submit as admin (should bypass)

### View Tracking
- [ ] Check submission has initial views captured
- [ ] Check view tracking cron updates views
- [ ] Check earnings calculate correctly

---

## 🔧 Quick Fix for Testing

If you want to test without full verification flow, use admin bypass:
1. Log in as admin user
2. Submit any URL - verification is bypassed
3. Manually approve in admin panel
4. View tracking starts

Or run this SQL to add a verified account for testing:
```sql
INSERT INTO social_accounts (
  id, "userId", platform, username, "displayName", "platformId", verified, "verifiedAt", connected, "createdAt", "updatedAt"
) VALUES (
  gen_random_uuid(),
  'YOUR_USER_ID',
  'TIKTOK',
  'testusername',
  'Test Account',
  'tiktok_testusername_' || extract(epoch from now())::text,
  true,
  NOW(),
  true,
  NOW(),
  NOW()
);
```

