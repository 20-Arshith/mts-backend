ALTER TABLE "vendor_services"
ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'pending';

UPDATE "vendor_services"
SET "status" = CASE
    WHEN LOWER(COALESCE("approval_status", 'pending')) IN ('approved', 'approve', 'accepted', 'appected') THEN 'approved'
    WHEN LOWER(COALESCE("approval_status", 'pending')) IN ('rejected', 'reject', 'declined', 'decline') THEN 'rejected'
    ELSE 'pending'
END;
