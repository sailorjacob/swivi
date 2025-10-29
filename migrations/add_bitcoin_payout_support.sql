-- Add Bitcoin address field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS "bitcoinAddress" TEXT;

-- Update PayoutMethod enum to include USDC and BITCOIN
-- First, add the new enum values
ALTER TYPE "PayoutMethod" ADD VALUE IF NOT EXISTS 'USDC';
ALTER TYPE "PayoutMethod" ADD VALUE IF NOT EXISTS 'BITCOIN';

-- Note: Run this migration on your database to add Bitcoin and USDC support
-- Example: psql $DATABASE_URL -f migrations/add_bitcoin_payout_support.sql

