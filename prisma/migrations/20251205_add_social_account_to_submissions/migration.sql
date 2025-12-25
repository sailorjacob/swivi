-- Add socialAccountId column to clip_submissions table
-- This links submissions to the verified social account the clipper used for posting
ALTER TABLE "clip_submissions" ADD COLUMN "socialAccountId" TEXT;

-- Add foreign key constraint
ALTER TABLE "clip_submissions" ADD CONSTRAINT "clip_submissions_socialAccountId_fkey" 
  FOREIGN KEY ("socialAccountId") REFERENCES "social_accounts"("id") 
  ON DELETE SET NULL ON UPDATE NO ACTION;

-- Create index for faster lookups
CREATE INDEX "clip_submissions_socialAccountId_idx" ON "clip_submissions"("socialAccountId");























