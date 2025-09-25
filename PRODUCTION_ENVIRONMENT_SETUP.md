# 🚀 Production Environment Setup - Complete Configuration

## Critical Environment Variables for Production

### Vercel Dashboard → Settings → Environment Variables

Add these **exactly** as shown:

```bash
# Database Configuration
DATABASE_URL=postgresql://postgres.xaxleljcctobmnwiwxvx:UdX2lCrskGltgsbH@aws-1-us-east-2.pooler.supabase.com:6543/postgres

# Authentication
NEXTAUTH_SECRET=f8e3d4c2b1a0987654321098765432109876543210987654321098765432
NEXTAUTH_URL=https://swivimedia.com

# Discord OAuth
DISCORD_CLIENT_ID=your-actual-discord-client-id
DISCORD_CLIENT_SECRET=your-actual-discord-client-secret

# Environment
NODE_ENV=production
```

## Discord Developer Portal Configuration

### OAuth2 Settings:
1. Go to https://discord.com/developers/applications
2. Select your application
3. Go to "OAuth2" → "General"
4. **Redirect URIs**:
   ```
   https://swivimedia.com/api/auth/callback/discord
   http://localhost:3000/api/auth/callback/discord
   ```
5. **Scopes**: `identify`, `email`

## Real Social Media Verification

### How It Works:
1. **Generate Code**: User gets 6-character verification code
2. **Add to Bio**: User adds code to their social media bio/description
3. **Real Verification**: System scrapes public profile to find code
4. **Account Verified**: Creates verified social account in database

### Supported Platforms:

#### Instagram (@username)
- **URL Checked**: `https://www.instagram.com/username/`
- **Location**: Profile biography section
- **Example**: Add `ABC123` to your Instagram bio

#### YouTube (channel name)
- **URLs Checked**: 
  - `https://www.youtube.com/@username`
  - `https://www.youtube.com/c/username`
  - `https://www.youtube.com/user/username`
- **Location**: Channel description
- **Example**: Add `ABC123` to your YouTube channel description

#### TikTok (@username)
- **URL Checked**: `https://www.tiktok.com/@username`
- **Location**: Profile bio section
- **Example**: Add `ABC123` to your TikTok bio

#### Twitter/X (@username)
- **URL Checked**: `https://twitter.com/username`
- **Location**: Profile description
- **Example**: Add `ABC123` to your Twitter bio

## Testing the Real Verification

### Step 1: Generate Code
1. Go to profile page → Social verification
2. Enter your username (without @)
3. Click "Generate Code" → Get 6-character code

### Step 2: Add Code to Bio
1. Copy the verification code
2. Add it anywhere in your social media bio/description
3. Save the profile changes

### Step 3: Verify
1. Return to verification dialog
2. Click "Verify Account"
3. System will check your actual profile
4. Success = Account appears in connected accounts

## Verification Requirements

### Profile Must Be:
- ✅ **Public** (not private/protected)
- ✅ **Accessible** (not banned/suspended)
- ✅ **Real** (actual social media profile)
- ✅ **Contains Code** (exact 6-character code in bio)

### Common Issues:
- ❌ Private/protected profiles cannot be verified
- ❌ Code not found in bio (case-sensitive)
- ❌ Profile doesn't exist or was deleted
- ❌ Platform blocking our verification requests

## Error Handling

### If Verification Fails:
1. **Check Profile is Public**: Make sure profile is not private
2. **Verify Code is Present**: Code must be exactly as generated
3. **Wait and Retry**: Social platforms may have rate limits
4. **Check Username Format**: No @ symbol in username field

### Error Messages:
- `Profile not found` → Username incorrect or profile doesn't exist
- `Could not extract bio` → Profile is private or has unusual format
- `Code not found` → Code not present in bio or typo
- `Verification failed` → Network/rate limiting issues

## Database Schema

### Tables Created:
- `social_verifications` → Pending verification codes
- `social_accounts` → Verified social media accounts
- `users` → User accounts with Discord OAuth
- `accounts` → OAuth provider accounts

### Data Flow:
1. **Generate**: Creates record in `social_verifications`
2. **Verify**: Checks real profile, marks verified
3. **Success**: Creates/updates record in `social_accounts`
4. **Display**: Profile page shows all connected accounts

## Production Monitoring

### Health Check Endpoints:
- `/api/health` → Basic application health
- `/api/health/env` → Environment variables status

### Expected Response (Healthy):
```json
{
  "NODE_ENV": "production",
  "DATABASE_URL_EXISTS": true,
  "DATABASE_URL_TYPE": "supabase-pooler",
  "NEXTAUTH_SECRET_EXISTS": true,
  "DISCORD_CLIENT_ID_EXISTS": true,
  "DISCORD_CLIENT_SECRET_EXISTS": true,
  "NEXTAUTH_URL": "https://swivimedia.com"
}
```

## Deployment Process

### 1. Set Environment Variables
- Add all variables to Vercel dashboard
- Set environment to "Production"

### 2. Configure Discord OAuth
- Add production redirect URI
- Test Discord login flow

### 3. Deploy Latest Code
- Code automatically deploys from main branch
- Or manually trigger in Vercel dashboard

### 4. Test Full Flow
- Discord login works
- Profile page loads
- Social verification generates codes
- Real bio checking verifies accounts
- Connected accounts display properly

## Security Considerations

### Rate Limiting:
- Social media platforms may rate limit requests
- Built-in retry logic and error handling
- User-Agent headers to identify legitimate requests

### Data Privacy:
- Only public profile information accessed
- Verification codes temporary (24-hour expiration)
- No sensitive data stored or transmitted

### Platform Compliance:
- Web scraping public profiles (allowed under ToS)
- No API keys required (avoiding quota limits)
- Respectful request patterns with proper delays

## Success Criteria

✅ All environment variables set correctly
✅ Discord OAuth working for production domain
✅ Database connection stable and fast
✅ Real social media verification working
✅ Profile page showing connected accounts
✅ Error handling provides clear feedback
✅ Performance acceptable for production use

## Troubleshooting Commands

```bash
# Check deployment status
curl https://swivimedia.com/api/health

# Check environment variables
curl https://swivimedia.com/api/health/env

# Test social verification
# (Generate code through UI, add to bio, verify)
```

This configuration ensures the verification system works consistently across all environments with real social media bio checking.
