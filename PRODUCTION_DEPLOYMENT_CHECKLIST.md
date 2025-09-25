# 🚀 Production Deployment Checklist - URGENT FIX

## Current Issue: 500 Errors on swivimedia.com

The production site is experiencing 500 errors because:
1. Database connection configuration missing
2. Environment variables not properly set
3. Recent fixes not deployed

## Immediate Actions Required

### 1. Vercel Environment Variables (CRITICAL)

Go to your Vercel Dashboard → Project Settings → Environment Variables and add:

```bash
DATABASE_URL=postgresql://postgres.xaxleljcctobmnwiwxvx:UdX2lCrskGltgsbH@aws-1-us-east-2.pooler.supabase.com:6543/postgres

NEXTAUTH_SECRET=your-production-secret-32-chars-min

DISCORD_CLIENT_ID=your-discord-app-id
DISCORD_CLIENT_SECRET=your-discord-app-secret

NEXTAUTH_URL=https://swivimedia.com

NODE_ENV=production
```

### 2. Discord OAuth Configuration

In your Discord Developer Portal (https://discord.com/developers/applications):

1. Go to your Discord app
2. Navigate to "OAuth2" → "General"
3. Add to **Redirect URIs**:
   ```
   https://swivimedia.com/api/auth/callback/discord
   ```
4. Remove or keep localhost for development:
   ```
   http://localhost:3000/api/auth/callback/discord
   ```

### 3. Deploy Current Fixes

The main branch now has all the fixes. Deploy by either:

**Option A: Automatic Deployment**
- Vercel should auto-deploy from your latest commit
- Check Vercel dashboard for deployment status

**Option B: Manual Trigger**
- Go to Vercel dashboard → Deployments
- Click "Redeploy" on the latest deployment

### 4. Database Schema Verification

The production database needs the latest schema. Check if these tables exist:
- `social_verifications`
- `social_accounts` 

If missing, the app will auto-create them on first database access.

## Current Fixes Included

✅ **Database Connection**: pgBouncer configuration for Supabase
✅ **500 Error Fixes**: All API endpoints properly handle errors
✅ **Verification Flow**: Complete debugging and platform mapping
✅ **Environment Validation**: Proper env var checking
✅ **OAuth Integration**: Discord login working

## Testing After Deployment

1. **Check Basic Loading**:
   - Visit https://swivimedia.com/clippers/dashboard
   - Should not see 500 errors

2. **Test Discord Login**:
   - Go to https://swivimedia.com/clippers/login
   - Click "Sign in with Discord"
   - Should redirect to Discord and back properly

3. **Test Verification Flow**:
   - Navigate to profile page
   - Try generating a verification code
   - Should work without 500 errors

## If Still Having Issues

### Check Vercel Logs:
1. Go to Vercel Dashboard → Functions
2. Click on failed function calls
3. Check error logs for specific issues

### Check Environment Variables:
1. Ensure all variables are set to "Production" environment
2. No trailing spaces or hidden characters
3. DATABASE_URL includes the pgbouncer parameters

### Database Connection Test:
- The app now includes automatic connection testing
- Check browser console for connection status

## Discord OAuth Setup Details

Your Discord app settings should have:

**OAuth2 URLs**:
- Authorization URL: `https://discord.com/api/oauth2/authorize`
- Token URL: `https://discord.com/api/oauth2/token`
- Redirect URIs: `https://swivimedia.com/api/auth/callback/discord`

**Scopes Needed**:
- `identify` (get user ID and username)
- `email` (get user email)

## Environment Variables Template

Save this in your password manager for reference:

```bash
# Database - Supabase
DATABASE_URL="postgresql://postgres.xaxleljcctobmnwiwxvx:UdX2lCrskGltgsbH@aws-1-us-east-2.pooler.supabase.com:6543/postgres"

# Authentication
NEXTAUTH_SECRET="generate-a-32-character-random-string-here"
NEXTAUTH_URL="https://swivimedia.com"

# Discord OAuth
DISCORD_CLIENT_ID="your-discord-application-id"
DISCORD_CLIENT_SECRET="your-discord-application-secret"

# Environment
NODE_ENV="production"
```

## Troubleshooting Commands

If you need to check the production environment:

```bash
# Check deployment status
vercel --prod

# Check environment variables
vercel env ls

# Check logs
vercel logs https://swivimedia.com
```

## Success Criteria

✅ No 500 errors on page load
✅ Discord login works properly  
✅ Profile page loads connected accounts
✅ Verification flow generates codes
✅ User can complete verification process

Deploy these fixes immediately to resolve the production issues!
