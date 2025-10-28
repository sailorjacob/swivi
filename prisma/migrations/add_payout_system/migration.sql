-- CreateEnum
CREATE TYPE "PayoutRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'PAYOUT_REQUESTED';

-- AlterTable
ALTER TABLE "clip_submissions" 
ADD COLUMN "initialViews" BIGINT DEFAULT 0,
ADD COLUMN "finalEarnings" DECIMAL(10,2) DEFAULT 0;

-- CreateTable
CREATE TABLE "payout_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "PayoutRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(6),
    "processedBy" TEXT,
    "paymentMethod" "PayoutMethod",
    "paymentDetails" TEXT,
    "notes" TEXT,
    "transactionId" TEXT,
    "payoutId" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payout_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "clip_submissions_campaign_id_status_idx" ON "clip_submissions"("campaignId", "status");

-- CreateIndex
CREATE INDEX "view_tracking_clip_id_date_idx" ON "view_tracking"("clipId", "date");

-- CreateIndex
CREATE INDEX "payout_requests_user_id_status_idx" ON "payout_requests"("userId", "status");

-- CreateIndex
CREATE INDEX "payout_requests_status_requested_at_idx" ON "payout_requests"("status", "requestedAt");

-- AddForeignKey
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

