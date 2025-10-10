-- Migration to safely remove CREATOR role from UserRole enum
-- This script should be run ONLY after confirming no users have CREATOR role

-- Step 1: Check if any users have CREATOR role (run this first)
-- SELECT COUNT(*) FROM users WHERE role = 'CREATOR';
-- If count > 0, update those users to CLIPPER first:
-- UPDATE users SET role = 'CLIPPER' WHERE role = 'CREATOR';

-- Step 2: Remove CREATOR from the enum (only if Step 1 shows 0 users)
-- Note: PostgreSQL doesn't allow direct enum value removal, so we need to:

-- Create new enum without CREATOR
CREATE TYPE user_role_new AS ENUM ('CLIPPER', 'ADMIN');

-- Update the table to use the new enum
ALTER TABLE users ALTER COLUMN role TYPE user_role_new USING role::text::user_role_new;

-- Drop the old enum and rename the new one
DROP TYPE user_role;
ALTER TYPE user_role_new RENAME TO user_role;

-- Verify the change
-- SELECT DISTINCT role FROM users;
-- Should only show CLIPPER and ADMIN
