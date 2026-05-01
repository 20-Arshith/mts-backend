ALTER TABLE "bookings"
ADD COLUMN IF NOT EXISTS "completion_otp" TEXT,
ADD COLUMN IF NOT EXISTS "completion_otp_generated_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "completion_otp_verified_at" TIMESTAMP(3);

UPDATE "bookings"
SET
    "completion_otp" = LPAD(((ABS(("booking_id" * 7919) % 900000)) + 100000)::text, 6, '0'),
    "completion_otp_generated_at" = COALESCE("completion_otp_generated_at", "created_at", CURRENT_TIMESTAMP)
WHERE "completion_otp" IS NULL;
