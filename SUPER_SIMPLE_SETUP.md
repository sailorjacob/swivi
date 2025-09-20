# 🚀 SUPER SIMPLE SWIVI SETUP

## 📍 YOUR SUPABASE PROJECT
✅ **Your Supabase URL**: `https://xaxleljcctobmnwiwxvx.supabase.co`
✅ **Project ID**: `xaxleljcctobmnwiwxvx`

---

## 🎯 STEP 1: GET YOUR SUPABASE KEYS (2 minutes)

### 1.1 Go to your Supabase dashboard
👉 Click here: https://app.supabase.com/project/xaxleljcctobmnwiwxvx

### 1.2 Get your API Keys
1. Click **"Settings"** in the left sidebar
2. Click **"API"** 
3. You'll see these keys (COPY THEM):

```
✅ URL: https://xaxleljcctobmnwiwxvx.supabase.co
✅ anon public key: eyJ... (starts with eyJ - COPY THIS)
✅ service_role key: eyJ... (starts with eyJ - COPY THIS)
```

### 1.3 Get your Database Password
1. Still in **Settings** → Click **"Database"**
2. Look for **"Connection string"** 
3. You'll see: `postgresql://postgres:[YOUR-PASSWORD]@db.xaxleljcctobmnwiwxvx.supabase.co:5432/postgres`
4. **COPY the [YOUR-PASSWORD] part** (you set this when creating the project)

---

## 🎯 STEP 2: CREATE YOUR .ENV FILE (1 minute)

### 2.1 Find the .env file location
Your `.env` file goes in the main project folder:
```
📁 swivi/
  📄 .env  ← CREATE THIS FILE HERE
  📄 package.json
  📁 app/
  📁 components/
```

### 2.2 Create the .env file
**Option A**: Copy the example file
```bash
cp env.example .env
```

**Option B**: Create manually
Create a new file called `.env` (no extension) in your swivi folder.

### 2.3 Fill in YOUR ACTUAL VALUES
Open the `.env` file and paste this (REPLACE the values with YOUR actual ones):

```env
# Database - REPLACE [YOUR-PASSWORD] with your actual password
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xaxleljcctobmnwiwxvx.supabase.co:5432/postgres"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="super-secret-key-change-this-later"

# Supabase - REPLACE with your actual keys from step 1.2
NEXT_PUBLIC_SUPABASE_URL="https://xaxleljcctobmnwiwxvx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ[YOUR-ACTUAL-ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="eyJ[YOUR-ACTUAL-SERVICE-ROLE-KEY]"

# OAuth (we'll set these up later)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
DISCORD_CLIENT_ID=""
DISCORD_CLIENT_SECRET=""
```

**🚨 IMPORTANT**: Replace these placeholders:
- `[YOUR-PASSWORD]` = Your Supabase database password
- `eyJ[YOUR-ACTUAL-ANON-KEY]` = Your actual anon key from Supabase
- `eyJ[YOUR-ACTUAL-SERVICE-ROLE-KEY]` = Your actual service role key from Supabase

---

## 🎯 STEP 3: TEST THE DATABASE CONNECTION (2 minutes)

### 3.1 Install everything
```bash
npm install
```

### 3.2 Test database connection
```bash
npm run prisma:generate
```

If this works ✅, your database is connected!

If it fails ❌, check your DATABASE_URL in .env

### 3.3 Setup your database
```bash
npm run setup
```

This creates all your database tables and adds sample data.

### 3.4 Start your app
```bash
npm run dev
```

Visit: http://localhost:3000

---

## 🎯 STEP 4: GOOGLE LOGIN SETUP (5 minutes)

### 4.1 Go to Google Cloud Console
👉 https://console.cloud.google.com/

### 4.2 Create/Select Project
1. Click the project dropdown at the top
2. Click **"New Project"**
3. Name it: **"Swivi"**
4. Click **"Create"**

### 4.3 Enable Google+ API
1. Click **"APIs & Services"** → **"Library"**
2. Search: **"Google+ API"**
3. Click it → Click **"Enable"**

### 4.4 Create OAuth Credentials
1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. Choose **"Web application"**
4. Name: **"Swivi Web App"**
5. Add these redirect URIs:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
6. Click **"Create"**
7. **COPY** the Client ID and Client Secret

