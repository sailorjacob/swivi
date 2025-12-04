-- Add Bitcoin address field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS "bitcoinAddress" TEXT;

-- Update PayoutMethod enum to include ETHEREUM and BITCOIN
-- First, add the new enum values
ALTER TYPE "PayoutMethod" ADD VALUE IF NOT EXISTS 'ETHEREUM';
ALTER TYPE "PayoutMethod" ADD VALUE IF NOT EXISTS 'BITCOIN';

-- Note: USDC was renamed to ETHEREUM. If you have existing USDC records, run:
-- UPDATE payouts SET method = 'ETHEREUM' WHERE method = 'USDC';
-- UPDATE payout_requests SET "paymentMethod" = 'ETHEREUM' WHERE "paymentMethod" = 'USDC';

-- Note: Run this migration on your database to add Bitcoin and Ethereum support
-- Example: psql $DATABASE_URL -f migrations/add_bitcoin_payout_support.sql

