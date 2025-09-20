# 🚀 SWIVIMEDIA.COM PRODUCTION SETUP

## 🎯 YOUR LIVE DOMAIN: swivimedia.com
✅ **Supabase Project**: `https://xaxleljcctobmnwiwxvx.supabase.co`
✅ **Production Domain**: `swivimedia.com`

---

## 🔑 STEP 1: GET YOUR SUPABASE KEYS (2 minutes)

### Go to your Supabase dashboard:
👉 **Click here**: https://app.supabase.com/project/xaxleljcctobmnwiwxvx

### Get these 3 keys:
1. **Settings** → **API**
2. Copy these values:

```
✅ URL: https://xaxleljcctobmnwiwxvx.supabase.co
✅ anon public key: eyJ... (COPY THIS ENTIRE KEY)
✅ service_role key: eyJ... (COPY THIS ENTIRE KEY)
```

### Get your database password:
1. **Settings** → **Database** 
2. Look for connection string
3. Copy the password from: `postgresql://postgres:[PASSWORD]@db.xaxleljcctobmnwiwxvx.supabase.co:5432/postgres`

---

## 🌐 STEP 2: GOOGLE OAUTH FOR PRODUCTION

### 2.1 Setup Google Cloud Project
1. Go to: https://console.cloud.google.com/
2. Create new project: **"Swivimedia"**
3. **APIs & Services** → **Library** → Search **"Google+ API"** → **Enable**

### 2.2 Create OAuth Credentials
1. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**
2. **Web application**
3. Name: **"Swivimedia Production"**
4. **Authorized redirect URIs**: Add these EXACT URLs:
   ```
   https://swivimedia.com/api/auth/callback/google
   https://www.swivimedia.com/api/auth/callback/google
   ```
5. **Create** → Copy Client ID & Secret

---

## 🎮 STEP 3: DISCORD OAUTH FOR PRODUCTION

### 3.1 Create Discord App
1. Go to: https://discord.com/developers/applications
2. **New Application** → Name: **"Swivimedia"**
3. **OAuth2** → **General**

### 3.2 Set Redirect URIs
Add these EXACT URLs:
```
https://swivimedia.com/api/auth/callback/discord
https://www.swivimedia.com/api/auth/callback/discord
```

Save and copy Client ID & Secret

---

## 🚀 STEP 4: VERCEL DEPLOYMENT

### 4.1 Connect Your Domain
1. Go to: https://vercel.com/new
2. Import your GitHub repo
3. Deploy (will fail first time - that's okay)
4. Go to project **Settings** → **Domains**
5. Add: `swivimedia.com`
6. Follow Vercel's DNS instructions

### 4.2 Add ALL Environment Variables
Go to **Settings** → **Environment Variables** and add each one:

#### Database & Auth:
```
DATABASE_URL
postgresql://postgres:[YOUR-PASSWORD]@db.xaxleljcctobmnwiwxvx.supabase.co:5432/postgres

NEXTAUTH_URL
https://swivimedia.com

NEXTAUTH_SECRET
generate-new-secret-for-production-use-openssl-rand-base64-32
```

#### Supabase:
```
NEXT_PUBLIC_SUPABASE_URL
https://xaxleljcctobmnwiwxvx.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY
[your-actual-anon-key-from-step-1]

SUPABASE_SERVICE_ROLE_KEY
[your-actual-service-role-key-from-step-1]
```

#### OAuth:
```
GOOGLE_CLIENT_ID
[your-google-client-id-from-step-2]

GOOGLE_CLIENT_SECRET
[your-google-client-secret-from-step-2]

DISCORD_CLIENT_ID
[your-discord-client-id-from-step-3]

DISCORD_CLIENT_SECRET
[your-discord-client-secret-from-step-3]
```

---

## 🛠️ STEP 5: DATABASE SETUP FOR PRODUCTION

### 5.1 Setup Database Tables
1. Install Vercel CLI: `npm i -g vercel`
2. Link your project: `vercel link`
3. Pull environment variables: `vercel env pull .env.production`
4. Run migrations: `npx prisma migrate deploy`
5. Optional - Add sample data: `npx prisma db seed`

---

## 🔄 STEP 6: REDEPLOY & TEST

### 6.1 Trigger New Deployment
1. Go to Vercel dashboard
2. **Deployments** → Click **"Redeploy"** on latest
3. Wait for build to complete

### 6.2 Test Your Live Site
Visit: **https://swivimedia.com**

Test these features:
- [ ] Site loads
- [ ] Google login works
- [ ] Discord login works
- [ ] User gets created in database

---

## 🎯 PRODUCTION ENVIRONMENT VARIABLES CHECKLIST

Copy this exact list for Vercel Environment Variables:

```env
# Database
DATABASE_URL=postgresql://postgres:[YOUR-SUPABASE-PASSWORD]@db.xaxleljcctobmnwiwxvx.supabase.co:5432/postgres

# Authentication  
NEXTAUTH_URL=https://swivimedia.com
NEXTAUTH_SECRET=[GENERATE-NEW-SECRET]

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xaxleljcctobmnwiwxvx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]

# Google OAuth
GOOGLE_CLIENT_ID=[YOUR-GOOGLE-CLIENT-ID]
GOOGLE_CLIENT_SECRET=[YOUR-GOOGLE-CLIENT-SECRET]

# Discord OAuth
DISCORD_CLIENT_ID=[YOUR-DISCORD-CLIENT-ID]
DISCORD_CLIENT_SECRET=[YOUR-DISCORD-CLIENT-SECRET]
```

---

## 🆘 QUICK TROUBLESHOOTING

### "Build failed"
- Check all environment variables are added to Vercel
- Check DATABASE_URL has correct password
- Look at build logs for specific error

### "OAuth error"
- Make sure redirect URIs include both:
  - `https://swivimedia.com/api/auth/callback/[provider]`
  - `https://www.swivimedia.com/api/auth/callback/[provider]`

### "Database connection failed"
- Verify DATABASE_URL password is correct
- Check Supabase project is active
- Try connection string from Supabase Settings → Database

---

## 📞 SUPPORT LINKS

- **Your Supabase Project**: https://app.supabase.com/project/xaxleljcctobmnwiwxvx
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Google Cloud Console**: https://console.cloud.google.com
- **Discord Developer Portal**: https://discord.com/developers/applications

## 🎉 YOU'RE LIVE!

Once setup is complete, your Swivi platform will be live at:
**https://swivimedia.com** 🚀