### 4.5 Add to your .env file
Update your `.env` file:
```env
GOOGLE_CLIENT_ID="your-actual-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-actual-client-secret"
```

---

## 🎯 STEP 5: DISCORD LOGIN SETUP (5 minutes)

### 5.1 Go to Discord Developer Portal
👉 https://discord.com/developers/applications

### 5.2 Create Application
1. Click **"New Application"**
2. Name: **"Swivi"**
3. Click **"Create"**

### 5.3 Setup OAuth
1. Click **"OAuth2"** in the left sidebar
2. Click **"General"**
3. Add redirect URI:
   ```
   http://localhost:3000/api/auth/callback/discord
   ```
4. Click **"Save Changes"**
5. **COPY** the Client ID and Client Secret from the top

### 5.4 Add to your .env file
Update your `.env` file:
```env
DISCORD_CLIENT_ID="your-actual-discord-client-id"
DISCORD_CLIENT_SECRET="your-actual-discord-client-secret"
```

---

## 🎯 STEP 6: VERCEL DEPLOYMENT (10 minutes)

### 6.1 Deploy to Vercel
1. Go to: https://vercel.com/new
2. Import your GitHub repository
3. Click **"Deploy"**
4. Wait for deployment (it might fail first time - that's ok!)

### 6.2 Add Environment Variables in Vercel
1. Go to your project in Vercel
2. Click **"Settings"** → **"Environment Variables"**
3. Add EACH of these one by one:

**Database:**
```
Name: DATABASE_URL
Value: postgresql://postgres:[YOUR-PASSWORD]@db.xaxleljcctobmnwiwxvx.supabase.co:5432/postgres
```

**Authentication:**
```
Name: NEXTAUTH_URL
Value: https://your-app-name.vercel.app

Name: NEXTAUTH_SECRET
Value: super-secret-key-change-this-later
```

**Supabase:**
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://xaxleljcctobmnwiwxvx.supabase.co

Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: [your-actual-anon-key]

Name: SUPABASE_SERVICE_ROLE_KEY
Value: [your-actual-service-role-key]
```

**OAuth:**
```
Name: GOOGLE_CLIENT_ID
Value: [your-google-client-id]

Name: GOOGLE_CLIENT_SECRET
Value: [your-google-client-secret]

Name: DISCORD_CLIENT_ID
Value: [your-discord-client-id]

Name: DISCORD_CLIENT_SECRET
Value: [your-discord-client-secret]
```

### 6.3 Update OAuth Redirect URIs
Once deployed, update your OAuth apps:

**Google:**
1. Go back to Google Cloud Console → Credentials
2. Edit your OAuth client
3. Add: `https://your-app-name.vercel.app/api/auth/callback/google`

**Discord:**
1. Go back to Discord Developer Portal
2. OAuth2 → General
3. Add: `https://your-app-name.vercel.app/api/auth/callback/discord`

### 6.4 Redeploy
1. Go to Vercel dashboard
2. Click **"Deployments"**
3. Click **"Redeploy"** on the latest deployment

---

## ✅ TESTING CHECKLIST

After setup, test these:

1. **Local Development:**
   - [ ] `npm run dev` works
   - [ ] Can visit http://localhost:3000
   - [ ] Google login works
   - [ ] Discord login works

2. **Production:**
   - [ ] Vercel app loads
   - [ ] Google login works on Vercel
   - [ ] Discord login works on Vercel

---

## 🆘 COMMON ISSUES

### "Database connection failed"
- Double-check your DATABASE_URL in .env
- Make sure you replaced [YOUR-PASSWORD] with actual password
- Check Supabase project is active

### "OAuth error"
- Check redirect URIs match exactly
- Make sure you added both localhost AND Vercel URLs
- Check client IDs and secrets are correct

### "Build failed on Vercel"
- Make sure ALL environment variables are added to Vercel
- Check the build logs for specific errors

---

## 🎯 QUICK REFERENCE

**Your Supabase Project**: https://app.supabase.com/project/xaxleljcctobmnwiwxvx

**Essential Commands:**
```bash
npm run dev          # Start development
npm run setup        # Setup database
npm run prisma:studio # View database
```

**Important Files:**
- `.env` - Your secret keys (NEVER commit to git)
- `prisma/schema.prisma` - Your database structure

You're all set! 🎉
