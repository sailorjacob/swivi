-- Add verification fields to clip_submissions table (if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clip_submissions' AND column_name = 'requiresReview') THEN
        ALTER TABLE "clip_submissions" ADD COLUMN "requiresReview" BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clip_submissions' AND column_name = 'reviewReason') THEN
        ALTER TABLE "clip_submissions" ADD COLUMN "reviewReason" TEXT;
    END IF;
END $$;

-- Add campaign completion fields (if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'endDate') THEN
        ALTER TABLE "campaigns" ADD COLUMN "endDate" TIMESTAMP(6);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'completionReason') THEN
        ALTER TABLE "campaigns" ADD COLUMN "completionReason" TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'completedAt') THEN
        ALTER TABLE "campaigns" ADD COLUMN "completedAt" TIMESTAMP(6);
    END IF;
END $$;
