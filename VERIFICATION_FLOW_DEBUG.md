# 🔍 Social Media Verification Flow - Debug Guide

## Current Status: DEBUGGING ENABLED

I've added comprehensive logging to identify and fix the "No pending verification found" issue.

## How the Verification Flow Works

### 1. **Code Generation** (`/api/social-verification/generate`)
```
User Input: { platform: "instagram", username: "testuser", displayName: "Test" }
↓
Server: Maps "instagram" → "INSTAGRAM" (enum)
↓
Database: Creates record in social_verifications table
↓
Response: Returns 6-character code (e.g., "A3X7K9")
```

### 2. **User Action**
```
User copies code → Adds to social media bio → Returns to verify
```

### 3. **Verification** (`/api/social-verification/verify`)
```
User Input: { platform: "instagram", username: "testuser", displayName: "Test" }
↓
Server: Maps "instagram" → "INSTAGRAM" 
↓
Database: Searches for unverified record matching userId + platform
↓
Mock Check: checkCodeInBio() returns true (for now)
↓
Database: Marks verification as complete + creates social_account
```

## Debug Information Added

### Console Logs Now Show:
1. **Generate endpoint**: User ID, platform enum, code, username
2. **Verify endpoint**: Search criteria, found verification, all user verifications
3. **Error details**: Platform mapping, user ID, verification count

### Debug Response:
When verification fails, the API now returns:
```json
{
  "error": "No pending verification found. Please generate a new code.",
  "debug": {
    "userId": "user-id-here",
    "requestedPlatform": "instagram", 
    "platformEnum": "INSTAGRAM",
    "username": "testuser",
    "allVerifications": 2
  }
}
```

## Testing Instructions

### Step 1: Generate Code
1. Go to profile page → Social verification
2. Enter username and click "Generate Code"
3. **Check browser console** for logs like:
   ```
   🎯 Creating verification: userId=xxx, platform=INSTAGRAM, code=ABC123, username=testuser
   ✅ Verification created: { id: xxx, platform: INSTAGRAM, code: ABC123 }
   ```

### Step 2: Verify Code  
1. Add code to social media bio (or skip for testing)
2. Click "Verify Account"
3. **Check browser console** for logs like:
   ```
   🔍 Looking for verification: userId=xxx, platform=INSTAGRAM, username=testuser
   🔍 Found verification: { id: xxx, code: ABC123, platform: INSTAGRAM }
   ```

### Step 3: If Error Occurs
If you see "No pending verification found", check the debug object in the response:
- Does `userId` match between generate and verify?
- Does `platformEnum` match what was created?
- Does `allVerifications` show > 0?

## Potential Issues & Fixes

### Issue 1: Platform Mismatch
**Problem**: Frontend sends "instagram" but database has "Instagram"
**Solution**: Platform mapping is now consistent (lowercase → UPPERCASE)

### Issue 2: User ID Mismatch  
**Problem**: Different sessions between generate/verify
**Solution**: Debug logs show exact user IDs used

### Issue 3: Expired Codes
**Problem**: Code expired between generate/verify
**Solution**: Codes valid for 24 hours, debug shows expiration status

### Issue 4: Database Schema Issues
**Problem**: Column name mismatches (display_name vs displayName)
**Solution**: Using explicit select statements

## Mock Bio Checking

Currently, `checkCodeInBio()` returns `true` for all requests. This means:
- ✅ All verifications will succeed regardless of bio content
- 🚧 Ready for real platform API integration later

## Real Platform Integration (Future)

To implement real bio checking:

### Instagram
```typescript
// Use Instagram Basic Display API
const response = await fetch(`https://graph.instagram.com/${username}?fields=biography&access_token=${token}`)
const data = await response.json()
return data.biography?.includes(code) || false
```

### YouTube
```typescript  
// Use YouTube Data API v3
const response = await fetch(`https://youtube.googleapis.com/youtube/v3/channels?part=snippet&forUsername=${username}&key=${apiKey}`)
const data = await response.json()
return data.items[0]?.snippet?.description?.includes(code) || false
```

### Twitter/X
```typescript
// Use Twitter API v2
const response = await fetch(`https://api.twitter.com/2/users/by/username/${username}?user.fields=description`, {
  headers: { 'Authorization': `Bearer ${bearerToken}` }
})
const data = await response.json()
return data.data?.description?.includes(code) || false
```

### TikTok
```typescript
// Use TikTok Research API (limited access)
// For now, manual verification or web scraping approach
```

## Next Steps

1. **Test the flow** with debug logging enabled
2. **Share the debug output** from browser console if issues persist
3. **Fix any identified mismatches** based on logs
4. **Remove debug logs** once working properly
5. **Implement real API checking** for production

## Manual Database Check

To manually verify database state:
```sql
-- Check recent verifications
SELECT * FROM social_verifications 
WHERE user_id = 'your-user-id' 
ORDER BY created_at DESC LIMIT 5;

-- Check social accounts
SELECT * FROM social_accounts 
WHERE user_id = 'your-user-id' 
ORDER BY created_at DESC LIMIT 5;
```
