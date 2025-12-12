-- Add platform fee tracking fields to payout_requests
-- These fields store the fee rate and amounts when a payout is completed

-- Fee rate applied (e.g., 0.1000 for 10%)
ALTER TABLE payout_requests 
ADD COLUMN IF NOT EXISTS "platformFeeRate" DECIMAL(5, 4);

-- Actual fee amount taken
ALTER TABLE payout_requests 
ADD COLUMN IF NOT EXISTS "platformFeeAmount" DECIMAL(10, 2);

-- Net amount actually sent to user (amount - fee)
ALTER TABLE payout_requests 
ADD COLUMN IF NOT EXISTS "netAmount" DECIMAL(10, 2);

-- Add comments for documentation
COMMENT ON COLUMN payout_requests."platformFeeRate" IS 'Platform fee rate applied at time of payout (e.g., 0.1000 = 10%)';
COMMENT ON COLUMN payout_requests."platformFeeAmount" IS 'Actual platform fee amount deducted from payout';
COMMENT ON COLUMN payout_requests."netAmount" IS 'Net amount sent to user after platform fee deduction';

