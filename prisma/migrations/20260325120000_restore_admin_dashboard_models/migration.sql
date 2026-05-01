ALTER TABLE "vendors"
ALTER COLUMN "agent_id" DROP NOT NULL;

ALTER TABLE "agents"
ADD COLUMN IF NOT EXISTS "approval_status" TEXT NOT NULL DEFAULT 'pending';

ALTER TABLE "reels"
ADD COLUMN IF NOT EXISTS "caption" TEXT,
ADD COLUMN IF NOT EXISTS "category_id" INTEGER,
ADD COLUMN IF NOT EXISTS "thumbnail_url" TEXT,
ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "reels"
ALTER COLUMN "expiry_date" DROP NOT NULL;

CREATE TABLE IF NOT EXISTS "payout_requests" (
    "payout_id" SERIAL NOT NULL,
    "agent_id" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "account_number" TEXT NOT NULL,
    "ifsc_code" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payout_requests_pkey" PRIMARY KEY ("payout_id")
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'payout_requests_agent_id_fkey'
          AND table_name = 'payout_requests'
    ) THEN
        ALTER TABLE "payout_requests"
        ADD CONSTRAINT "payout_requests_agent_id_fkey"
        FOREIGN KEY ("agent_id") REFERENCES "agents"("agent_id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
