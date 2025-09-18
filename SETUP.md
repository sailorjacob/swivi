# 🚀 Swivi Platform Setup Guide

This guide will help you set up the Swivi platform for production with all the systems you requested.

## 📋 Prerequisites

- Node.js 18+ 
- **Supabase account** (REQUIRED for Vercel hosting - provides database + file storage)
- Discord Application (for OAuth)
- Google Cloud Project (for OAuth)
- Cloudinary account (optional, Supabase Storage can replace this)

## 🏗️ Step 1: Environment Setup

1. **Copy environment file:**
   ```bash
   cp env.example .env
   ```

2. **Fill in your environment variables:**

### Database (Supabase - REQUIRED for Vercel)
1. **Sign up at [Supabase](https://supabase.com/)**
2. **Create a new project**
3. **Go to Settings → Database**
4. **Copy the connection string**:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

**💡 Pro tip**: Use the "URI" format from Supabase, not the connection pooling URL for Prisma.

### Authentication
```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-here"
```

### Discord OAuth (Required)
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to OAuth2 → General
4. Add redirect URI: `http://localhost:3000/api/auth/callback/discord`
5. Copy Client ID and Secret:
```env
DISCORD_CLIENT_ID="your_discord_client_id"
DISCORD_CLIENT_SECRET="your_discord_client_secret"
```

### Google OAuth (Required)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Secret:
```env
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
```

### Cloudinary (For file uploads)
1. Sign up at [Cloudinary](https://cloudinary.com/)
2. Get your credentials from the dashboard:
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

### Supabase (REQUIRED - for file storage)
1. **In your Supabase project dashboard**
2. **Go to Settings → API**
3. **Copy the values**:

```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
```

**💡 Note**: You'll use Supabase Storage for file uploads instead of/alongside Cloudinary.

## 🏗️ Step 2: Database Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Generate Prisma client:**
   ```bash
   npm run prisma:generate
   ```

3. **Run database migrations:**
   ```bash
   npm run prisma:migrate
   ```

4. **Seed the database with sample data:**
   ```bash
   npm run prisma:seed
   ```

   Or run both migration and seeding:
   ```bash
   npm run setup
   ```

## 🏗️ Step 3: Development Server

```bash
npm run dev
```

Your app will be running at `http://localhost:3000`

## ✅ What's Included

### 1. ✅ Authentication System
- **Discord & Google OAuth** - Working login system
- **User roles** - CLIPPER, CREATOR, ADMIN
- **Protected routes** - Middleware protection
- **Session management** - JWT with NextAuth

### 2. ✅ Database Schema
- **Users** - Profile, earnings, verification
- **Social Accounts** - Multi-platform linking
- **Campaigns** - Creator campaigns with requirements
- **Clips** - User-submitted content
- **Submissions** - Campaign submissions with approval workflow
- **Payouts** - Payment processing system
- **View Tracking** - Analytics and performance metrics
- **Referrals** - User referral system

### 3. ✅ API Routes
- **`/api/clippers/clips`** - CRUD for clips
- **`/api/clippers/submissions`** - Campaign submissions
- **`/api/clippers/payouts`** - Payout requests
- **`/api/campaigns`** - Active campaigns

### 4. ✅ File Storage Ready
- **Cloudinary integration** - Ready for video/image uploads
- **Supabase storage** - Alternative storage option

### 5. ✅ Clean Design System
- **Theme-aware components** - Dark/light mode support
- **No outlines** - Clean, modern interface
- **Consistent spacing** - Professional look
- **Mobile responsive** - Works on all devices

## 🔄 Next Steps for Production

### Payment Integration
Choose your payment provider:

**Option A: PayPal**
```bash
npm install @paypal/paypal-js
```

**Option B: Stripe**
```bash
npm install stripe @stripe/stripe-js
```

### File Upload Enhancement
Already configured with Cloudinary. For video processing:
```bash
npm install cloudinary
```

### Analytics Enhancement
For advanced tracking:
```bash
npm install @vercel/analytics
```

### Email Notifications
For user notifications:
```bash
npm install nodemailer
# or
npm install resend
```

## 🛠️ Development Tools

- **Prisma Studio** - Database GUI: `npm run prisma:studio`
- **Type checking** - `npm run type-check`
- **Linting** - `npm run lint`

## 🚀 Vercel Deployment (RECOMMENDED)

### Step 1: Deploy to Vercel
1. **Push your code to GitHub**
2. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**
3. **Import your GitHub repository**
4. **Vercel will auto-detect Next.js settings**

### Step 2: Environment Variables
**In your Vercel project settings**, add these environment variables:

```env
# Database (Supabase)
DATABASE_URL="postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres"

# Authentication
NEXTAUTH_URL="https://your-app-name.vercel.app"
NEXTAUTH_SECRET="your-super-secret-key-here"

# OAuth Providers
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
DISCORD_CLIENT_ID="your_discord_client_id"
DISCORD_CLIENT_SECRET="your_discord_client_secret"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"

# Cloudinary (optional)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

### Step 3: Database Setup on Production
Since Vercel is serverless, you need to handle database migrations differently:

#### Option A: Manual Migration (Recommended)
1. **Install Vercel CLI**: `npm i -g vercel`
2. **Link your project**: `vercel link`
3. **Run migrations**: `vercel env pull .env.local && npm run prisma:migrate deploy`

#### Option B: Auto-migration on Deploy
Add this to your `package.json`:
```json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build",
    "vercel-build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

### Step 4: Update OAuth Redirect URIs
Update your OAuth redirect URIs to include your Vercel domain:
- **Discord**: `https://your-app-name.vercel.app/api/auth/callback/discord`
- **Google**: `https://your-app-name.vercel.app/api/auth/callback/google`

## 📁 Project Structure

```
swivi/
├── app/                    # Next.js 14 App Router
│   ├── api/               # API routes
│   ├── clippers/          # Clipper platform
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   ├── ui/               # UI primitives
│   └── clippers/         # Clipper-specific components
├── lib/                  # Utilities
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Database client
│   └── utils.ts          # Helper functions
├── prisma/               # Database schema
├── scripts/              # Setup scripts
└── types/                # TypeScript types
```

## 🎯 Key Features Ready

1. **✅ Login System** - Discord + Google OAuth
2. **✅ Payouts Foundation** - Database schema + API
3. **✅ View Tracker System** - Analytics schema ready
4. **✅ Storage System** - Cloudinary integration
5. **✅ Clean Design** - No outlines, modern UI

You're ready to build! 🎉
