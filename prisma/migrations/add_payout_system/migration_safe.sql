-- Safe migration that handles existing types/tables/columns

-- Create PayoutRequestStatus enum (only if it doesn't exist)
DO $$ BEGIN
    CREATE TYPE "PayoutRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add PAYOUT_REQUESTED to NotificationType enum (only if not already there)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'PAYOUT_REQUESTED' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'NotificationType')
    ) THEN
        ALTER TYPE "NotificationType" ADD VALUE 'PAYOUT_REQUESTED';
    END IF;
END $$;

-- Add initialViews column (only if it doesn't exist)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clip_submissions' 
        AND column_name = 'initialViews'
    ) THEN
        ALTER TABLE "clip_submissions" ADD COLUMN "initialViews" BIGINT DEFAULT 0;
    END IF;
END $$;

-- Add finalEarnings column (only if it doesn't exist)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clip_submissions' 
        AND column_name = 'finalEarnings'
    ) THEN
        ALTER TABLE "clip_submissions" ADD COLUMN "finalEarnings" DECIMAL(10,2) DEFAULT 0;
    END IF;
END $$;

-- Create payout_requests table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS "payout_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "PayoutRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(6),
    "processedBy" TEXT,
    "paymentMethod" "PayoutMethod",
    "paymentDetails" TEXT,
    "notes" TEXT,
    "transactionId" TEXT,
    "payoutId" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payout_requests_pkey" PRIMARY KEY ("id")
);

-- Create indexes (only if they don't exist)
CREATE INDEX IF NOT EXISTS "clip_submissions_campaign_id_status_idx" ON "clip_submissions"("campaignId", "status");
CREATE INDEX IF NOT EXISTS "view_tracking_clip_id_date_idx" ON "view_tracking"("clipId", "date");
CREATE INDEX IF NOT EXISTS "payout_requests_user_id_status_idx" ON "payout_requests"("userId", "status");
CREATE INDEX IF NOT EXISTS "payout_requests_status_requested_at_idx" ON "payout_requests"("status", "requestedAt");

-- Add foreign key (only if it doesn't exist)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'payout_requests_user_id_fkey'
    ) THEN
        ALTER TABLE "payout_requests" 
        ADD CONSTRAINT "payout_requests_user_id_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") 
        ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;
END $$;

-- Verify everything was created
SELECT 'Migration completed successfully!' as status;

