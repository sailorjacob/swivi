-- ============================================================================
-- Migration: Add Reserved Budget for Platform Fees & Bounties
-- This allows campaigns to have a "display budget" vs "effective budget"
-- ============================================================================

-- Add reservedAmount field to campaigns
-- This is the amount reserved for platform fees, bounties, etc.
-- Effective clipper budget = budget - reservedAmount
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS "reservedAmount" DECIMAL(10, 2) DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN campaigns."reservedAmount" IS 
'Amount reserved for platform fees, bounties, etc. Effective clipper budget = budget - reservedAmount. Only visible to admins.';

-- ============================================================================
-- UPDATE YOUR LIVE CAMPAIGN
-- Replace 'YOUR_CAMPAIGN_ID' with the actual campaign ID
-- ============================================================================

-- First, find your campaign:
-- SELECT id, title, budget, spent FROM campaigns WHERE status = 'ACTIVE';

-- Then update it with the reserved amount:
-- For $20,000 budget with $2,900 reserved ($1,000 fee + $1,900 bounty):
/*
UPDATE campaigns 
SET "reservedAmount" = 2900,
    "updatedAt" = NOW()
WHERE id = 'YOUR_CAMPAIGN_ID';
*/

-- ============================================================================
-- VERIFY: Check the effective budget
-- ============================================================================
/*
SELECT 
  id,
  title,
  budget as display_budget,
  "reservedAmount" as reserved,
  budget - COALESCE("reservedAmount", 0) as effective_clipper_budget,
  spent,
  (budget - COALESCE("reservedAmount", 0)) - spent as remaining_clipper_budget,
  ROUND(spent / (budget - COALESCE("reservedAmount", 0)) * 100, 1) as utilization_percent
FROM campaigns 
WHERE status = 'ACTIVE' AND "deletedAt" IS NULL;
*/

