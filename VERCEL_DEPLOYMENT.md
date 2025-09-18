# 🚀 Vercel Deployment Checklist for Swivi

## ✅ Pre-Deployment Setup

### 1. Supabase Database Setup
- [ ] Create Supabase account at [supabase.com](https://supabase.com)
- [ ] Create new project
- [ ] Copy `DATABASE_URL` from Settings → Database
- [ ] Copy API keys from Settings → API
- [ ] Run the setup SQL in Supabase SQL Editor:
  ```sql
  -- Copy and paste contents from scripts/setup-supabase.sql
  ```

### 2. OAuth Applications
- [ ] **Discord**: Create app at [discord.com/developers](https://discord.com/developers/applications)
  - Add redirect: `https://your-app.vercel.app/api/auth/callback/discord`
- [ ] **Google**: Create project at [console.cloud.google.com](https://console.cloud.google.com)
  - Enable Google+ API
  - Add redirect: `https://your-app.vercel.app/api/auth/callback/google`

### 3. File Storage (Choose One)
- [ ] **Option A**: Use Supabase Storage (recommended)
  - Already configured in your project
- [ ] **Option B**: Use Cloudinary
  - Sign up at [cloudinary.com](https://cloudinary.com)
  - Get API credentials

## 🚀 Vercel Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### 2. Deploy to Vercel
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Import Project"
3. Select your GitHub repository
4. Vercel auto-detects Next.js settings ✅

### 3. Add Environment Variables
In your Vercel project settings, add ALL these variables:

```env
# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres

# Authentication
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=your-super-secret-32-character-string

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Database Migration
**Option A: Automatic (Recommended)**
- Vercel will run `prisma migrate deploy` on every build via the `vercel-build` script

**Option B: Manual**
```bash
# Install Vercel CLI
npm i -g vercel

# Link your project
vercel link

# Pull environment variables
vercel env pull .env.local

# Run migration
npm run prisma:migrate:deploy

# Seed database
npm run prisma:seed
```

### 5. Test Your Deployment
- [ ] Visit your Vercel URL
- [ ] Test Discord login
- [ ] Test Google login
- [ ] Check dashboard functionality
- [ ] Test clip submission
- [ ] Verify database data in Supabase

## 🐛 Common Issues & Solutions

### Issue: Database Connection Failed
**Solution**: Make sure your `DATABASE_URL` uses the direct connection string from Supabase, not the pooling URL.

### Issue: OAuth Redirect Error
**Solution**: Update redirect URIs in Discord/Google to match your Vercel domain.

### Issue: Environment Variables Not Working
**Solution**: Redeploy after adding environment variables in Vercel dashboard.

### Issue: Prisma Migration Fails
**Solution**: 
1. Check your database URL
2. Ensure Supabase project is running
3. Run migration manually with Vercel CLI

## 📊 Production Checklist

- [ ] All environment variables set
- [ ] Database migrated and seeded
- [ ] OAuth redirect URIs updated
- [ ] File upload working
- [ ] Authentication working
- [ ] Dashboard accessible
- [ ] API endpoints responding
- [ ] Mobile responsive design working

## 🎯 Next Steps After Deployment

1. **Monitor**: Check Vercel analytics and logs
2. **Custom Domain**: Add your custom domain in Vercel settings
3. **Performance**: Monitor Core Web Vitals
4. **Security**: Review CORS and security headers
5. **Backup**: Set up Supabase backup policies

---

🎉 **Your Swivi platform is now live on Vercel!**
