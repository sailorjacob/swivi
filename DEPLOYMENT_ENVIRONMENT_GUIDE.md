# 🚀 Deployment & Environment Guide

## 📋 Environment Variables Setup

### Required Variables (All Environments)

```bash
# Database - Supabase PostgreSQL
DATABASE_URL="postgresql://user:password@host.pooler.supabase.com:6543/postgres"

# Authentication
NEXTAUTH_SECRET="your-nextauth-secret-here"

# OAuth Providers
DISCORD_CLIENT_ID="your-discord-client-id"
DISCORD_CLIENT_SECRET="your-discord-client-secret"

# Optional OAuth (currently disabled)
# GOOGLE_CLIENT_ID="your-google-client-id"
# GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Environment
NODE_ENV="production"  # or "development"
```

## 🔄 Current .env Status

Your current .env file contains:
```bash
DATABASE_URL="postgresql://postgres.xaxleljcctobmnwiwxvx:UdX2lCrskGltgsbH@aws-1-us-east-2.pooler.supabase.com:6543/postgres"
```

✅ **This is correctly configured for pooled connections**

## 🚀 Vercel Deployment Setup

### 1. Environment Variables in Vercel Dashboard

Go to your Vercel project → Settings → Environment Variables and add:

```bash
DATABASE_URL=postgresql://postgres.xaxleljcctobmnwiwxvx:UdX2lCrskGltgsbH@aws-1-us-east-2.pooler.supabase.com:6543/postgres

NEXTAUTH_SECRET=your-production-nextauth-secret

DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret

NODE_ENV=production
```

### 2. Build Command Configuration

In your `package.json`, ensure these scripts exist:
```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "start": "next start",
    "postinstall": "prisma generate"
  }
}
```

## 🛡️ Prepared Statement Issue Prevention

### What Causes the Issue:
1. **Multiple Connections**: Creating multiple PrismaClient instances
2. **Connection Pooling**: pgBouncer statement caching conflicts
3. **Hot Reloads**: Development server restarts with cached connections

### Prevention Strategies:

#### ✅ DO:
```typescript
// Use the centralized prisma instance
import { prisma } from '@/lib/prisma'

// Use the safe database utilities
import { safeDbOperation, trackViews } from '@/lib/database-utils'

// Wrap operations in transactions
await prisma.$transaction(async (tx) => {
  // Multiple operations here
})
```

#### ❌ DON'T:
```typescript
// Never create new instances
const prisma = new PrismaClient() // ❌ BAD

// Don't forget to handle errors
await prisma.user.findMany() // ❌ Missing error handling
```

## 🔧 Development Workflow

### When Adding New Features (View Tracking, Admin Panels):

1. **Update Schema First**:
```bash
# Edit prisma/schema.prisma
npx prisma migrate dev --name add_view_tracking
npx prisma generate
```

2. **Use Safe Database Operations**:
```typescript
import { trackViews, createCampaign } from '@/lib/database-utils'

// View tracking example
await trackViews({
  userId: session.user.id,
  clipId: clipId,
  views: 100,
  date: new Date(),
  platform: 'YOUTUBE'
})
```

3. **Test Before Committing**:
```bash
npm run dev      # Test locally
npm run build    # Test build process
```

## 🏥 Health Monitoring

### Check Database Connection:
```typescript
import { checkDatabaseHealth } from '@/lib/database-utils'

const health = await checkDatabaseHealth()
if (health.status !== 'healthy') {
  // Handle connection issues
}
```

### Restart Development Server:
```bash
# If you encounter connection issues during development
pkill -f "next dev"
npm run dev
```

## 📊 Database Schema Status

### Current Tables:
- ✅ `users` - User accounts and profiles
- ✅ `accounts` - OAuth provider accounts  
- ✅ `sessions` - User sessions
- ✅ `social_accounts` - Verified social media accounts
- ✅ `social_verifications` - Verification codes and status
- ✅ `campaigns` - Creator campaigns
- ✅ `clips` - User-submitted clips
- ✅ `clip_submissions` - Campaign submissions
- ✅ `view_tracking` - View analytics
- ✅ `payouts` - Payment records
- ✅ `referrals` - Referral system

### Schema Updates Needed for New Features:

#### For Enhanced View Tracking:
```prisma
// Add to existing ViewTracking model
model ViewTracking {
  // ... existing fields
  ipAddress    String?  // Track unique views
  userAgent    String?  // Browser analytics
  referrer     String?  // Traffic source
  sessionId    String?  // Session tracking
}
```

#### For Admin Campaign Management:
```prisma
// Add to existing Campaign model  
model Campaign {
  // ... existing fields
  visibility   CampaignVisibility @default(PUBLIC)
  priority     Int               @default(0)
  tags         String[]          @default([])
  metrics      Json?             // Campaign analytics
}

enum CampaignVisibility {
  PUBLIC
  PRIVATE
  FEATURED
}
```

## 🔐 Security Considerations

### Environment Variables:
- ✅ Database credentials in environment variables
- ✅ OAuth secrets properly secured
- ✅ NextAuth secret configured
- ⚠️  Ensure Vercel environment variables are set to "Production" scope

### Database Access:
- ✅ Connection pooling properly configured
- ✅ Prepared statement issues resolved
- ✅ Graceful connection handling
- ✅ Transaction-based operations for data integrity

## 🚨 Troubleshooting

### Common Issues & Solutions:

1. **"Prepared statement already exists"**
   - ✅ Fixed with pgBouncer configuration
   - Use `connection_limit=1` parameter

2. **"Cannot connect to database"**
   - Check DATABASE_URL format
   - Verify Supabase connection limits
   - Restart development server

3. **"Table does not exist"**
   - Run `npx prisma db push` or `npx prisma migrate deploy`
   - Check if migrations are applied

4. **Build failures on Vercel**
   - Ensure `postinstall` script runs `prisma generate`
   - Check environment variables are set
   - Verify build command includes `prisma generate`

## 📈 Performance Optimization

### For High-Traffic Features:
- Use database indexes for frequent queries
- Implement caching for read-heavy operations
- Use pagination for large datasets
- Consider read replicas for analytics

### Connection Management:
- Reuse the singleton prisma instance
- Use transactions for related operations
- Implement proper error handling and retries
- Monitor connection pool usage
