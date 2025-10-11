-- CreateTable: Add featuredImage column to campaigns
-- This migration adds support for campaign images

-- Add featuredImage column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campaigns' 
        AND column_name = 'featuredImage'
    ) THEN
        ALTER TABLE campaigns ADD COLUMN "featuredImage" TEXT;
    END IF;
END $$;
