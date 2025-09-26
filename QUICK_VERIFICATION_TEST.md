# 🔧 Quick Verification Testing Guide

## Immediate Steps to Test Verification:

### 1. **Fix Database Connection First**
```bash
# Check if your .env has the correct DATABASE_URL
cat .env | grep DATABASE_URL

# Should look like:
# DATABASE_URL="postgresql://postgres:PASSWORD@HOST:6543/postgres?pgbouncer=true"
```

### 2. **Test with a Known Public Instagram Account**
1. Go to your app: `http://localhost:3000/clippers/dashboard/profile`
2. Use username: `instagram` (Instagram's official account)
3. Generate code, then test verification

### 3. **Check Browser Console for Detailed Errors**
1. Open DevTools (F12) 
2. Go to Console tab
3. Try verification - look for detailed error messages

### 4. **Manual Instagram Profile Test**
Open in browser: `https://www.instagram.com/USERNAME_HERE/`
- ✅ Should load without login
- ❌ If requires login = private account
- ❌ If shows "User not found" = account doesn't exist

### 5. **Test API Endpoints Manually**
```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test database debug
curl http://localhost:3000/api/debug/db
```

## Common Instagram Username Issues:
- ❌ `@username` (remove the @)
- ❌ `Username with spaces`
- ❌ Private accounts
- ❌ Suspended/deleted accounts
- ✅ `natgeo` (National Geographic - always public)
- ✅ `instagram` (Instagram official)
- ✅ `nasa` (NASA - always public)

## If Still Getting Errors:
1. **Database Issue**: Fix your .env DATABASE_URL
2. **Instagram Blocking**: Try different username or wait 10 minutes
3. **Code Expired**: Generate a new verification code
4. **Rate Limited**: Wait 5-10 minutes between attempts

## Quick Database Fix:
If DATABASE_URL is wrong, copy from your Supabase dashboard:
1. Go to Supabase → Settings → Database
2. Copy "Connection string" 
3. Replace PASSWORD with your actual password
4. Restart dev server: `npm run dev`
