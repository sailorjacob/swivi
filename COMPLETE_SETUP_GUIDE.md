# 🚀 Complete Swivi Setup Guide - All Services

## 📋 Quick Overview
This guide will set up:
- ✅ Supabase (Database + File Storage)
- ✅ Authentication (Discord + Google OAuth)
- ✅ Environment Variables for Vercel
- ✅ Database Schema & Seeding

## 🔧 Step 1: Supabase Setup (Database + Storage)

### 1.1 Create Supabase Account & Project
```bash
# 1. Go to https://supabase.com and sign up
# 2. Click "New Project"
# 3. Fill in:
#    - Project name: swivi
#    - Database Password: (save this!)
#    - Region: Choose closest to you
```

### 1.2 Get Supabase Credentials
1. Go to your project dashboard
2. Click **Settings** → **API**
3. Copy these values:

```env
# Add to .env and Vercel Environment Variables
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..." # Your anon key
SUPABASE_SERVICE_ROLE_KEY="eyJ..." # Your service role key
```

### 1.3 Set Up Supabase Storage Buckets
Run this SQL in Supabase SQL Editor:

```sql
-- Create storage buckets for clips and avatars
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('clips', 'clips', true),
  ('avatars', 'avatars', true);

-- Set up RLS policies for clips bucket
CREATE POLICY "Anyone can view clips" ON storage.objects
  FOR SELECT USING (bucket_id = 'clips');

CREATE POLICY "Authenticated users can upload clips" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'clips' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own clips" ON storage.objects
  FOR UPDATE USING (bucket_id = 'clips' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own clips" ON storage.objects
  FOR DELETE USING (bucket_id = 'clips' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Set up RLS policies for avatars bucket
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## 🔐 Step 2: Authentication Setup

### 2.1 Generate NextAuth Secret
```bash
# Run this command to generate a secure secret
openssl rand -base64 32
```

```env
# Add to .env and Vercel
NEXTAUTH_URL="http://localhost:3000" # Change to your domain for production
NEXTAUTH_SECRET="[YOUR-GENERATED-SECRET]"
```

### 2.2 Discord OAuth Setup
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application** → Name it "Swivi"
3. Go to **OAuth2** → **General**
4. Add Redirect URIs:
   ```
   http://localhost:3000/api/auth/callback/discord
   https://your-app.vercel.app/api/auth/callback/discord
   ```
5. Copy credentials:

```env
DISCORD_CLIENT_ID="your_discord_client_id"
DISCORD_CLIENT_SECRET="your_discord_client_secret"
```

### 2.3 Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Choose **Web application**
6. Add Authorized redirect URIs:
   ```
   http://localhost:3000/api/auth/callback/google
   https://your-app.vercel.app/api/auth/callback/google
   ```
7. Copy credentials:

```env
GOOGLE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
```

## 📦 Step 3: Local Development Setup

### 3.1 Install Dependencies & Setup Database
```bash
# Clone and install
git clone https://github.com/yourusername/swivi.git
cd swivi
npm install

# Create .env file
cp env.example .env
# Now edit .env with all your credentials

# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed database with sample data
npm run prisma:seed

# Or do both migration + seeding
npm run setup
```

### 3.2 Start Development Server
```bash
npm run dev
```

Visit http://localhost:3000

## 🚀 Step 4: Vercel Deployment

### 4.1 Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts, then go to Vercel Dashboard
```

### 4.2 Add ALL Environment Variables in Vercel
Go to your project in Vercel Dashboard → Settings → Environment Variables

Add these (with your actual values):

```env
# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres

# Authentication
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-generated-secret

# OAuth
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4.3 Run Production Migrations
```bash
# Pull production env vars
vercel env pull .env.production

# Run migrations against production
npx prisma migrate deploy
```

## ✅ Verification Checklist

Test these features after setup:

1. **Authentication**
   - [ ] Discord login works
   - [ ] Google login works
   - [ ] User profile created in database

2. **Database**
   - [ ] Can view data in Prisma Studio: `npm run prisma:studio`
   - [ ] Seed data is present

3. **File Upload**
   - [ ] Supabase buckets created
   - [ ] Can upload files (when implemented)

4. **Production**
   - [ ] Vercel deployment successful
   - [ ] All environment variables set
   - [ ] OAuth redirects work with production URL

## 🆘 Troubleshooting

### "Invalid DATABASE_URL"
- Make sure you're using the connection string from Supabase Settings → Database
- Use the "URI" format, not the pooling URL

### "OAuth redirect mismatch"
- Ensure redirect URIs match exactly (including trailing slashes)
- Update both Discord and Google with your Vercel URL

### "Build failing on Vercel"
- Check all environment variables are set
- Look at build logs for specific errors
- Ensure DATABASE_URL is accessible from Vercel

## 📝 Quick Reference

### Essential Commands
```bash
# Development
npm run dev

# Database
npm run prisma:studio     # GUI for database
npm run prisma:migrate    # Run migrations
npm run prisma:seed       # Seed data

# Production
vercel                    # Deploy
vercel env pull          # Get production env vars
```

### Key URLs
- Local: http://localhost:3000
- Supabase: https://app.supabase.com/project/[your-project-ref]
- Vercel: https://vercel.com/dashboard
- Discord Apps: https://discord.com/developers/applications
- Google Cloud: https://console.cloud.google.com

You're all set! 🎉 Your Swivi platform is ready with authentication, database, and file storage.
