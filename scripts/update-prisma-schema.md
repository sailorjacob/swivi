# Update Prisma Schema After Migration

After successfully running the database migration, update your Prisma schema:

## 1. Edit prisma/schema.prisma

Change this:
```prisma
enum UserRole {
  CLIPPER
  CREATOR // TODO: Remove after confirming no users have this role - see scripts/remove-creator-role-migration.sql
  ADMIN
}
```

To this:
```prisma
enum UserRole {
  CLIPPER
  ADMIN
}
```

## 2. Regenerate Prisma Client
```bash
npx prisma generate
```

## 3. Verify Everything Works
```bash
npm run build
```

## 4. Deploy
```bash
git add .
git commit -m "Complete CREATOR role removal - update Prisma schema"
git push origin main
```
