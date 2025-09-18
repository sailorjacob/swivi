# 🎯 Simplified Swivi Setup - Promote.fun Model

## 🌟 **What We Built**

A streamlined clipper platform inspired by **Promote.fun** with:

### ✅ **Core Features**
- **Gated Dashboard** - Email required to access campaigns
- **Campaign Cards** - Clean grid layout with pool amounts, CPM, platforms
- **Campaign Details** - Click to see full requirements and submit clips
- **Email/Password Auth** - Simple signup flow (+ Discord/Google backup)
- **Mobile-First Design** - Ready for app conversion

### ✅ **Flow Overview**
```
Landing Page → Email Signup → Auth → Campaign Dashboard → Submit Clips
```

## 🚀 **Quick Start (5 minutes)**

### 1. Set up Supabase Database
```bash
# 1. Create account at supabase.com
# 2. Create new project
# 3. Copy DATABASE_URL from Settings → Database
```

### 2. Configure Environment
```bash
cp env.example .env
```

Add to `.env`:
```env
# Database
DATABASE_URL="postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres"

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-32-character-secret-key"

# OAuth (optional)
DISCORD_CLIENT_ID=""
DISCORD_CLIENT_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### 3. Initialize Database
```bash
npm install
npm run setup
```

### 4. Start Development
```bash
npm run dev
```

## 📱 **Key Pages**

| Route | Purpose |
|-------|---------|
| `/clippers/landing` | Public landing page with email capture |
| `/clippers/auth` | Sign up / sign in |
| `/clippers/campaigns` | **Main dashboard** - campaign grid |
| Campaign modal | Click any campaign to see details + submit |

## 🎯 **What Makes This Special**

### **1. Gated Access Model**
- Email required to see campaigns (builds database)
- Clean separation between public marketing and private dashboard
- Easy to convert to mobile app

### **2. Campaign-Centric UX**
- Campaigns are the main focus (like Promote.fun)
- Clear pool amounts, CPM rates, platform icons
- One-click to view details and submit

### **3. Simplified Auth**
- Primary: Email/password (simple, works everywhere)
- Backup: Discord/Google OAuth
- No complex onboarding flows

### **4. Mobile-Ready**
- Responsive grid layout
- Touch-friendly buttons
- Card-based design
- Ready for React Native conversion

## 🗄️ **Database Structure**

### **Users Table**
```sql
- id, name, email, password
- role (CLIPPER/CREATOR/ADMIN)
- totalEarnings, totalViews
- verified status
```

### **Campaigns Table**
```sql
- title, description, creator
- pool, spent, minPayout, maxPayout
- platforms[], requirements[]
- status (ACTIVE/PAUSED/COMPLETED)
```

### **Submissions Table**
```sql
- userId, campaignId, clipUrl
- platform, status (PENDING/APPROVED/REJECTED)
- payout amount, paidAt
```

## 🔄 **User Flow**

### **New User:**
1. Lands on `/clippers/landing`
2. Enters email → redirected to `/clippers/auth`
3. Signs up with email/password
4. Redirected to `/clippers/campaigns`
5. Sees campaign grid, clicks campaign
6. Modal opens with details and submit form

### **Returning User:**
1. Goes to `/clippers/campaigns` (protected)
2. If not signed in → redirected to `/clippers/auth`
3. Signs in → back to campaigns
4. Browses and submits to campaigns

## 📊 **Campaign Card Design**

Each campaign card shows:
- **LIVE badge** (if active)
- **Campaign image/title**
- **Creator info** (with avatar)
- **Rate per 1000 views** (CPM)
- **Accepted platforms** (icons)
- **Pool progress** (spent/total with progress bar)
- **Join Campaign button**

## 🎨 **Design System**

- **Colors**: Green primary (#16a34a), monochrome scale
- **Typography**: Light headings, medium body text
- **Cards**: Subtle borders, hover effects
- **No outlines**: Clean, modern look
- **Mobile-first**: Touch-friendly sizes

## 🚀 **Production Deployment**

### **Vercel (Recommended)**
```bash
# 1. Push to GitHub
git push origin main

# 2. Import to Vercel
# 3. Add environment variables
# 4. Deploy!
```

### **Database Migration**
Vercel will automatically run `prisma migrate deploy` on each deployment.

## 📱 **Mobile App Potential**

This design is perfect for converting to:
- **React Native app**
- **PWA** (Progressive Web App)
- **Expo app**

The card-based layout and simplified navigation translate perfectly to mobile.

## 🎯 **Next Steps**

1. **Customize campaigns** - Add your real campaign data
2. **Set up OAuth** - Configure Discord/Google (optional)
3. **Add payment processing** - Stripe/PayPal integration
4. **Deploy to production** - Vercel + Supabase
5. **Build mobile app** - React Native/Expo

---

**🎉 You now have a production-ready clipper platform!**

The simplified flow removes complexity while keeping all the essential features. Users can quickly sign up, browse campaigns, and start earning - just like Promote.fun but with your own branding and features.
