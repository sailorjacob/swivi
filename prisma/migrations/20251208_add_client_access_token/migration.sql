-- Add client access token to campaigns for client portal access
ALTER TABLE "campaigns" ADD COLUMN "clientAccessToken" TEXT;

-- Create unique index for client access token
CREATE UNIQUE INDEX "campaigns_clientAccessToken_key" ON "campaigns"("clientAccessToken");

-- Create index for faster lookups
CREATE INDEX "campaigns_clientAccessToken_idx" ON "campaigns"("clientAccessToken");

