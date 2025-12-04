-- Add Support Tickets table
-- Run this in your Supabase SQL editor

-- Create enum types
DO $$ BEGIN
    CREATE TYPE "SupportTicketCategory" AS ENUM ('VERIFICATION', 'PAYOUTS', 'CAMPAIGN', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create support_tickets table
CREATE TABLE IF NOT EXISTS "support_tickets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "SupportTicketCategory" NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "imageUrl" TEXT,
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
    "adminResponse" TEXT,
    "respondedBy" TEXT,
    "respondedAt" TIMESTAMP(6),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "support_tickets_userId_status_idx" ON "support_tickets"("userId", "status");
CREATE INDEX IF NOT EXISTS "support_tickets_status_createdAt_idx" ON "support_tickets"("status", "createdAt");

