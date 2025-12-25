-- Migration: Add teamUpdate and bountiesEnabled columns to campaigns table
-- This allows admins to:
-- 1. Create team update announcements for campaigns (shown to clippers)
-- 2. Toggle bounties/bonuses on/off per campaign

-- Add the teamUpdate JSONB column
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS "teamUpdate" JSONB;

-- Add the bountiesEnabled boolean column (defaults to false)
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS "bountiesEnabled" BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN campaigns."teamUpdate" IS 'JSON field for admin-created team updates/announcements shown to clippers. Format: { title: string, date: string, sections: [{heading?: string, content: string[]}], contentFolders?: [{label: string, url: string}] }';
COMMENT ON COLUMN campaigns."bountiesEnabled" IS 'Whether bounties/bonuses section is shown to clippers for this campaign';

