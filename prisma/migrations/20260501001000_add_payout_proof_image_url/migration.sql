ALTER TABLE "payout_requests"
ADD COLUMN IF NOT EXISTS "proof_image_url" TEXT;
