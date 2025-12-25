-- Migration: Add teamUpdate column to campaigns table
-- This allows admins to create team update announcements for campaigns
-- that will be visible to clippers on the campaign detail page

-- Add the teamUpdate JSONB column
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS "teamUpdate" JSONB;

-- Add a comment for documentation
COMMENT ON COLUMN campaigns."teamUpdate" IS 'JSON field for admin-created team updates/announcements shown to clippers. Format: { title: string, date: string, sections: [{heading?: string, content: string[]}], contentFolders?: [{label: string, url: string}] }';

