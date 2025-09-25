# Database Development Guidelines

## Overview
This document outlines best practices for database operations to prevent connection issues while developing new features like view tracking and admin campaign creation.

## Current Configuration

### Database Connection Settings
- **Current**: Supabase with pgBouncer pooling
- **URL Format**: `postgresql://user:pass@host.pooler.supabase.com:6543/db?pgbouncer=true&connection_limit=1`
- **Pool Mode**: Transaction mode (required for prepared statements)

## Best Practices for New Features

### 1. Database Schema Changes
```bash
# Always use Prisma migrations for schema changes
npx prisma migrate dev --name add_view_tracking
npx prisma generate

# For production deployments
npx prisma migrate deploy
```

### 2. Connection Management
- Use the centralized `prisma` instance from `lib/prisma.ts`
- Never create new PrismaClient instances in API routes
- Always use transactions for multi-table operations

### 3. Environment Variables
Current setup requires these variables:
- `DATABASE_URL` - Supabase connection string
- `NEXTAUTH_SECRET` - For authentication
- `DISCORD_CLIENT_ID` & `DISCORD_CLIENT_SECRET` - OAuth

### 4. Testing New Features
```bash
# Test database connectivity before adding new features
npx prisma db pull  # Verify connection
npx prisma generate # Update client
npm run dev        # Test in development
```

## Common Patterns for New Features

### View Tracking Implementation
```typescript
// Use transactions for view tracking
await prisma.$transaction(async (tx) => {
  await tx.viewTracking.create({
    data: { userId, clipId, views, date, platform }
  })
  
  await tx.clip.update({
    where: { id: clipId },
    data: { views: { increment: views } }
  })
})
```

### Admin Campaign Creation
```typescript
// Use proper error handling and transactions
try {
  const campaign = await prisma.campaign.create({
    data: {
      title,
      description,
      budget,
      creator,
      // ... other fields
    }
  })
  return campaign
} catch (error) {
  console.error('Campaign creation failed:', error)
  throw new Error('Failed to create campaign')
}
```

## Troubleshooting

### If You See Connection Errors:
1. Check if Next.js dev server needs restart
2. Verify DATABASE_URL is correct
3. Check Supabase dashboard for connection limits
4. Ensure no hanging Prisma processes: `pkill -f prisma`

### Performance Optimization:
- Use `select` to limit returned fields
- Implement pagination for large datasets
- Use database indexes for frequent queries
- Consider caching for read-heavy operations

## Schema Versioning
- Always increment schema version in migrations
- Test migrations on staging before production
- Keep migration files in version control
- Document breaking changes
