-- Add CronJobLog table for tracking cron executions
CREATE TABLE IF NOT EXISTS "cron_job_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(6),
    "duration" INTEGER,
    "clipsProcessed" INTEGER DEFAULT 0,
    "clipsSuccessful" INTEGER DEFAULT 0,
    "clipsFailed" INTEGER DEFAULT 0,
    "earningsCalculated" DECIMAL(10,2) DEFAULT 0,
    "campaignsCompleted" INTEGER DEFAULT 0,
    "errorMessage" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add index for querying recent logs
CREATE INDEX IF NOT EXISTS "cron_job_logs_jobName_startedAt_idx" ON "cron_job_logs"("jobName", "startedAt" DESC);
CREATE INDEX IF NOT EXISTS "cron_job_logs_status_idx" ON "cron_job_logs"("status");

-- Add autoRejected field to clip_submissions
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clip_submissions' 
        AND column_name = 'autoRejected'
    ) THEN
        ALTER TABLE "clip_submissions" ADD COLUMN "autoRejected" BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add processingStatus field to clip_submissions for optimistic UI
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clip_submissions' 
        AND column_name = 'processingStatus'
    ) THEN
        ALTER TABLE "clip_submissions" ADD COLUMN "processingStatus" TEXT;
    END IF;
END $$;

-- Add index for autoRejected submissions
CREATE INDEX IF NOT EXISTS "clip_submissions_autoRejected_idx" ON "clip_submissions"("autoRejected") WHERE "autoRejected" = true;

