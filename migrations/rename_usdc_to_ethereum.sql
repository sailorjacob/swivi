-- Migration: Rename USDC to ETHEREUM in PayoutMethod enum
-- Run this on your Supabase database

-- Step 1: Add ETHEREUM as a new enum value (if not exists)
ALTER TYPE "PayoutMethod" ADD VALUE IF NOT EXISTS 'ETHEREUM';

-- Step 2: Update any existing records that use USDC to use ETHEREUM
UPDATE payouts SET method = 'ETHEREUM' WHERE method = 'USDC';
UPDATE payout_requests SET "paymentMethod" = 'ETHEREUM' WHERE "paymentMethod" = 'USDC';

-- Note: PostgreSQL doesn't support removing enum values easily,
-- so USDC will remain in the enum but won't be used.
-- This is fine and won't cause any issues.

-- Run this migration:
-- psql $DATABASE_URL -f migrations/rename_usdc_to_ethereum.sql
-- Or run in Supabase SQL Editor

