-- Fix notifications table name mismatch
-- This script handles the case where the table might exist as "Notification" instead of "notifications"

-- First, check if the table exists with the wrong name and rename it
DO $$
BEGIN
    -- Check if "Notification" table exists (wrong name)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Notification') THEN
        -- Rename the table to the correct name
        ALTER TABLE "Notification" RENAME TO "notifications";
        
        -- Rename the primary key constraint
        ALTER TABLE "notifications" RENAME CONSTRAINT "Notification_pkey" TO "notifications_pkey";
        
        -- Rename the foreign key constraint
        ALTER TABLE "notifications" RENAME CONSTRAINT "Notification_userId_fkey" TO "notifications_userId_fkey";
        
        -- Rename the indexes
        ALTER INDEX "Notification_userId_idx" RENAME TO "notifications_userId_idx";
        ALTER INDEX "Notification_createdAt_idx" RENAME TO "notifications_createdAt_idx";
        ALTER INDEX "Notification_read_idx" RENAME TO "notifications_read_idx";
        
        RAISE NOTICE 'Renamed Notification table to notifications';
    ELSIF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
        -- Table doesn't exist at all, create it
        
        -- First ensure the enum exists
        DO $enum$
        BEGIN
            CREATE TYPE "NotificationType" AS ENUM ('SUBMISSION_APPROVED', 'SUBMISSION_REJECTED', 'PAYOUT_PROCESSED', 'CAMPAIGN_COMPLETED', 'CAMPAIGN_STARTED', 'NEW_CAMPAIGN_AVAILABLE', 'PAYOUT_READY', 'SYSTEM_UPDATE', 'VERIFICATION_SUCCESS', 'VERIFICATION_FAILED');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $enum$;
        
        -- Create the table
        CREATE TABLE "notifications" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "type" "NotificationType" NOT NULL,
            "title" TEXT NOT NULL,
            "message" TEXT NOT NULL,
            "data" JSONB,
            "read" BOOLEAN NOT NULL DEFAULT false,
            "readAt" TIMESTAMP(3),
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
        );

        -- Create indexes
        CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");
        CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");
        CREATE INDEX "notifications_read_idx" ON "notifications"("read");

        -- Add foreign key
        ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        
        RAISE NOTICE 'Created notifications table';
    ELSE
        RAISE NOTICE 'notifications table already exists with correct name';
    END IF;
END $$;
