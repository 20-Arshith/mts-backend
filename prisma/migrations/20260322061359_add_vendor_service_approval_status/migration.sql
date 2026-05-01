ALTER TABLE "vendor_services"
ADD COLUMN IF NOT EXISTS "approval_status" TEXT NOT NULL DEFAULT 'pending';
