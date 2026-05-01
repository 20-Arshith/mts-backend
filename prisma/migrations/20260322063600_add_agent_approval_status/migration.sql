ALTER TABLE "agents"
ADD COLUMN IF NOT EXISTS "approval_status" TEXT NOT NULL DEFAULT 'pending';
