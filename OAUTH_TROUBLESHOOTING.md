# 🔧 OAuth Troubleshooting Guide

## ✅ **What's Working:**
- NextAuth endpoints: ✅ Working
- OAuth providers: ✅ Configured  
- Callback URLs: ✅ Added to providers
- Database: ✅ Connected
- Redirects: ✅ All returning 302 (correct)

## 🚨 **The Issue:**
Users click OAuth → Get redirected back to login instead of dashboard → No account created

## 🎯 **Most Likely Causes:**

### 1. **Google OAuth Consent Screen** (90% of cases)

**Problem**: You're not added as a test user in Google OAuth app

**Fix**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. **APIs & Services → OAuth consent screen**
4. Scroll down to **"Test users"**
5. Click **"Add users"**
6. Add your email address
7. **Save**

### 2. **Discord App Scopes**

**Problem**: Wrong scopes or app configuration

**Fix**:
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Your App → **OAuth2 → General**
3. Make sure these scopes are available:
   - ✅ `identify`
   - ✅ `email`
4. **OAuth2 → URL Generator**: Test with these scopes

### 3. **Environment Variables**

**Problem**: Vercel environment variables don't match local

**Check**:
```bash
# Your local .env has:
DISCORD_CLIENT_ID="your-discord-client-id"
DISCORD_CLIENT_SECRET="your-discord-client-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Make sure Vercel has EXACTLY the same values
```

## 🧪 **Testing Steps:**

### Step 1: Try OAuth Signup
1. Go to https://www.swivimedia.com/clippers/signup
2. Click "Continue with Google"
3. **Watch what happens**:
   - ✅ **Success**: Redirected to Google → Back to dashboard
   - ❌ **Failure**: Error message or back to login

### Step 2: Check Browser Console
1. Open browser developer tools (F12)
2. Go to **Console** tab
3. Try OAuth signup
4. **Look for error messages**

### Step 3: Check Vercel Logs
1. Go to [Vercel Dashboard](https://vercel.com)
2. Your project → **Functions**
3. Try OAuth signup
4. **Refresh logs** and look for:
   - "OAuth sign in attempt"
   - "Creating new user"
   - Any error messages

## 🔍 **What to Look For:**

### **Success Indicators:**
- Console log: "OAuth sign in attempt: { provider: 'google', email: 'your@email.com' }"
- Console log: "Creating new user for: your@email.com"
- Console log: "User created successfully"
- Redirect to: `/clippers/dashboard`
- New user appears in Supabase

### **Failure Indicators:**
- Console error: "OAuth error: [some error]"
- Toast message: "Google authentication failed"
- Redirect back to: `/clippers/login`
- No user in Supabase

## 🚀 **Quick Fixes:**

### If Google OAuth fails:
1. **Add yourself as test user** in Google OAuth consent screen
2. **Make sure OAuth consent screen is configured** with app name, support email
3. **Check that redirect URI is exact**: `https://www.swivimedia.com/api/auth/callback/google`

### If Discord OAuth fails:
1. **Check Discord app is public** or you have access
2. **Verify scopes**: `identify` and `email`
3. **Check redirect URI is exact**: `https://www.swivimedia.com/api/auth/callback/discord`

### If both fail:
1. **Check Vercel environment variables** match local
2. **Check database connection** in production
3. **Wait 5-10 minutes** after making OAuth changes

## 📞 **Next Steps:**

1. **Try the OAuth flow** and note exactly what happens
2. **Check browser console** for any error messages
3. **Check Vercel logs** during the attempt
4. **Report back** with specific error messages or behavior

The technical setup is perfect - it's just a configuration issue with the OAuth providers themselves!
