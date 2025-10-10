-- Complete CREATOR Role Removal Migration
-- Run this script in your production database

-- Step 1: Check current state
\echo 'Checking current user roles...'
SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY role;

-- Step 2: Update any CREATOR users to CLIPPER (if any exist)
\echo 'Updating any CREATOR users to CLIPPER...'
UPDATE users SET role = 'CLIPPER' WHERE role = 'CREATOR';

-- Show how many were updated
\echo 'Users updated:'
SELECT ROW_COUNT() as users_updated;

-- Step 3: Remove CREATOR from enum
\echo 'Creating new enum without CREATOR...'
CREATE TYPE user_role_new AS ENUM ('CLIPPER', 'ADMIN');

\echo 'Updating users table to use new enum...'
ALTER TABLE users ALTER COLUMN role TYPE user_role_new USING role::text::user_role_new;

\echo 'Dropping old enum and renaming new one...'
DROP TYPE user_role;
ALTER TYPE user_role_new RENAME TO user_role;

-- Step 4: Verify the migration
\echo 'Verification - Current user roles:'
SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY role;

\echo 'Verification - Available enum values:'
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'user_role'::regtype ORDER BY enumlabel;

\echo 'Migration completed successfully!'
\echo 'Next steps:'
\echo '1. Update Prisma schema to remove CREATOR'
\echo '2. Run: npx prisma generate'
\echo '3. Test and deploy'
