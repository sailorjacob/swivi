# CREATOR Role Removal Guide

## Overview
The CREATOR role was defined in the original schema but is not used in the current business logic. The platform currently only uses:
- **CLIPPER**: Content creators who submit clips to campaigns
- **ADMIN**: Platform administrators

## What's Been Done ✅
1. **Frontend**: Removed CREATOR from admin user management UI
2. **API**: Updated validation schemas to only accept CLIPPER/ADMIN
3. **Utils**: Removed CREATOR from analytics and statistics

## What Needs To Be Done 🔄

### Step 1: Check Database
Before removing CREATOR from the Prisma schema, verify no users have this role:

```sql
SELECT COUNT(*) FROM users WHERE role = 'CREATOR';
```

### Step 2: Migrate Existing CREATOR Users (if any)
If Step 1 shows users with CREATOR role, update them:

```sql
UPDATE users SET role = 'CLIPPER' WHERE role = 'CREATOR';
```

### Step 3: Remove From Schema
Once confirmed no users have CREATOR role, run the migration script:

```bash
psql $DATABASE_URL -f scripts/remove-creator-role-migration.sql
```

### Step 4: Update Prisma Schema
Remove CREATOR from the UserRole enum in `prisma/schema.prisma`:

```prisma
enum UserRole {
  CLIPPER
  ADMIN
}
```

### Step 5: Generate New Prisma Client
```bash
npx prisma generate
```

## Safety Notes ⚠️
- **DO NOT** remove CREATOR from Prisma schema until database migration is complete
- **ALWAYS** backup database before running migrations
- **TEST** in development environment first

## Current Status
- ✅ Frontend and API updated
- ⏳ Database migration pending
- ⏳ Schema update pending
