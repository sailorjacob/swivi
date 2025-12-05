-- Bounty Applications Migration
-- This migration adds support for bounty tier applications

-- Create bounty tier enum
DO $$ BEGIN
    CREATE TYPE "BountyTier" AS ENUM ('TIER_1_HIGH_VOLUME', 'TIER_2_QUALITY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create bounty application status enum
DO $$ BEGIN
    CREATE TYPE "BountyApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create bounty applications table
CREATE TABLE IF NOT EXISTS bounty_applications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    email TEXT NOT NULL,
    platform "SocialPlatform" NOT NULL,
    "profileLink" TEXT NOT NULL,
    tier "BountyTier" NOT NULL,
    "followerCount" INTEGER,
    "followerScreenshotUrl" TEXT,
    "clipLinks" TEXT[] DEFAULT '{}',
    "paymentAddress" TEXT NOT NULL,
    status "BountyApplicationStatus" DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(6),
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_campaign FOREIGN KEY ("campaignId") REFERENCES campaigns(id) ON DELETE CASCADE,
    CONSTRAINT unique_user_campaign_tier UNIQUE ("userId", "campaignId", tier)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "bounty_applications_campaignId_status_idx" ON bounty_applications ("campaignId", status);
CREATE INDEX IF NOT EXISTS "bounty_applications_userId_idx" ON bounty_applications ("userId");

