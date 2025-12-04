-- Add user reply fields to support tickets
-- Run this in your Supabase SQL editor

ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "userReply" TEXT;
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "userReplyAt" TIMESTAMP(6);

