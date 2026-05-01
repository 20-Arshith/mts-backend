-- Keep self-registration and approval columns aligned on existing deployments.
-- This migration is intentionally additive/idempotent so redeploying older DBs is safe.

ALTER TABLE "agents"
    ADD COLUMN IF NOT EXISTS "name" TEXT,
    ADD COLUMN IF NOT EXISTS "mobile" TEXT,
    ADD COLUMN IF NOT EXISTS "email" TEXT,
    ADD COLUMN IF NOT EXISTS "approval_status" TEXT NOT NULL DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS "commission_balance" DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "agents" a
SET "name" = COALESCE(NULLIF(a."name", ''), u."full_name", 'Agent')
FROM "users" u
WHERE a."agent_id" = u."user_id"
  AND (a."name" IS NULL OR a."name" = '');

UPDATE "agents"
SET "name" = 'Agent'
WHERE "name" IS NULL OR "name" = '';

ALTER TABLE "agents" DROP CONSTRAINT IF EXISTS "agents_agent_id_fkey";

CREATE SEQUENCE IF NOT EXISTS "agents_agent_id_seq";

SELECT setval(
    '"agents_agent_id_seq"',
    COALESCE((SELECT MAX("agent_id") FROM "agents"), 0) + 1,
    false
);

ALTER TABLE "agents"
    ALTER COLUMN "agent_id" SET DEFAULT nextval('"agents_agent_id_seq"'),
    ALTER COLUMN "name" SET NOT NULL,
    ALTER COLUMN "approval_status" SET DEFAULT 'pending',
    ALTER COLUMN "commission_balance" SET DEFAULT 0,
    ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

ALTER SEQUENCE "agents_agent_id_seq" OWNED BY "agents"."agent_id";

ALTER TABLE "users"
    ALTER COLUMN "mobile" DROP NOT NULL;

ALTER TABLE "vendors"
    ADD COLUMN IF NOT EXISTS "agent_id" INTEGER,
    ADD COLUMN IF NOT EXISTS "owner_name" TEXT,
    ADD COLUMN IF NOT EXISTS "mobile" TEXT,
    ADD COLUMN IF NOT EXISTS "email" TEXT,
    ADD COLUMN IF NOT EXISTS "approval_status" TEXT NOT NULL DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS "is_available" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "whatsapp_number" TEXT,
    ADD COLUMN IF NOT EXISTS "description" TEXT,
    ADD COLUMN IF NOT EXISTS "address" TEXT,
    ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS "logo_url" TEXT,
    ADD COLUMN IF NOT EXISTS "banner_url" TEXT,
    ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "vendors"
    ALTER COLUMN "agent_id" DROP NOT NULL,
    ALTER COLUMN "approval_status" SET DEFAULT 'pending',
    ALTER COLUMN "is_available" SET DEFAULT false;

ALTER TABLE "vendor_services"
    ADD COLUMN IF NOT EXISTS "approval_status" TEXT NOT NULL DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS "is_available" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS "image_urls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "vendor_services"
    ALTER COLUMN "approval_status" SET DEFAULT 'pending',
    ALTER COLUMN "status" SET DEFAULT 'pending',
    ALTER COLUMN "is_available" SET DEFAULT true,
    ALTER COLUMN "image_urls" SET DEFAULT ARRAY[]::TEXT[];

CREATE UNIQUE INDEX IF NOT EXISTS "agents_mobile_key"
    ON "agents"("mobile");

CREATE UNIQUE INDEX IF NOT EXISTS "agents_email_key"
    ON "agents"("email");

CREATE UNIQUE INDEX IF NOT EXISTS "vendors_mobile_key"
    ON "vendors"("mobile");

CREATE UNIQUE INDEX IF NOT EXISTS "vendors_email_key"
    ON "vendors"("email");

CREATE UNIQUE INDEX IF NOT EXISTS "vendors_whatsapp_number_key"
    ON "vendors"("whatsapp_number");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'vendors_agent_id_fkey'
    ) THEN
        ALTER TABLE "vendors"
            ADD CONSTRAINT "vendors_agent_id_fkey"
            FOREIGN KEY ("agent_id")
            REFERENCES "agents"("agent_id")
            ON DELETE SET NULL
            ON UPDATE CASCADE;
    END IF;
END $$;
